"""
Enhanced Thinking Process Guidance with context-aware prompts and reasoning chains.
Provides intelligent prompt injection between tool calls for better AI reasoning.
"""

from typing import Dict, Any, List, Optional
from dataclasses import dataclass
import time

@dataclass
class ThinkingContext:
    """Context for thinking process guidance"""
    stage: str  # 'pre_processing', 'mid_processing', 'post_processing'
    tool_chain: List[str]
    audio_meta: Dict[str, Any]
    user_input: str
    partial_results: Dict[str, Any]
    conversation_history: List[Dict[str, str]]

class ThinkingProcessGuidance:
    """Enhanced thinking process with context-aware reasoning prompts."""
    
    def __init__(self):
        # Reasoning templates for different stages
        self.reasoning_templates = {
            'audio_analysis': {
                'pre': "Analyzing audio quality and user intent...",
                'mid': "Processing speech patterns and confidence levels...",
                'post': "Audio analysis complete. Quality: {quality}, Confidence: {confidence:.2f}"
            },
            'intent_classification': {
                'pre': "Determining user intent and processing strategy...",
                'mid': "Evaluating intent patterns and context clues...",
                'post': "Intent classified as '{intent}' with {confidence:.1%} confidence"
            },
            'tool_selection': {
                'pre': "Selecting optimal processing tools based on context...",
                'mid': "Weighing tool capabilities against user needs...",
                'post': "Selected {primary_tool} with fallbacks: {fallbacks}"
            },
            'response_generation': {
                'pre': "Generating comprehensive response using Water Bar framework...",
                'mid': "Building personalized recommendations and action plan...",
                'post': "Response generated: {word_count} words, completeness: {completeness:.1%}"
            }
        }
        
        # Context-aware prompt modifiers
        self.context_modifiers = {
            'urgent': "PRIORITY: User request is urgent - focus on immediate actionable advice.",
            'low_confidence': "CAUTION: Audio quality is poor - request clarification if needed.",
            'multi_speaker': "NOTE: Multiple speakers detected - consider conversation dynamics.",
            'returning_user': "CONTEXT: Returning user - reference previous interactions appropriately.",
            'complex_query': "DEPTH: Complex query detected - provide comprehensive analysis.",
            'product_focused': "COMMERCE: Product-related query - emphasize cart actions and recommendations."
        }
    
    def pre_prompt(self, context: ThinkingContext) -> str:
        """
        Generate pre-processing reasoning prompt.
        
        Args:
            context: Current thinking context
            
        Returns:
            Contextual reasoning prompt
        """
        audio_meta = context.audio_meta
        user_input = context.user_input
        
        # Base audio analysis
        base_prompt = (
            f"AUDIO ANALYSIS:\n"
            f"- Speech confidence: {audio_meta.get('speech_confidence', 0):.2f}\n"
            f"- Speaker count: {audio_meta.get('speaker_count', 1)}\n"
            f"- Audio quality: {self._assess_audio_quality(audio_meta)}\n\n"
        )
        
        # Add input analysis
        if user_input:
            word_count = len(user_input.split())
            base_prompt += (
                f"INPUT ANALYSIS:\n"
                f"- Length: {word_count} words\n"
                f"- Complexity: {self._assess_input_complexity(user_input)}\n"
                f"- Contains questions: {'Yes' if '?' in user_input else 'No'}\n\n"
            )
        
        # Add context modifiers
        modifiers = self._get_applicable_modifiers(context)
        if modifiers:
            base_prompt += "PROCESSING GUIDANCE:\n"
            for modifier in modifiers:
                base_prompt += f"- {modifier}\n"
            base_prompt += "\n"
        
        # Add conversation context
        if context.conversation_history:
            base_prompt += self._build_conversation_context_prompt(context.conversation_history)
        
        return base_prompt
    
    def mid_prompt(self, context: ThinkingContext, current_tool: str) -> str:
        """
        Generate mid-processing reasoning prompt.
        
        Args:
            context: Current thinking context
            current_tool: Currently executing tool
            
        Returns:
            Mid-processing guidance prompt
        """
        template = self.reasoning_templates.get(current_tool, {})
        base_prompt = template.get('mid', f"Processing with {current_tool}...")
        
        # Add tool-specific guidance
        tool_guidance = self._get_tool_specific_guidance(current_tool, context)
        if tool_guidance:
            base_prompt += f"\n\nTOOL GUIDANCE: {tool_guidance}"
        
        # Add progress indicators
        if context.partial_results:
            base_prompt += f"\n\nPROGRESS: {self._format_partial_results(context.partial_results)}"
        
        return base_prompt
    
    def post_prompt(self, context: ThinkingContext, results: Dict[str, Any]) -> str:
        """
        Generate post-processing reasoning prompt.
        
        Args:
            context: Current thinking context
            results: Processing results
            
        Returns:
            Post-processing analysis prompt
        """
        # Analyze results quality
        quality_analysis = self._analyze_results_quality(results)
        
        base_prompt = (
            f"PROCESSING COMPLETE:\n"
            f"- Tools used: {', '.join(context.tool_chain)}\n"
            f"- Processing time: {results.get('processing_time_ms', 0):.0f}ms\n"
            f"- Quality score: {quality_analysis['score']:.2f}/1.0\n\n"
        )
        
        # Add specific result analysis
        if 'immediate_ack' in results:
            base_prompt += f"FAST ACK: '{results['immediate_ack']}'\n"
        
        if 'full_plan' in results:
            word_count = len(results['full_plan'].split()) if results['full_plan'] else 0
            base_prompt += f"FULL RESPONSE: {word_count} words\n"
        
        # Add improvement suggestions
        suggestions = self._generate_improvement_suggestions(context, results, quality_analysis)
        if suggestions:
            base_prompt += f"\nIMPROVEMENT OPPORTUNITIES:\n"
            for suggestion in suggestions:
                base_prompt += f"- {suggestion}\n"
        
        return base_prompt
    
    def generate_framework_verification_prompt(self, response: str) -> str:
        """
        Generate prompt to verify Water Bar framework completeness.
        
        Args:
            response: AI response to verify
            
        Returns:
            Framework verification prompt
        """
        framework_components = [
            "ASSESS: User's current hydration state and needs",
            "RECOMMEND: Specific products with clear rationale", 
            "PLAN: Actionable hydration timeline or routine",
            "EDUCATE: Relevant insights without overwhelming detail",
            "ACTION: Clear next steps (cart additions, checkout, etc.)"
        ]
        
        prompt = (
            "FRAMEWORK VERIFICATION:\n"
            "Check if the response includes these Water Bar coaching elements:\n\n"
        )
        
        for component in framework_components:
            prompt += f"□ {component}\n"
        
        prompt += (
            f"\nRESPONSE TO VERIFY:\n{response}\n\n"
            f"VERIFICATION RESULT: List which components are present and suggest any missing elements."
        )
        
        return prompt
    
    def _assess_audio_quality(self, audio_meta: Dict[str, Any]) -> str:
        """Assess audio quality from metadata."""
        confidence = audio_meta.get('speech_confidence', 0)
        
        if confidence >= 0.9:
            return "Excellent"
        elif confidence >= 0.7:
            return "Good"
        elif confidence >= 0.5:
            return "Fair"
        else:
            return "Poor"
    
    def _assess_input_complexity(self, user_input: str) -> str:
        """Assess input complexity."""
        if not user_input:
            return "Unknown"
        
        words = user_input.split()
        word_count = len(words)
        
        # Check for complexity indicators
        has_questions = '?' in user_input
        has_multiple_requests = any(word in user_input.lower() for word in ['and', 'also', 'plus', 'additionally'])
        has_specific_details = any(word in user_input.lower() for word in ['specific', 'exactly', 'precisely', 'detailed'])
        
        if word_count > 20 or (has_questions and has_multiple_requests):
            return "High"
        elif word_count > 10 or has_questions or has_specific_details:
            return "Medium"
        else:
            return "Low"
    
    def _get_applicable_modifiers(self, context: ThinkingContext) -> List[str]:
        """Get applicable context modifiers."""
        modifiers = []
        
        # Check audio-based modifiers
        if context.audio_meta.get('speech_confidence', 1) < 0.7:
            modifiers.append(self.context_modifiers['low_confidence'])
        
        if context.audio_meta.get('speaker_count', 1) > 1:
            modifiers.append(self.context_modifiers['multi_speaker'])
        
        # Check input-based modifiers
        if context.user_input:
            user_lower = context.user_input.lower()
            
            if any(word in user_lower for word in ['urgent', 'asap', 'quickly', 'emergency']):
                modifiers.append(self.context_modifiers['urgent'])
            
            if len(context.user_input.split()) > 15 or '?' in context.user_input:
                modifiers.append(self.context_modifiers['complex_query'])
            
            if any(word in user_lower for word in ['product', 'buy', 'add', 'cart', 'recommend']):
                modifiers.append(self.context_modifiers['product_focused'])
        
        # Check conversation-based modifiers
        if len(context.conversation_history) > 2:
            modifiers.append(self.context_modifiers['returning_user'])
        
        return modifiers
    
    def _build_conversation_context_prompt(self, history: List[Dict[str, str]]) -> str:
        """Build conversation context prompt."""
        if not history:
            return ""
        
        recent_exchanges = history[-3:] if len(history) > 3 else history
        
        prompt = "CONVERSATION CONTEXT:\n"
        for i, exchange in enumerate(recent_exchanges, 1):
            user_msg = exchange.get('user', '')[:100] + ('...' if len(exchange.get('user', '')) > 100 else '')
            prompt += f"Turn {i}: User said '{user_msg}'\n"
        
        prompt += f"Total conversation length: {len(history)} exchanges\n\n"
        
        return prompt
    
    def _get_tool_specific_guidance(self, tool: str, context: ThinkingContext) -> str:
        """Get tool-specific processing guidance."""
        guidance_map = {
            'audio_processing': "Focus on clarity and noise reduction. Request clarification if needed.",
            'fast_llm': "Provide brief, warm acknowledgment. Keep under 15 words.",
            'smart_llm': "Use full Water Bar framework: ASSESS → RECOMMEND → PLAN → EDUCATE → ACTION",
            'conversation_manager': "Maintain conversation flow and context. Reference previous exchanges.",
            'product_search': "Match user needs to specific products. Include nutritional rationale.",
            'context_compaction': "Preserve key context while reducing token count. Maintain user preferences."
        }
        
        return guidance_map.get(tool, "")
    
    def _format_partial_results(self, partial_results: Dict[str, Any]) -> str:
        """Format partial results for progress indication."""
        if not partial_results:
            return "No partial results yet"
        
        progress_items = []
        for key, value in partial_results.items():
            if isinstance(value, str) and len(value) > 50:
                progress_items.append(f"{key}: {len(value)} characters generated")
            else:
                progress_items.append(f"{key}: {value}")
        
        return ", ".join(progress_items)
    
    def _analyze_results_quality(self, results: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze quality of processing results."""
        quality_factors = {
            'completeness': 0.0,
            'relevance': 0.0,
            'actionability': 0.0,
            'framework_adherence': 0.0
        }
        
        # Check completeness
        if results.get('immediate_ack'):
            quality_factors['completeness'] += 0.3
        if results.get('full_plan'):
            quality_factors['completeness'] += 0.7
        
        # Check framework adherence (simplified)
        full_plan = results.get('full_plan', '')
        if full_plan:
            framework_keywords = ['assess', 'recommend', 'plan', 'because', 'add to cart']
            found_keywords = sum(1 for keyword in framework_keywords if keyword.lower() in full_plan.lower())
            quality_factors['framework_adherence'] = found_keywords / len(framework_keywords)
        
        # Overall score
        overall_score = sum(quality_factors.values()) / len(quality_factors)
        
        return {
            'score': overall_score,
            'factors': quality_factors,
            'assessment': 'Good' if overall_score > 0.7 else 'Fair' if overall_score > 0.4 else 'Poor'
        }
    
    def _generate_improvement_suggestions(self, context: ThinkingContext, 
                                        results: Dict[str, Any], 
                                        quality_analysis: Dict[str, Any]) -> List[str]:
        """Generate suggestions for improvement."""
        suggestions = []
        
        # Quality-based suggestions
        if quality_analysis['score'] < 0.7:
            if quality_analysis['factors']['framework_adherence'] < 0.5:
                suggestions.append("Improve framework adherence (ASSESS → RECOMMEND → PLAN → EDUCATE → ACTION)")
            
            if not results.get('immediate_ack') and len(context.user_input.split()) > 6:
                suggestions.append("Consider using fast ACK for longer user inputs")
        
        # Latency-based suggestions
        processing_time = results.get('processing_time_ms', 0)
        if processing_time > 3000:
            suggestions.append("Processing time exceeded 3s - consider optimization")
        
        # Context-based suggestions
        if context.audio_meta.get('speech_confidence', 1) < 0.7 and not results.get('clarification_request'):
            suggestions.append("Low audio confidence - consider requesting clarification")
        
        return suggestions
