"""
Enhanced Tool Selection Guidance with configurable thresholds and context awareness.
Determines optimal processing pipeline based on audio metadata and user input.
"""

from typing import Dict, Any, List, Optional
from dataclasses import dataclass
from llm.heuristics import VoiceAgentHeuristics

@dataclass
class ToolSelectionConfig:
    """Configuration for tool selection thresholds"""
    speech_confidence_threshold: float = 0.7
    multi_speaker_threshold: int = 1
    short_input_threshold: int = 3
    complex_input_threshold: int = 15
    framework_completeness_threshold: float = 0.8

class ToolSelectionGuidance:
    """Enhanced tool selection with context awareness and configurable thresholds."""
    
    def __init__(self, config: ToolSelectionConfig = None):
        self.config = config or ToolSelectionConfig()
        self.heuristics = VoiceAgentHeuristics()
        
        # Tool priority matrix
        self.tool_priorities = {
            'audio_processing': {
                'triggers': ['low_confidence', 'multi_speaker', 'noise'],
                'priority': 1,
                'description': 'Audio enhancement and cleanup'
            },
            'fast_llm': {
                'triggers': ['short_input', 'greeting', 'simple_query'],
                'priority': 2,
                'description': 'Quick acknowledgment and simple responses'
            },
            'smart_llm': {
                'triggers': ['complex_input', 'planning', 'product_recommendation'],
                'priority': 3,
                'description': 'Comprehensive analysis and planning'
            },
            'conversation_manager': {
                'triggers': ['multi_speaker', 'context_needed', 'follow_up'],
                'priority': 4,
                'description': 'Multi-turn conversation handling'
            },
            'product_search': {
                'triggers': ['product_query', 'cart_action', 'inventory_check'],
                'priority': 5,
                'description': 'Product database operations'
            },
            'context_compaction': {
                'triggers': ['long_conversation', 'memory_limit', 'token_threshold'],
                'priority': 6,
                'description': 'Conversation history management'
            }
        }
    
    def select(self, audio_meta: Dict[str, Any], user_input: str, 
               conversation_context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Select optimal processing tools based on context.
        
        Args:
            audio_meta: Audio metadata (confidence, speaker count, etc.)
            user_input: Transcribed user input
            conversation_context: Optional conversation context
            
        Returns:
            Tool selection results with primary tool, fallbacks, and reasoning
        """
        context = conversation_context or {}
        
        # Analyze input characteristics
        input_analysis = self._analyze_input(user_input, audio_meta)
        
        # Determine triggered conditions
        triggered_conditions = self._get_triggered_conditions(audio_meta, user_input, context)
        
        # Select primary tool
        primary_tool = self._select_primary_tool(triggered_conditions, input_analysis)
        
        # Select fallback tools
        fallback_tools = self._select_fallback_tools(primary_tool, triggered_conditions)
        
        # Generate processing strategy
        strategy = self._generate_processing_strategy(primary_tool, fallback_tools, input_analysis)
        
        return {
            'primary_tool': primary_tool,
            'fallback_tools': fallback_tools,
            'strategy': strategy,
            'triggered_conditions': triggered_conditions,
            'input_analysis': input_analysis,
            'confidence': self._calculate_selection_confidence(triggered_conditions),
            'estimated_latency': self._estimate_processing_latency(primary_tool, input_analysis)
        }
    
    def _analyze_input(self, user_input: str, audio_meta: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze input characteristics for tool selection."""
        if not user_input:
            return {'length': 0, 'complexity': 'unknown', 'intent': 'unknown', 'quality': 'poor'}
        
        words = user_input.split()
        word_count = len(words)
        
        # Classify input complexity
        if word_count <= self.config.short_input_threshold:
            complexity = 'simple'
        elif word_count >= self.config.complex_input_threshold:
            complexity = 'complex'
        else:
            complexity = 'medium'
        
        # Get intent classification
        intent = self.heuristics.classify_intent(user_input)
        
        # Assess audio quality
        speech_confidence = audio_meta.get('speech_confidence', 0.0)
        if speech_confidence >= 0.9:
            quality = 'excellent'
        elif speech_confidence >= self.config.speech_confidence_threshold:
            quality = 'good'
        elif speech_confidence >= 0.5:
            quality = 'fair'
        else:
            quality = 'poor'
        
        return {
            'length': word_count,
            'complexity': complexity,
            'intent': intent,
            'quality': quality,
            'speech_confidence': speech_confidence,
            'has_questions': '?' in user_input,
            'has_urgency': intent == 'urgent'
        }
    
    def _get_triggered_conditions(self, audio_meta: Dict[str, Any], 
                                 user_input: str, context: Dict[str, Any]) -> List[str]:
        """Identify triggered conditions for tool selection."""
        conditions = []
        
        # Audio-based conditions
        speech_confidence = audio_meta.get('speech_confidence', 0.0)
        speaker_count = audio_meta.get('speaker_count', 1)
        
        if speech_confidence < self.config.speech_confidence_threshold:
            conditions.append('low_confidence')
        
        if speaker_count > self.config.multi_speaker_threshold:
            conditions.append('multi_speaker')
        
        # Input-based conditions
        if not user_input or len(user_input.strip()) == 0:
            conditions.append('no_input')
            return conditions
        
        word_count = len(user_input.split())
        intent = self.heuristics.classify_intent(user_input)
        
        if word_count <= self.config.short_input_threshold:
            conditions.append('short_input')
        elif word_count >= self.config.complex_input_threshold:
            conditions.append('complex_input')
        
        # Intent-based conditions
        if intent == 'greeting':
            conditions.append('greeting')
        elif intent == 'product':
            conditions.append('product_query')
        elif intent == 'plan':
            conditions.append('planning')
        elif intent == 'urgent':
            conditions.append('urgent')
        elif intent == 'question':
            conditions.append('complex_query')
        
        # Context-based conditions
        conversation_length = context.get('turn_count', 0)
        if conversation_length > 10:
            conditions.append('long_conversation')
        
        if context.get('needs_context', False):
            conditions.append('context_needed')
        
        # Product/cart related
        if any(word in user_input.lower() for word in ['add', 'cart', 'buy', 'purchase']):
            conditions.append('cart_action')
        
        return conditions
    
    def _select_primary_tool(self, conditions: List[str], input_analysis: Dict[str, Any]) -> str:
        """Select the primary processing tool."""
        # Priority-based selection
        tool_scores = {}
        
        for tool_name, tool_info in self.tool_priorities.items():
            score = 0
            
            # Score based on triggered conditions
            for condition in conditions:
                if condition in tool_info['triggers']:
                    score += 10
            
            # Adjust score based on input analysis
            if tool_name == 'audio_processing' and input_analysis['quality'] == 'poor':
                score += 20
            elif tool_name == 'fast_llm' and input_analysis['complexity'] == 'simple':
                score += 15
            elif tool_name == 'smart_llm' and input_analysis['complexity'] in ['medium', 'complex']:
                score += 15
            elif tool_name == 'conversation_manager' and input_analysis.get('has_questions'):
                score += 10
            
            tool_scores[tool_name] = score
        
        # Return highest scoring tool
        if tool_scores:
            return max(tool_scores.items(), key=lambda x: x[1])[0]
        
        return 'smart_llm'  # Default fallback
    
    def _select_fallback_tools(self, primary_tool: str, conditions: List[str]) -> List[str]:
        """Select fallback tools in case primary tool fails."""
        fallbacks = []
        
        # Define fallback chains
        fallback_chains = {
            'audio_processing': ['fast_llm', 'smart_llm'],
            'fast_llm': ['smart_llm'],
            'smart_llm': ['fast_llm'],
            'conversation_manager': ['smart_llm', 'fast_llm'],
            'product_search': ['smart_llm'],
            'context_compaction': ['smart_llm']
        }
        
        # Get predefined fallbacks
        predefined = fallback_chains.get(primary_tool, ['smart_llm'])
        fallbacks.extend(predefined)
        
        # Add condition-specific fallbacks
        if 'low_confidence' in conditions and 'audio_processing' not in fallbacks:
            fallbacks.insert(0, 'audio_processing')
        
        if 'urgent' in conditions and 'fast_llm' not in fallbacks:
            fallbacks.insert(0, 'fast_llm')
        
        # Remove duplicates while preserving order
        seen = set()
        unique_fallbacks = []
        for tool in fallbacks:
            if tool not in seen and tool != primary_tool:
                seen.add(tool)
                unique_fallbacks.append(tool)
        
        return unique_fallbacks[:3]  # Limit to 3 fallbacks
    
    def _generate_processing_strategy(self, primary_tool: str, fallback_tools: List[str], 
                                    input_analysis: Dict[str, Any]) -> Dict[str, Any]:
        """Generate processing strategy based on tool selection."""
        strategy = {
            'approach': 'sequential',  # or 'parallel'
            'timeout': 30.0,
            'retry_count': 1,
            'streaming': False,
            'early_ack': False
        }
        
        # Adjust strategy based on primary tool
        if primary_tool == 'fast_llm':
            strategy['timeout'] = 10.0
            strategy['early_ack'] = False
        elif primary_tool == 'smart_llm':
            strategy['timeout'] = 30.0
            strategy['streaming'] = input_analysis['complexity'] in ['medium', 'complex']
            strategy['early_ack'] = input_analysis['length'] > 6
        elif primary_tool == 'audio_processing':
            strategy['timeout'] = 15.0
            strategy['retry_count'] = 2
        
        # Parallel processing for certain combinations
        if (primary_tool == 'smart_llm' and 
            input_analysis['complexity'] == 'complex' and 
            input_analysis['quality'] == 'good'):
            strategy['approach'] = 'parallel'
            strategy['early_ack'] = True
        
        return strategy
    
    def _calculate_selection_confidence(self, conditions: List[str]) -> float:
        """Calculate confidence in tool selection."""
        if not conditions:
            return 0.5
        
        # Higher confidence for clear, specific conditions
        high_confidence_conditions = [
            'low_confidence', 'multi_speaker', 'urgent', 
            'product_query', 'cart_action'
        ]
        
        clear_conditions = sum(1 for c in conditions if c in high_confidence_conditions)
        total_conditions = len(conditions)
        
        base_confidence = 0.5 + (clear_conditions / max(1, total_conditions)) * 0.4
        
        # Boost confidence for multiple supporting conditions
        if total_conditions >= 3:
            base_confidence += 0.1
        
        return min(1.0, base_confidence)
    
    def _estimate_processing_latency(self, primary_tool: str, input_analysis: Dict[str, Any]) -> Dict[str, float]:
        """Estimate processing latency for the selected tool."""
        base_latencies = {
            'audio_processing': 200,  # ms
            'fast_llm': 500,
            'smart_llm': 2000,
            'conversation_manager': 1500,
            'product_search': 300,
            'context_compaction': 1000
        }
        
        base_latency = base_latencies.get(primary_tool, 1000)
        
        # Adjust based on input complexity
        complexity_multipliers = {
            'simple': 0.8,
            'medium': 1.0,
            'complex': 1.5
        }
        
        multiplier = complexity_multipliers.get(input_analysis['complexity'], 1.0)
        estimated_latency = base_latency * multiplier
        
        return {
            'estimated_ms': estimated_latency,
            'confidence_range': (estimated_latency * 0.7, estimated_latency * 1.3),
            'factors': {
                'base_latency': base_latency,
                'complexity_multiplier': multiplier,
                'tool': primary_tool
            }
        }
    
    def get_tool_info(self, tool_name: str) -> Dict[str, Any]:
        """Get information about a specific tool."""
        return self.tool_priorities.get(tool_name, {
            'triggers': [],
            'priority': 999,
            'description': 'Unknown tool'
        })
    
    def list_available_tools(self) -> List[str]:
        """List all available tools."""
        return list(self.tool_priorities.keys())
