"""
Enhanced Context Window Management with intelligent compaction and conversation analysis.
Handles token limits, conversation summarization, and context preservation.
"""

import asyncio
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass
import time
import json
from llm.heuristics import VoiceAgentHeuristics

@dataclass
class ConversationTurn:
    """Single conversation turn with metadata"""
    user_input: str
    assistant_response: str
    timestamp: float
    session_id: str
    intent: str
    tokens_used: int
    importance_score: float = 0.0

@dataclass
class ContextConfig:
    """Configuration for context management"""
    max_tokens: int = 100000
    compaction_threshold: int = 80000
    min_preserved_turns: int = 5
    max_preserved_turns: int = 20
    importance_decay_factor: float = 0.9

class ContextWindowManagement:
    """Enhanced context management with intelligent compaction and preservation."""
    
    def __init__(self, config: ContextConfig = None, llm_client = None):
        self.config = config or ContextConfig()
        self.llm_client = llm_client
        self.heuristics = VoiceAgentHeuristics()
        
        # Conversation storage
        self.conversation_turns: List[ConversationTurn] = []
        self.session_summaries: Dict[str, str] = {}
        self.preserved_context: Dict[str, Any] = {}
        
        # Token tracking
        self.current_token_count = 0
        self.compaction_history: List[Dict[str, Any]] = []
    
    def add_conversation_turn(self, user_input: str, assistant_response: str, 
                            session_id: str, tokens_used: int = 0) -> ConversationTurn:
        """
        Add a new conversation turn with automatic importance scoring.
        
        Args:
            user_input: User's input text
            assistant_response: Assistant's response
            session_id: Session identifier
            tokens_used: Estimated tokens used for this turn
            
        Returns:
            ConversationTurn object
        """
        # Classify intent and calculate importance
        intent = self.heuristics.classify_intent(user_input)
        importance = self._calculate_importance_score(user_input, assistant_response, intent)
        
        turn = ConversationTurn(
            user_input=user_input,
            assistant_response=assistant_response,
            timestamp=time.time(),
            session_id=session_id,
            intent=intent,
            tokens_used=tokens_used,
            importance_score=importance
        )
        
        self.conversation_turns.append(turn)
        self.current_token_count += tokens_used
        
        # Check if compaction is needed
        if self.should_compact(self.current_token_count):
            asyncio.create_task(self._auto_compact())
        
        return turn
    
    def should_compact(self, token_count: int) -> bool:
        """
        Determine if conversation compaction is needed.
        
        Args:
            token_count: Current token count
            
        Returns:
            True if compaction should be performed
        """
        return token_count > self.config.compaction_threshold
    
    async def compact(self, conversation_history: List[ConversationTurn] = None) -> List[ConversationTurn]:
        """
        Intelligent conversation compaction preserving important context.
        
        Args:
            conversation_history: Optional specific history to compact
            
        Returns:
            Compacted conversation history
        """
        if conversation_history is None:
            conversation_history = self.conversation_turns
        
        if len(conversation_history) <= self.config.min_preserved_turns:
            return conversation_history
        
        # Analyze conversation for compaction strategy
        analysis = self._analyze_conversation_for_compaction(conversation_history)
        
        # Select preservation strategy
        if analysis['has_ongoing_context']:
            return await self._context_aware_compaction(conversation_history, analysis)
        else:
            return await self._importance_based_compaction(conversation_history, analysis)
    
    async def _context_aware_compaction(self, history: List[ConversationTurn], 
                                      analysis: Dict[str, Any]) -> List[ConversationTurn]:
        """Compact while preserving ongoing conversation context."""
        
        # Always preserve recent turns
        recent_count = min(self.config.max_preserved_turns // 2, len(history))
        recent_turns = history[-recent_count:]
        
        # Identify context-critical turns
        critical_turns = []
        for turn in history[:-recent_count]:
            if self._is_context_critical(turn, analysis):
                critical_turns.append(turn)
        
        # Summarize non-critical middle section if needed
        if len(critical_turns) + len(recent_turns) > self.config.max_preserved_turns:
            middle_section = history[len(critical_turns):-recent_count]
            summary = await self._summarize_conversation_section(middle_section)
            
            # Create summary turn
            summary_turn = ConversationTurn(
                user_input="[Conversation Summary]",
                assistant_response=summary,
                timestamp=middle_section[0].timestamp if middle_section else time.time(),
                session_id=history[0].session_id,
                intent="summary",
                tokens_used=len(summary.split()) * 1.3,  # Rough token estimate
                importance_score=0.8
            )
            
            return critical_turns + [summary_turn] + recent_turns
        
        return critical_turns + recent_turns
    
    async def _importance_based_compaction(self, history: List[ConversationTurn], 
                                         analysis: Dict[str, Any]) -> List[ConversationTurn]:
        """Compact based on importance scores with temporal decay."""
        
        # Apply temporal decay to importance scores
        current_time = time.time()
        scored_turns = []
        
        for turn in history:
            age_hours = (current_time - turn.timestamp) / 3600
            decay_factor = self.config.importance_decay_factor ** age_hours
            adjusted_score = turn.importance_score * decay_factor
            scored_turns.append((turn, adjusted_score))
        
        # Sort by adjusted importance
        scored_turns.sort(key=lambda x: x[1], reverse=True)
        
        # Select top turns up to limit
        preserved_count = min(self.config.max_preserved_turns, len(scored_turns))
        preserved_turns = [turn for turn, score in scored_turns[:preserved_count]]
        
        # Sort back to chronological order
        preserved_turns.sort(key=lambda x: x.timestamp)
        
        return preserved_turns
    
    async def _summarize_conversation_section(self, turns: List[ConversationTurn]) -> str:
        """Summarize a section of conversation using LLM."""
        if not turns or not self.llm_client:
            return "[Summary unavailable]"
        
        # Build conversation text
        conversation_text = ""
        for turn in turns:
            conversation_text += f"User: {turn.user_input}\n"
            conversation_text += f"Assistant: {turn.assistant_response}\n\n"
        
        # Create summarization prompt
        prompt = f"""Summarize this Water Bar hydration coaching conversation, preserving:
1. Key user preferences and needs
2. Important product recommendations
3. Ongoing plans or commitments
4. Critical context for future interactions

Conversation to summarize:
{conversation_text}

Summary (2-3 sentences):"""
        
        try:
            response = await self.llm_client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=150,
                temperature=0.3
            )
            
            return response.choices[0].message.content.strip()
            
        except Exception as e:
            return f"[Summary error: {str(e)}]"
    
    def _analyze_conversation_for_compaction(self, history: List[ConversationTurn]) -> Dict[str, Any]:
        """Analyze conversation to determine optimal compaction strategy."""
        if not history:
            return {'has_ongoing_context': False, 'dominant_intents': [], 'context_threads': []}
        
        # Analyze intent distribution
        intent_counts = {}
        for turn in history:
            intent_counts[turn.intent] = intent_counts.get(turn.intent, 0) + 1
        
        dominant_intents = sorted(intent_counts.items(), key=lambda x: x[1], reverse=True)[:3]
        
        # Check for ongoing context threads
        recent_turns = history[-5:]
        has_ongoing_context = any(
            turn.intent in ['plan', 'product', 'question'] for turn in recent_turns
        )
        
        # Identify context threads (simplified)
        context_threads = []
        current_thread = []
        for turn in history:
            if turn.intent in ['plan', 'product'] or 'cart' in turn.user_input.lower():
                current_thread.append(turn)
            else:
                if len(current_thread) >= 2:
                    context_threads.append(current_thread)
                current_thread = []
        
        if len(current_thread) >= 2:
            context_threads.append(current_thread)
        
        return {
            'has_ongoing_context': has_ongoing_context,
            'dominant_intents': [intent for intent, count in dominant_intents],
            'context_threads': context_threads,
            'total_turns': len(history),
            'avg_importance': sum(turn.importance_score for turn in history) / len(history)
        }
    
    def _is_context_critical(self, turn: ConversationTurn, analysis: Dict[str, Any]) -> bool:
        """Determine if a turn is critical for maintaining context."""
        
        # High importance turns are always critical
        if turn.importance_score > 0.8:
            return True
        
        # Turns that establish ongoing context
        if turn.intent in ['plan', 'product'] and 'cart' in turn.assistant_response.lower():
            return True
        
        # Turns in identified context threads
        for thread in analysis['context_threads']:
            if turn in thread:
                return True
        
        # User preference or constraint statements
        preference_keywords = ['prefer', 'like', 'dislike', 'allergic', 'avoid', 'need', 'want']
        if any(keyword in turn.user_input.lower() for keyword in preference_keywords):
            return True
        
        return False
    
    def _calculate_importance_score(self, user_input: str, assistant_response: str, intent: str) -> float:
        """Calculate importance score for a conversation turn."""
        score = 0.5  # Base score
        
        # Intent-based scoring
        intent_scores = {
            'plan': 0.9,
            'product': 0.8,
            'urgent': 0.9,
            'question': 0.6,
            'greeting': 0.2,
            'default': 0.5
        }
        score = intent_scores.get(intent, 0.5)
        
        # Content-based adjustments
        user_lower = user_input.lower()
        response_lower = assistant_response.lower()
        
        # Boost for user preferences/constraints
        if any(word in user_lower for word in ['prefer', 'allergic', 'avoid', 'need', 'must']):
            score += 0.2
        
        # Boost for cart actions
        if any(word in response_lower for word in ['add to cart', 'added', 'cart', 'checkout']):
            score += 0.3
        
        # Boost for detailed responses
        if len(assistant_response.split()) > 100:
            score += 0.1
        
        # Boost for questions that indicate engagement
        if '?' in user_input and len(user_input.split()) > 5:
            score += 0.1
        
        return min(1.0, score)
    
    def get_conversation_context(self, session_id: str = None, 
                               max_turns: int = None) -> List[Dict[str, str]]:
        """
        Get conversation context for LLM prompts.
        
        Args:
            session_id: Optional session filter
            max_turns: Maximum number of turns to return
            
        Returns:
            List of conversation turns formatted for LLM
        """
        # Filter by session if specified
        if session_id:
            relevant_turns = [turn for turn in self.conversation_turns if turn.session_id == session_id]
        else:
            relevant_turns = self.conversation_turns
        
        # Limit number of turns
        if max_turns:
            relevant_turns = relevant_turns[-max_turns:]
        
        # Format for LLM
        context = []
        for turn in relevant_turns:
            context.append({'role': 'user', 'content': turn.user_input})
            context.append({'role': 'assistant', 'content': turn.assistant_response})
        
        return context
    
    def get_session_summary(self, session_id: str) -> Optional[str]:
        """Get summary for a specific session."""
        return self.session_summaries.get(session_id)
    
    def update_session_summary(self, session_id: str, summary: str):
        """Update summary for a session."""
        self.session_summaries[session_id] = summary
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get context management metrics."""
        return {
            'total_turns': len(self.conversation_turns),
            'current_tokens': self.current_token_count,
            'compaction_count': len(self.compaction_history),
            'sessions': len(set(turn.session_id for turn in self.conversation_turns)),
            'avg_importance': (
                sum(turn.importance_score for turn in self.conversation_turns) / 
                len(self.conversation_turns) if self.conversation_turns else 0
            ),
            'last_compaction': (
                self.compaction_history[-1]['timestamp'] if self.compaction_history else None
            )
        }
    
    async def _auto_compact(self):
        """Automatically compact conversation when threshold is reached."""
        try:
            compacted = await self.compact()
            
            # Update state
            old_count = len(self.conversation_turns)
            self.conversation_turns = compacted
            
            # Recalculate token count
            self.current_token_count = sum(turn.tokens_used for turn in compacted)
            
            # Record compaction
            self.compaction_history.append({
                'timestamp': time.time(),
                'turns_before': old_count,
                'turns_after': len(compacted),
                'tokens_saved': self.config.compaction_threshold - self.current_token_count
            })
            
        except Exception as e:
            # Log error but don't fail the conversation
            print(f"Auto-compaction failed: {e}")
    
    def clear_session(self, session_id: str):
        """Clear all data for a specific session."""
        self.conversation_turns = [
            turn for turn in self.conversation_turns 
            if turn.session_id != session_id
        ]
        
        if session_id in self.session_summaries:
            del self.session_summaries[session_id]
        
        # Recalculate token count
        self.current_token_count = sum(turn.tokens_used for turn in self.conversation_turns)
