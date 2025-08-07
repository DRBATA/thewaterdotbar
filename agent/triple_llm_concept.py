"""
Triple LLM Concept - Tiered Response System
Progressive acknowledgment based on user input complexity and length.
"""

import asyncio
import time
from typing import Dict, List, Tuple
from dataclasses import dataclass

@dataclass
class TripleLLMConfig:
    """Configuration for triple response system"""
    # Word count thresholds
    instant_ack_threshold: int = 2      # "I'm listening..."
    smart_ack_threshold: int = 6        # "Let me find products..."
    full_response_threshold: int = 10   # Complete coaching response
    
    # Timing targets (milliseconds)
    instant_ack_target_ms: int = 150
    smart_ack_target_ms: int = 400
    full_response_target_ms: int = 2000
    
    # Quality thresholds
    confidence_threshold: float = 0.7
    complexity_threshold: float = 0.5

class TripleLLMProcessor:
    """
    Triple-tier response system for optimal user experience.
    
    TIER 1: INSTANT ACK (2+ words)
    - Ultra-fast acknowledgment
    - Shows agent is listening
    - Generic but warm responses
    
    TIER 2: SMART ACK (6+ words) 
    - Context-aware acknowledgment
    - Shows understanding of intent
    - Specific to user's request type
    
    TIER 3: FULL RESPONSE (10+ words)
    - Complete Water Bar coaching
    - Framework-based response
    - Comprehensive recommendations
    """
    
    def __init__(self, config: TripleLLMConfig = None):
        self.config = config or TripleLLMConfig()
        
        # Response templates for each tier
        self.instant_responses = [
            "I'm listening...",
            "Go ahead...",
            "I'm here...",
            "Yes?"
        ]
        
        self.smart_responses = {
            'product': "Let me find the perfect products for you...",
            'hydration': "I'm analyzing your hydration needs...",
            'cart': "I'm checking your cart...",
            'plan': "I'm creating your personalized plan...",
            'question': "Great question! Let me think about that...",
            'urgent': "I understand this is urgent - processing now...",
            'default': "I'm processing your request..."
        }
        
        # Performance tracking
        self.response_stats = {
            'instant_count': 0,
            'smart_count': 0,
            'full_count': 0,
            'avg_times': {'instant': [], 'smart': [], 'full': []}
        }
    
    async def process_partial_transcript(self, partial_text: str, 
                                       confidence: float = 1.0) -> Dict[str, any]:
        """
        Process partial transcript and determine appropriate response tier.
        
        Args:
            partial_text: Current partial transcript
            confidence: Speech recognition confidence
            
        Returns:
            Response tier decision and content
        """
        word_count = len(partial_text.split())
        complexity = self._assess_complexity(partial_text)
        intent = self._classify_intent(partial_text)
        
        # Determine response tier
        tier = self._determine_tier(word_count, confidence, complexity, intent)
        
        # Generate appropriate response
        response = await self._generate_tier_response(tier, partial_text, intent)
        
        return {
            'tier': tier,
            'response': response,
            'word_count': word_count,
            'confidence': confidence,
            'complexity': complexity,
            'intent': intent,
            'should_continue': tier < 3  # Continue listening for higher tiers
        }
    
    def _determine_tier(self, word_count: int, confidence: float, 
                       complexity: float, intent: str) -> int:
        """Determine which response tier to use."""
        
        # Tier 1: Instant ACK (2+ words, high confidence)
        if (word_count >= self.config.instant_ack_threshold and 
            word_count < self.config.smart_ack_threshold and
            confidence >= self.config.confidence_threshold):
            return 1
        
        # Tier 2: Smart ACK (6+ words, clear intent)
        elif (word_count >= self.config.smart_ack_threshold and 
              word_count < self.config.full_response_threshold and
              (confidence >= self.config.confidence_threshold or 
               intent != 'unknown')):
            return 2
        
        # Tier 3: Full Response (10+ words or complex/urgent)
        elif (word_count >= self.config.full_response_threshold or
              complexity > self.config.complexity_threshold or
              intent == 'urgent'):
            return 3
        
        # Default to Tier 1 for unclear cases
        return 1
    
    async def _generate_tier_response(self, tier: int, partial_text: str, 
                                    intent: str) -> str:
        """Generate response for the determined tier."""
        start_time = time.perf_counter()
        
        if tier == 1:
            # Instant ACK - ultra-fast, generic
            response = self.instant_responses[0]  # Could rotate or randomize
            self.response_stats['instant_count'] += 1
            
        elif tier == 2:
            # Smart ACK - context-aware
            response = self.smart_responses.get(intent, self.smart_responses['default'])
            self.response_stats['smart_count'] += 1
            
        else:  # tier == 3
            # Full Response - would call your existing LLM
            response = await self._generate_full_response(partial_text, intent)
            self.response_stats['full_count'] += 1
        
        # Track timing
        response_time = (time.perf_counter() - start_time) * 1000
        self.response_stats['avg_times'][self._tier_name(tier)].append(response_time)
        
        return response
    
    async def _generate_full_response(self, partial_text: str, intent: str) -> str:
        """Generate full Water Bar coaching response."""
        # This would integrate with your existing LLM system
        # For now, return a placeholder
        return f"[FULL RESPONSE] Based on '{partial_text}' with intent '{intent}'"
    
    def _assess_complexity(self, text: str) -> float:
        """Assess complexity of user input (0.0 - 1.0)."""
        if not text:
            return 0.0
        
        complexity_indicators = {
            'questions': text.count('?') * 0.2,
            'multiple_requests': len([w for w in ['and', 'also', 'plus'] if w in text.lower()]) * 0.1,
            'specific_terms': len([w for w in ['specific', 'exactly', 'detailed'] if w in text.lower()]) * 0.15,
            'urgency': len([w for w in ['urgent', 'asap', 'quickly'] if w in text.lower()]) * 0.3,
            'length': min(0.3, len(text.split()) / 50)  # Longer = more complex
        }
        
        return min(1.0, sum(complexity_indicators.values()))
    
    def _classify_intent(self, text: str) -> str:
        """Classify user intent from partial text."""
        text_lower = text.lower()
        
        intent_patterns = {
            'product': ['product', 'have', 'sell', 'available', 'catalog'],
            'hydration': ['hydrat', 'water', 'drink', 'thirst'],
            'cart': ['cart', 'add', 'buy', 'purchase', 'order'],
            'plan': ['plan', 'routine', 'schedule', 'daily'],
            'question': ['what', 'why', 'how', 'when', 'where', '?'],
            'urgent': ['urgent', 'asap', 'quickly', 'emergency', 'now']
        }
        
        for intent, keywords in intent_patterns.items():
            if any(keyword in text_lower for keyword in keywords):
                return intent
        
        return 'default'
    
    def _tier_name(self, tier: int) -> str:
        """Convert tier number to name."""
        return {1: 'instant', 2: 'smart', 3: 'full'}[tier]
    
    def get_performance_stats(self) -> Dict[str, any]:
        """Get performance statistics for all tiers."""
        stats = {}
        
        for tier_name, times in self.response_stats['avg_times'].items():
            if times:
                stats[f'{tier_name}_avg_ms'] = sum(times) / len(times)
                stats[f'{tier_name}_count'] = len(times)
                stats[f'{tier_name}_min_ms'] = min(times)
                stats[f'{tier_name}_max_ms'] = max(times)
            else:
                stats[f'{tier_name}_avg_ms'] = 0
                stats[f'{tier_name}_count'] = 0
        
        # Overall distribution
        total_responses = sum([
            self.response_stats['instant_count'],
            self.response_stats['smart_count'], 
            self.response_stats['full_count']
        ])
        
        if total_responses > 0:
            stats['tier_distribution'] = {
                'instant_pct': (self.response_stats['instant_count'] / total_responses) * 100,
                'smart_pct': (self.response_stats['smart_count'] / total_responses) * 100,
                'full_pct': (self.response_stats['full_count'] / total_responses) * 100
            }
        
        return stats

# Example usage and testing
async def demo_triple_llm():
    """Demonstrate the triple LLM system."""
    processor = TripleLLMProcessor()
    
    test_inputs = [
        ("Hi", 0.9),                                    # Should trigger Tier 1
        ("I need some electrolytes", 0.8),              # Should trigger Tier 2  
        ("Can you help me create a hydration plan for my marathon training?", 0.9),  # Should trigger Tier 3
        ("Add chaga", 0.7),                             # Should trigger Tier 2
        ("What", 0.6),                                  # Should trigger Tier 1
        ("I'm really dehydrated and need something urgently", 0.8),  # Should trigger Tier 3 (urgent)
    ]
    
    print("🚀 Triple LLM Demo\n")
    
    for text, confidence in test_inputs:
        result = await processor.process_partial_transcript(text, confidence)
        
        print(f"Input: '{text}' (confidence: {confidence})")
        print(f"→ Tier {result['tier']}: {result['response']}")
        print(f"  Words: {result['word_count']}, Intent: {result['intent']}, Complexity: {result['complexity']:.2f}")
        print(f"  Continue listening: {result['should_continue']}\n")
    
    # Show performance stats
    stats = processor.get_performance_stats()
    print("📊 Performance Stats:")
    for key, value in stats.items():
        print(f"  {key}: {value}")

if __name__ == "__main__":
    asyncio.run(demo_triple_llm())
