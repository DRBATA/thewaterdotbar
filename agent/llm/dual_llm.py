"""
Enhanced Dual LLM Processor with modern OpenAI API, streaming, and early ACK triggers.
Supports fast acknowledgments and smart full responses with parallel processing.
"""

import asyncio
import time
from typing import Dict, Any, AsyncGenerator, Optional, List
from dataclasses import dataclass
import openai
from openai import AsyncOpenAI
from tools.telemetry import stats
from llm.heuristics import VoiceAgentHeuristics

@dataclass
class LLMConfig:
    """Configuration for LLM models"""
    model: str
    max_tokens: int
    temperature: float
    timeout: float = 30.0

@dataclass
class ProcessingResult:
    """Result from dual LLM processing"""
    immediate_ack: str
    full_plan: str
    fast_latency_ms: float
    smart_latency_ms: float
    tokens_used: Dict[str, int]
    triggered_early: bool = False

class DualLLMProcessor:
    """Fast ACK + smart full-response with streaming and early trigger."""
    
    def __init__(self, fast_config: LLMConfig, smart_config: LLMConfig, api_key: str):
        self.fast_cfg = fast_config
        self.smart_cfg = smart_config
        self.heuristics = VoiceAgentHeuristics()
        
        # Initialize modern OpenAI client
        self.client = AsyncOpenAI(api_key=api_key)
        
        # State tracking
        self.fast_called = False
        self.current_session_id: Optional[str] = None
        self.conversation_history: List[Dict[str, str]] = []
        
        # Performance tracking
        self.metrics = {
            'fast_calls': 0,
            'smart_calls': 0,
            'early_triggers': 0,
            'parallel_successes': 0
        }
    
    async def process(self, user_input: str, session_id: str = None, 
                     trigger_early: bool = False) -> ProcessingResult:
        """
        Process user input with dual LLM approach.
        
        Args:
            user_input: User's text input
            session_id: Session identifier for context
            trigger_early: Whether to trigger early ACK based on partial transcript
            
        Returns:
            ProcessingResult with both fast and smart responses
        """
        self.current_session_id = session_id
        start_time = time.perf_counter()
        
        # Determine processing strategy
        should_fast = self.heuristics.use_fast(user_input) or trigger_early
        
        # Create parallel tasks
        tasks = []
        
        if should_fast:
            fast_task = asyncio.create_task(self._fast_ack(user_input))
            tasks.append(('fast', fast_task))
        
        smart_task = asyncio.create_task(self._smart_response_stream(user_input))
        tasks.append(('smart', smart_task))
        
        # Process results as they complete
        results = {'immediate_ack': '', 'full_plan': '', 'fast_latency_ms': 0, 
                  'smart_latency_ms': 0, 'tokens_used': {}, 'triggered_early': trigger_early}
        
        for task_type, task in tasks:
            try:
                if task_type == 'fast':
                    fast_start = time.perf_counter()
                    ack_result = await task
                    results['immediate_ack'] = ack_result['content']
                    results['fast_latency_ms'] = (time.perf_counter() - fast_start) * 1000
                    results['tokens_used']['fast'] = ack_result['tokens']
                    
                    stats.timing('llm.fast_latency_ms', results['fast_latency_ms'])
                    self.metrics['fast_calls'] += 1
                    
                elif task_type == 'smart':
                    smart_start = time.perf_counter()
                    smart_result = await task
                    results['full_plan'] = smart_result['content']
                    results['smart_latency_ms'] = (time.perf_counter() - smart_start) * 1000
                    results['tokens_used']['smart'] = smart_result['tokens']
                    
                    stats.timing('llm.smart_latency_ms', results['smart_latency_ms'])
                    self.metrics['smart_calls'] += 1
                    
            except Exception as e:
                stats.increment(f'llm.{task_type}_error')
                if task_type == 'fast':
                    results['immediate_ack'] = "I'm processing your request..."
                else:
                    results['full_plan'] = f"Error processing request: {str(e)}"
        
        # Update conversation history
        self._update_conversation_history(user_input, results['full_plan'])
        
        # Track overall metrics
        total_time = (time.perf_counter() - start_time) * 1000
        stats.timing('llm.total_processing_ms', total_time)
        
        if trigger_early:
            self.metrics['early_triggers'] += 1
            stats.increment('llm.early_trigger_used')
        
        return ProcessingResult(**results)
    
    async def _fast_ack(self, user_input: str) -> Dict[str, Any]:
        """Generate fast acknowledgment response."""
        if not self.heuristics.use_fast(user_input):
            return {'content': '', 'tokens': 0}
        
        stats.increment('llm.fast_ack_called')
        
        # Context-aware fast prompts
        fast_prompts = {
            'hydration': "I'm analyzing your hydration needs...",
            'product': "Let me find the perfect products for you...",
            'plan': "I'm creating your personalized plan...",
            'question': "Great question! Let me think about that...",
            'default': "I'm processing your request..."
        }
        
        # Determine prompt type
        prompt_type = self.heuristics.classify_intent(user_input)
        base_ack = fast_prompts.get(prompt_type, fast_prompts['default'])
        
        messages = [
            {
                'role': 'system',
                'content': (
                    "You are a Water Bar AI hydration coach. Provide a brief, "
                    "enthusiastic acknowledgment that you're processing the user's request. "
                    "Be warm and professional. Maximum 15 words."
                )
            },
            {
                'role': 'user',
                'content': f"User said: '{user_input}'. Acknowledge briefly that you're processing."
            }
        ]
        
        try:
            response = await self.client.chat.completions.create(
                model=self.fast_cfg.model,
                messages=messages,
                max_tokens=self.fast_cfg.max_tokens,
                temperature=self.fast_cfg.temperature,
                timeout=self.fast_cfg.timeout
            )
            
            content = response.choices[0].message.content.strip()
            tokens = response.usage.total_tokens if response.usage else 0
            
            return {'content': content, 'tokens': tokens}
            
        except Exception as e:
            stats.increment('llm.fast_ack_error')
            return {'content': base_ack, 'tokens': 0}
    
    async def _smart_response_stream(self, user_input: str) -> Dict[str, Any]:
        """Generate comprehensive smart response with streaming."""
        stats.increment('llm.smart_response_called')
        
        # Build context-aware system prompt
        system_prompt = self._build_smart_system_prompt()
        
        # Build conversation context
        messages = self._build_conversation_context(user_input, system_prompt)
        
        try:
            # Stream the response
            stream = await self.client.chat.completions.create(
                model=self.smart_cfg.model,
                messages=messages,
                max_tokens=self.smart_cfg.max_tokens,
                temperature=self.smart_cfg.temperature,
                stream=True,
                timeout=self.smart_cfg.timeout
            )
            
            chunks = []
            total_tokens = 0
            
            async for chunk in stream:
                if chunk.choices[0].delta.content:
                    content = chunk.choices[0].delta.content
                    chunks.append(content)
                    
                    # Yield partial content for real-time UI updates
                    # (This would be handled by the calling function)
                    
                if chunk.usage:
                    total_tokens = chunk.usage.total_tokens
            
            full_content = ''.join(chunks)
            
            # Validate response completeness
            completeness_score = self.heuristics.check_framework_completeness(full_content)
            stats.gauge('llm.framework_completeness', completeness_score)
            
            return {'content': full_content, 'tokens': total_tokens}
            
        except Exception as e:
            stats.increment('llm.smart_response_error')
            return {
                'content': f"I apologize, but I encountered an error processing your request. Please try again.",
                'tokens': 0
            }
    
    def _build_smart_system_prompt(self) -> str:
        """Build comprehensive system prompt for smart response."""
        return """You are an AI Hydration Coach for The Water Bar, specializing in personalized hydration and wellness optimization.

CORE CAPABILITIES:
- Analyze user hydration needs based on activity, environment, and goals
- Recommend specific products from Water Bar's inventory
- Create 1-day or 3-day hydration plans
- Provide scientific insights on hydration, electrolytes, and wellness
- Add recommended products to user's cart

RESPONSE FRAMEWORK:
1. ASSESS: Understand user's current state, activity level, and hydration needs
2. RECOMMEND: Suggest specific products with clear rationale
3. PLAN: Create actionable hydration timeline if appropriate
4. EDUCATE: Share relevant insights without overwhelming detail

PRODUCT KNOWLEDGE:
- Access to full Water Bar inventory (electrolytes, kombuchas, functional beverages)
- Understand nutritional profiles and optimal use cases
- Can add products to cart via voice commands

COMMUNICATION STYLE:
- Warm, knowledgeable, and practical
- Focus on actionable recommendations
- Explain the 'why' behind suggestions
- Aim for substantial cart value through comprehensive planning

Always prioritize user health and satisfaction while building meaningful hydration plans."""
    
    def _build_conversation_context(self, user_input: str, system_prompt: str) -> List[Dict[str, str]]:
        """Build conversation context with history."""
        messages = [{'role': 'system', 'content': system_prompt}]
        
        # Add recent conversation history (last 5 exchanges)
        recent_history = self.conversation_history[-10:] if self.conversation_history else []
        for exchange in recent_history:
            messages.append({'role': 'user', 'content': exchange['user']})
            messages.append({'role': 'assistant', 'content': exchange['assistant']})
        
        # Add current user input
        messages.append({'role': 'user', 'content': user_input})
        
        return messages
    
    def _update_conversation_history(self, user_input: str, assistant_response: str):
        """Update conversation history with latest exchange."""
        self.conversation_history.append({
            'user': user_input,
            'assistant': assistant_response,
            'timestamp': time.time(),
            'session_id': self.current_session_id
        })
        
        # Keep only recent history to manage context window
        if len(self.conversation_history) > 20:
            self.conversation_history = self.conversation_history[-15:]
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get current performance metrics."""
        return {
            **self.metrics,
            'conversation_length': len(self.conversation_history),
            'current_session': self.current_session_id
        }
    
    async def reset_session(self, session_id: str = None):
        """Reset session state and conversation history."""
        self.current_session_id = session_id
        self.conversation_history = []
        self.fast_called = False
        stats.increment('llm.session_reset')
