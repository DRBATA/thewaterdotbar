"""
Voice Agent Heuristics for intelligent processing decisions.
Determines when to use fast ACK, tool selection, and framework completeness checking.
"""

import re
from typing import Dict, List, Any
from dataclasses import dataclass

@dataclass
class HeuristicThresholds:
    """Configurable thresholds for heuristic decisions"""
    fast_ack_word_threshold: int = 6
    confidence_threshold: float = 0.7
    framework_completeness_threshold: float = 0.8
    early_trigger_words: int = 4

class VoiceAgentHeuristics:
    """Intelligent heuristics for voice agent processing decisions."""
    
    def __init__(self, thresholds: HeuristicThresholds = None):
        self.thresholds = thresholds or HeuristicThresholds()
        
        # Intent classification patterns
        self.intent_patterns = {
            'hydration': [
                r'\b(hydrat|water|drink|thirst|dehydrat)\w*\b',
                r'\b(how much|daily|intake|volume)\b',
                r'\b(sweat|exercise|workout|run|gym)\b'
            ],
            'product': [
                r'\b(product|item|buy|purchase|add|cart)\b',
                r'\b(electrolyte|kombucha|drink|beverage)\b',
                r'\b(recommend|suggest|best|good)\b'
            ],
            'plan': [
                r'\b(plan|schedule|routine|program)\b',
                r'\b(day|daily|week|weekly|morning|evening)\b',
                r'\b(create|build|make|design)\b'
            ],
            'question': [
                r'\b(what|why|how|when|where|which)\b',
                r'\b(explain|tell|about|info|information)\b',
                r'\b(\?|question|ask)\b'
            ],
            'greeting': [
                r'\b(hi|hello|hey|good morning|good afternoon)\b',
                r'\b(start|begin|help|assist)\b'
            ],
            'urgent': [
                r'\b(urgent|emergency|asap|quickly|fast|now)\b',
                r'\b(need|must|have to|immediately)\b'
            ]
        }
        
        # Framework completeness keywords
        self.framework_keywords = {
            'assessment': ['assess', 'analyze', 'evaluate', 'current', 'state', 'needs'],
            'recommendation': ['recommend', 'suggest', 'product', 'best', 'optimal'],
            'planning': ['plan', 'schedule', 'timeline', 'routine', 'daily'],
            'education': ['because', 'why', 'science', 'research', 'benefit', 'effect'],
            'action': ['add', 'cart', 'buy', 'purchase', 'order', 'checkout']
        }
        
        # Fast ACK trigger phrases
        self.fast_triggers = [
            'i need', 'help me', 'can you', 'what should',
            'recommend', 'suggest', 'best for', 'good for'
        ]
    
    def use_fast(self, user_input: str) -> bool:
        """
        Determine if fast ACK should be used.
        
        Args:
            user_input: User's text input
            
        Returns:
            True if fast ACK should be triggered
        """
        if not user_input or len(user_input.strip()) == 0:
            return False
        
        words = user_input.lower().split()
        
        # Use fast ACK for longer inputs (more processing time needed)
        if len(words) >= self.thresholds.fast_ack_word_threshold:
            return True
        
        # Use fast ACK for urgent requests
        if self.classify_intent(user_input) == 'urgent':
            return True
        
        # Use fast ACK for complex requests (questions, plans)
        intent = self.classify_intent(user_input)
        if intent in ['plan', 'question', 'product']:
            return True
        
        # Use fast ACK if input contains trigger phrases
        user_lower = user_input.lower()
        for trigger in self.fast_triggers:
            if trigger in user_lower:
                return True
        
        return False
    
    def classify_intent(self, user_input: str) -> str:
        """
        Classify user intent based on input patterns.
        
        Args:
            user_input: User's text input
            
        Returns:
            Intent classification string
        """
        if not user_input:
            return 'unknown'
        
        user_lower = user_input.lower()
        intent_scores = {}
        
        # Score each intent based on pattern matches
        for intent, patterns in self.intent_patterns.items():
            score = 0
            for pattern in patterns:
                matches = len(re.findall(pattern, user_lower, re.IGNORECASE))
                score += matches
            intent_scores[intent] = score
        
        # Return highest scoring intent (or default)
        if intent_scores:
            best_intent = max(intent_scores.items(), key=lambda x: x[1])
            if best_intent[1] > 0:
                return best_intent[0]
        
        return 'default'
    
    def should_trigger_early(self, partial_transcript: str, word_count: int) -> bool:
        """
        Determine if early ACK should be triggered based on partial transcript.
        
        Args:
            partial_transcript: Partial transcript from ASR
            word_count: Current word count
            
        Returns:
            True if early ACK should be triggered
        """
        if word_count < self.thresholds.early_trigger_words:
            return False
        
        # Trigger early for clear intent signals
        intent = self.classify_intent(partial_transcript)
        if intent in ['urgent', 'product', 'plan']:
            return True
        
        # Trigger early for trigger phrases
        partial_lower = partial_transcript.lower()
        for trigger in self.fast_triggers:
            if trigger in partial_lower:
                return True
        
        return False
    
    def check_framework_completeness(self, response: str) -> float:
        """
        Check if response follows the complete framework.
        
        Args:
            response: AI response to evaluate
            
        Returns:
            Completeness score (0.0 - 1.0)
        """
        if not response:
            return 0.0
        
        response_lower = response.lower()
        framework_scores = {}
        
        # Check for each framework component
        for component, keywords in self.framework_keywords.items():
            score = 0
            for keyword in keywords:
                if keyword in response_lower:
                    score += 1
            
            # Normalize score (0-1 based on keyword presence)
            framework_scores[component] = min(1.0, score / len(keywords))
        
        # Calculate overall completeness
        if framework_scores:
            completeness = sum(framework_scores.values()) / len(framework_scores)
        else:
            completeness = 0.0
        
        # Bonus for response length (comprehensive responses)
        length_bonus = min(0.2, len(response.split()) / 500)  # Up to 20% bonus
        
        return min(1.0, completeness + length_bonus)
    
    def get_processing_priority(self, user_input: str, audio_meta: Dict[str, Any]) -> str:
        """
        Determine processing priority based on input and audio metadata.
        
        Args:
            user_input: User's text input
            audio_meta: Audio metadata (confidence, speaker count, etc.)
            
        Returns:
            Priority level: 'high', 'medium', 'low'
        """
        # High priority for urgent requests
        if self.classify_intent(user_input) == 'urgent':
            return 'high'
        
        # High priority for clear, confident audio
        if audio_meta.get('speech_confidence', 0) > 0.9:
            return 'high'
        
        # Medium priority for product/plan requests
        intent = self.classify_intent(user_input)
        if intent in ['product', 'plan']:
            return 'medium'
        
        # Low priority for unclear audio or simple greetings
        if (audio_meta.get('speech_confidence', 0) < self.thresholds.confidence_threshold or
            intent == 'greeting'):
            return 'low'
        
        return 'medium'
    
    def should_use_streaming(self, user_input: str) -> bool:
        """
        Determine if streaming response should be used.
        
        Args:
            user_input: User's text input
            
        Returns:
            True if streaming should be used
        """
        # Use streaming for complex requests that benefit from progressive display
        intent = self.classify_intent(user_input)
        if intent in ['plan', 'question', 'product']:
            return True
        
        # Use streaming for longer inputs (likely complex responses)
        if len(user_input.split()) >= 10:
            return True
        
        return False
    
    def get_timeout_recommendation(self, user_input: str, intent: str = None) -> float:
        """
        Recommend timeout based on input complexity.
        
        Args:
            user_input: User's text input
            intent: Classified intent (optional)
            
        Returns:
            Recommended timeout in seconds
        """
        if not intent:
            intent = self.classify_intent(user_input)
        
        # Timeout recommendations by intent
        timeout_map = {
            'urgent': 15.0,      # Fast processing for urgent requests
            'greeting': 10.0,    # Quick responses for greetings
            'product': 20.0,     # Medium time for product recommendations
            'plan': 30.0,        # Longer time for comprehensive plans
            'question': 25.0,    # Medium-long for educational responses
            'default': 20.0
        }
        
        base_timeout = timeout_map.get(intent, 20.0)
        
        # Adjust based on input length
        word_count = len(user_input.split())
        if word_count > 20:
            base_timeout += 10.0  # Extra time for complex inputs
        
        return min(45.0, base_timeout)  # Cap at 45 seconds
    
    def analyze_conversation_context(self, conversation_history: List[Dict[str, str]]) -> Dict[str, Any]:
        """
        Analyze conversation context for better decision making.
        
        Args:
            conversation_history: List of conversation exchanges
            
        Returns:
            Context analysis results
        """
        if not conversation_history:
            return {'stage': 'initial', 'complexity': 'low', 'user_engaged': False}
        
        # Analyze conversation stage
        turn_count = len(conversation_history)
        if turn_count <= 2:
            stage = 'initial'
        elif turn_count <= 5:
            stage = 'exploration'
        else:
            stage = 'deep_engagement'
        
        # Analyze complexity trend
        recent_inputs = [exchange.get('user', '') for exchange in conversation_history[-3:]]
        avg_length = sum(len(inp.split()) for inp in recent_inputs) / len(recent_inputs)
        
        if avg_length > 15:
            complexity = 'high'
        elif avg_length > 8:
            complexity = 'medium'
        else:
            complexity = 'low'
        
        # Check user engagement
        user_engaged = turn_count > 3 and avg_length > 5
        
        return {
            'stage': stage,
            'complexity': complexity,
            'user_engaged': user_engaged,
            'turn_count': turn_count,
            'avg_input_length': avg_length
        }
