"""
🔥 WATER BAR TRUST-BASED CONSULTATION FLOW 🔥
Revolutionary AI system that creates "psychological safety" for users to reveal real concerns.

BREAKTHROUGH CONCEPT: "Psychological Latency"
- Not just technical milliseconds, but trust-building time
- Fast ACK opens trust gateway → real concerns emerge
- Creates venue dependency: "if you can't enhance, I don't trust you"
"""

import asyncio
import time
import json
from typing import Dict, List, Any, Optional
from dataclasses import dataclass
from enum import Enum

class TrustStage(Enum):
    INITIAL_CONTACT = "initial_contact"
    TRUST_GATEWAY_OPENING = "trust_gateway_opening"  
    REAL_CONCERNS_EMERGING = "real_concerns_emerging"
    DEEP_CONSULTATION = "deep_consultation"
    COMPREHENSIVE_SOLUTION = "comprehensive_solution"
    ENHANCEMENT_DEPENDENCY = "enhancement_dependency"

@dataclass
class ConsultationContext:
    """Context for trust-based consultation"""
    user_id: str
    session_id: str
    trust_stage: TrustStage
    psychological_safety_score: float  # 0.0 - 1.0
    real_concerns_revealed: List[str]
    surface_requests: List[str]
    enhancement_opportunities: List[Dict[str, Any]]
    cart_value_potential: float
    venue_dependency_created: bool = False

class TrustBasedConsultationFlow:
    """
    🎯 THE WATER BAR COMPETITIVE MOAT
    
    Creates AI so good that venues without it feel incomplete.
    Users expect enhancement capability as baseline.
    
    FLOW:
    1. Fast ACK → Psychological safety
    2. Golden minute → Trust gateway opens
    3. Real concerns → What they won't tell anyone else
    4. Codify experience → Into physiological plan
    5. Immediate commerce → Substantial cart
    6. Enhancement dependency → "If you can't enhance, I don't trust you"
    """
    
    def __init__(self):
        # Trust-building templates
        self.psychological_safety_responses = {
            "instant_ack": [
                "I'm listening...",
                "I'm here for you...",
                "Tell me more...",
                "I'm with you..."
            ],
            "trust_gateway_openers": {
                "workout": "That sounds intense. How are you feeling right now? Your body's telling you something important...",
                "energy": "Energy is so personal. What's your body actually craving versus what you think you should have?",
                "stress": "Stress affects hydration in ways most people don't realize. What's really going on?",
                "performance": "Performance isn't just about what you consume - it's about what your body can actually use. What's your real goal here?",
                "recovery": "Recovery is where the magic happens. What did your body just go through?",
                "default": "I sense there's more to this. What's your body actually telling you right now?"
            },
            "real_concern_validators": [
                "That's exactly what I was hoping you'd share...",
                "Now we're getting to what really matters...",
                "Your body is giving you clear signals...",
                "This is the kind of insight that changes everything...",
                "Most people don't realize this connection..."
            ]
        }
        
        # Enhancement opportunity patterns
        self.enhancement_patterns = {
            "workout_recovery": {
                "signals": ["tired", "sore", "depleted", "exhausted", "workout", "gym"],
                "real_concerns": ["Will I recover properly?", "Am I doing damage?", "Why am I always tired?"],
                "enhancement_opportunity": "Post-workout recovery optimization with electrolyte timing",
                "cart_potential": 45.0
            },
            "energy_optimization": {
                "signals": ["energy", "crash", "afternoon", "tired", "sluggish", "focus"],
                "real_concerns": ["Why do I crash?", "Is this normal?", "Am I missing something?"],
                "enhancement_opportunity": "Metabolic energy optimization with hydration timing",
                "cart_potential": 38.0
            },
            "stress_management": {
                "signals": ["stress", "overwhelmed", "anxious", "pressure", "busy"],
                "real_concerns": ["Is stress making me unhealthy?", "How do I cope better?", "Am I burning out?"],
                "enhancement_opportunity": "Stress-response hydration with adaptogenic support",
                "cart_potential": 52.0
            },
            "performance_enhancement": {
                "signals": ["performance", "competition", "training", "goals", "optimize"],
                "real_concerns": ["Am I reaching my potential?", "What am I missing?", "How do pros do it?"],
                "enhancement_opportunity": "Elite performance hydration with precision timing",
                "cart_potential": 65.0
            },
            "sleep_recovery": {
                "signals": ["sleep", "tired", "morning", "night", "rest", "recovery"],
                "real_concerns": ["Why don't I feel rested?", "Is my sleep quality poor?", "What affects my sleep?"],
                "enhancement_opportunity": "Sleep optimization through evening hydration protocol",
                "cart_potential": 42.0
            }
        }
        
        # Venue enhancement standards
        self.enhancement_standards = {
            "gym": "Members expect post-workout recovery optimization guidance",
            "cafe": "Customers expect energy optimization beyond just caffeine",
            "hotel": "Guests expect travel recovery and timezone adjustment support",
            "airport": "Travelers expect hydration optimization for flight stress",
            "office": "Workers expect stress-response and focus optimization",
            "spa": "Clients expect comprehensive wellness enhancement integration"
        }
    
    async def process_user_input(self, user_input: str, context: ConsultationContext) -> Dict[str, Any]:
        """
        Process user input through trust-based consultation flow.
        
        PSYCHOLOGICAL LATENCY OPTIMIZATION:
        - Fast ACK for immediate psychological safety
        - Progressive trust building through stages
        - Real concern extraction through validation
        """
        
        # STAGE 1: Instant psychological safety
        instant_response = await self._provide_instant_psychological_safety(user_input, context)
        
        # STAGE 2: Analyze for trust gateway opportunities
        trust_analysis = await self._analyze_trust_gateway_opportunities(user_input, context)
        
        # STAGE 3: Progress through consultation stages
        consultation_result = await self._progress_consultation_stage(user_input, context, trust_analysis)
        
        # STAGE 4: Build enhancement dependency
        enhancement_result = await self._build_enhancement_dependency(consultation_result, context)
        
        return {
            "instant_response": instant_response,
            "trust_analysis": trust_analysis,
            "consultation_result": consultation_result,
            "enhancement_result": enhancement_result,
            "psychological_latency_ms": consultation_result.get("psychological_latency_ms", 0),
            "trust_stage_progression": context.trust_stage.value,
            "venue_dependency_created": context.venue_dependency_created
        }
    
    async def _provide_instant_psychological_safety(self, user_input: str, context: ConsultationContext) -> Dict[str, Any]:
        """
        CRITICAL: Provide immediate psychological safety to open trust gateway.
        
        This is where "psychological latency" is minimized.
        """
        start_time = time.perf_counter()
        
        word_count = len(user_input.split())
        
        # Tier 1: ≤2 words - Instant safety
        if word_count <= 2:
            safety_response = self.psychological_safety_responses["instant_ack"][0]
            
            # Check if cart action needed even for short input
            cart_action = await self._check_for_cart_action(user_input)
            
            response_time = (time.perf_counter() - start_time) * 1000
            
            return {
                "response": safety_response,
                "cart_action": cart_action,
                "psychological_safety_established": True,
                "response_time_ms": response_time,
                "trust_gateway_status": "opening"
            }
        
        # Tier 2: 3-6 words - Smart safety with context
        elif word_count <= 6:
            intent = self._classify_enhancement_intent(user_input)
            safety_response = self.psychological_safety_responses["trust_gateway_openers"].get(
                intent, 
                self.psychological_safety_responses["trust_gateway_openers"]["default"]
            )
            
            cart_action = await self._check_for_cart_action(user_input)
            
            response_time = (time.perf_counter() - start_time) * 1000
            
            return {
                "response": safety_response,
                "cart_action": cart_action,
                "enhancement_intent": intent,
                "psychological_safety_established": True,
                "response_time_ms": response_time,
                "trust_gateway_status": "open"
            }
        
        # Tier 3: 7+ words - Full consultation mode
        else:
            return await self._enter_full_consultation_mode(user_input, context)
    
    async def _analyze_trust_gateway_opportunities(self, user_input: str, context: ConsultationContext) -> Dict[str, Any]:
        """
        Analyze opportunities to deepen trust and extract real concerns.
        """
        
        # Detect enhancement patterns
        detected_patterns = []
        for pattern_name, pattern_data in self.enhancement_patterns.items():
            if any(signal in user_input.lower() for signal in pattern_data["signals"]):
                detected_patterns.append({
                    "pattern": pattern_name,
                    "data": pattern_data
                })
        
        # Calculate psychological safety score
        safety_indicators = {
            "question_marks": user_input.count("?") * 0.2,  # Questions indicate openness
            "personal_pronouns": len([w for w in ["i", "my", "me"] if w in user_input.lower()]) * 0.15,
            "vulnerability_words": len([w for w in ["tired", "stressed", "confused", "worried"] if w in user_input.lower()]) * 0.25,
            "length_indicator": min(0.3, len(user_input.split()) / 20)  # Longer = more sharing
        }
        
        psychological_safety_score = min(1.0, sum(safety_indicators.values()))
        context.psychological_safety_score = psychological_safety_score
        
        return {
            "detected_patterns": detected_patterns,
            "psychological_safety_score": psychological_safety_score,
            "trust_gateway_fully_open": psychological_safety_score > 0.6,
            "real_concern_indicators": self._detect_real_concern_indicators(user_input),
            "enhancement_readiness": len(detected_patterns) > 0 and psychological_safety_score > 0.5
        }
    
    async def _progress_consultation_stage(self, user_input: str, context: ConsultationContext, trust_analysis: Dict[str, Any]) -> Dict[str, Any]:
        """
        Progress through consultation stages based on trust level.
        """
        start_time = time.perf_counter()
        
        if trust_analysis["trust_gateway_fully_open"] and trust_analysis["enhancement_readiness"]:
            # DEEP CONSULTATION MODE
            context.trust_stage = TrustStage.DEEP_CONSULTATION
            
            # Extract real concerns
            real_concerns = await self._extract_real_concerns(user_input, trust_analysis["detected_patterns"])
            context.real_concerns_revealed.extend(real_concerns)
            
            # Generate comprehensive solution
            solution = await self._generate_comprehensive_solution(real_concerns, trust_analysis["detected_patterns"])
            
            # Build substantial cart
            cart_recommendations = await self._build_substantial_cart(solution, trust_analysis["detected_patterns"])
            
            psychological_latency = (time.perf_counter() - start_time) * 1000
            
            return {
                "consultation_stage": "deep_consultation",
                "real_concerns_extracted": real_concerns,
                "comprehensive_solution": solution,
                "cart_recommendations": cart_recommendations,
                "psychological_latency_ms": psychological_latency,
                "trust_breakthrough_achieved": True
            }
        
        else:
            # CONTINUE TRUST BUILDING
            trust_building_response = await self._continue_trust_building(user_input, context, trust_analysis)
            
            psychological_latency = (time.perf_counter() - start_time) * 1000
            
            return {
                "consultation_stage": "trust_building",
                "trust_building_response": trust_building_response,
                "psychological_latency_ms": psychological_latency,
                "trust_breakthrough_achieved": False
            }
    
    async def _extract_real_concerns(self, user_input: str, detected_patterns: List[Dict[str, Any]]) -> List[str]:
        """
        Extract the real concerns people won't tell anyone else.
        
        This is the breakthrough moment where psychological latency pays off.
        """
        
        real_concerns = []
        
        # Map surface requests to deeper concerns
        surface_to_real_mapping = {
            "energy drink": "Am I damaging my health with stimulants?",
            "tired all the time": "Is there something wrong with me?",
            "can't lose weight": "Am I broken metabolically?",
            "always dehydrated": "Why can't I get this basic thing right?",
            "post workout": "Am I wasting my effort if I don't recover properly?",
            "stressed": "Is this level of stress sustainable?",
            "can't focus": "Am I losing my mental edge?",
            "sleep issues": "Why don't I feel rested even when I sleep?"
        }
        
        user_lower = user_input.lower()
        
        # Extract based on detected patterns
        for pattern_data in detected_patterns:
            pattern_concerns = pattern_data["data"]["real_concerns"]
            real_concerns.extend(pattern_concerns)
        
        # Extract based on surface-to-real mapping
        for surface_request, real_concern in surface_to_real_mapping.items():
            if surface_request in user_lower:
                real_concerns.append(real_concern)
        
        return list(set(real_concerns))  # Remove duplicates
    
    async def _generate_comprehensive_solution(self, real_concerns: List[str], detected_patterns: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Generate comprehensive solution that addresses real concerns.
        
        This is where Water Bar becomes indispensable.
        """
        
        solution_components = {
            "immediate_relief": [],
            "optimization_plan": [],
            "long_term_enhancement": [],
            "physiological_explanation": "",
            "confidence_building": []
        }
        
        # Address each real concern with specific solutions
        for concern in real_concerns:
            if "damaging" in concern or "wrong with me" in concern:
                solution_components["confidence_building"].append(
                    "Your body is giving you clear signals - that's actually healthy awareness, not damage."
                )
                solution_components["immediate_relief"].append("Gentle rehydration with natural electrolytes")
            
            elif "wasting effort" in concern or "broken metabolically" in concern:
                solution_components["optimization_plan"].append(
                    "Precision nutrient timing to maximize your body's natural recovery systems"
                )
                solution_components["physiological_explanation"] += "Your metabolism isn't broken - it's just not optimized. "
            
            elif "sustainable" in concern or "mental edge" in concern:
                solution_components["long_term_enhancement"].append(
                    "Stress-response hydration protocol with adaptogenic support"
                )
        
        # Build comprehensive plan
        comprehensive_plan = {
            "phase_1_immediate": "Address urgent physiological needs with targeted hydration",
            "phase_2_optimization": "Implement precision timing for maximum absorption and utilization", 
            "phase_3_enhancement": "Create sustainable protocols that enhance rather than just maintain",
            "scientific_rationale": "Based on your specific physiological signals and optimization opportunities"
        }
        
        return {
            "solution_components": solution_components,
            "comprehensive_plan": comprehensive_plan,
            "enhancement_promise": "This isn't just hydration - this is physiological optimization",
            "trust_validation": "You're asking the right questions that most people never think about"
        }
    
    async def _build_substantial_cart(self, solution: Dict[str, Any], detected_patterns: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Build substantial cart based on comprehensive solution.
        
        This is where trust converts to commerce.
        """
        
        cart_recommendations = {
            "immediate_items": [],
            "optimization_items": [],
            "enhancement_items": [],
            "total_value": 0.0,
            "rationale": {}
        }
        
        # Calculate potential cart value from patterns
        total_potential = sum(pattern["data"]["cart_potential"] for pattern in detected_patterns)
        
        # Build specific recommendations
        for pattern_data in detected_patterns:
            pattern_name = pattern_data["pattern"]
            pattern_info = pattern_data["data"]
            
            if pattern_name == "workout_recovery":
                cart_recommendations["immediate_items"].extend([
                    {"product": "Electrolyte Recovery", "quantity": 2, "price": 12.0},
                    {"product": "Protein Hydration", "quantity": 1, "price": 15.0}
                ])
                cart_recommendations["rationale"]["workout_recovery"] = "Post-workout window optimization"
            
            elif pattern_name == "energy_optimization":
                cart_recommendations["optimization_items"].extend([
                    {"product": "Metabolic Hydration", "quantity": 3, "price": 14.0},
                    {"product": "Focus Electrolytes", "quantity": 2, "price": 13.0}
                ])
                cart_recommendations["rationale"]["energy_optimization"] = "Sustained energy without crashes"
            
            elif pattern_name == "stress_management":
                cart_recommendations["enhancement_items"].extend([
                    {"product": "Adaptogenic Hydration", "quantity": 2, "price": 16.0},
                    {"product": "Calm Electrolytes", "quantity": 2, "price": 14.0}
                ])
                cart_recommendations["rationale"]["stress_management"] = "Stress-response optimization"
        
        # Calculate total value
        all_items = (cart_recommendations["immediate_items"] + 
                    cart_recommendations["optimization_items"] + 
                    cart_recommendations["enhancement_items"])
        
        cart_recommendations["total_value"] = sum(item["price"] * item["quantity"] for item in all_items)
        
        return cart_recommendations
    
    async def _build_enhancement_dependency(self, consultation_result: Dict[str, Any], context: ConsultationContext) -> Dict[str, Any]:
        """
        Create the enhancement dependency: "If you can't enhance, I don't trust you"
        
        This is the competitive moat.
        """
        
        if consultation_result.get("trust_breakthrough_achieved"):
            context.venue_dependency_created = True
            context.trust_stage = TrustStage.ENHANCEMENT_DEPENDENCY
            
            enhancement_dependency = {
                "dependency_created": True,
                "enhancement_standard_set": True,
                "competitive_moat_established": True,
                "user_expectation": "Venues without Water Bar feel incomplete",
                "enhancement_promise": "Every experience can be codified into physiological optimization",
                "venue_inadequacy_without_enhancement": True
            }
            
            return enhancement_dependency
        
        else:
            return {
                "dependency_created": False,
                "trust_building_in_progress": True,
                "enhancement_opportunity_identified": len(consultation_result.get("trust_building_response", {})) > 0
            }
    
    def _classify_enhancement_intent(self, user_input: str) -> str:
        """Classify user intent for enhancement opportunities."""
        user_lower = user_input.lower()
        
        for pattern_name, pattern_data in self.enhancement_patterns.items():
            if any(signal in user_lower for signal in pattern_data["signals"]):
                return pattern_name.replace("_", " ")
        
        return "general wellness"
    
    def _detect_real_concern_indicators(self, user_input: str) -> List[str]:
        """Detect indicators that user is ready to share real concerns."""
        
        indicators = []
        user_lower = user_input.lower()
        
        # Vulnerability indicators
        vulnerability_words = ["worried", "concerned", "confused", "frustrated", "tired of", "don't understand"]
        for word in vulnerability_words:
            if word in user_lower:
                indicators.append(f"vulnerability: {word}")
        
        # Question indicators
        if "?" in user_input:
            indicators.append("questioning")
        
        # Personal sharing indicators
        personal_phrases = ["i feel", "i'm experiencing", "i've been", "i notice", "i'm worried"]
        for phrase in personal_phrases:
            if phrase in user_lower:
                indicators.append(f"personal sharing: {phrase}")
        
        return indicators
    
    async def _check_for_cart_action(self, user_input: str) -> Optional[Dict[str, Any]]:
        """Check if even short input requires cart action."""
        
        cart_triggers = {
            "add": "add_to_cart",
            "get": "add_to_cart", 
            "buy": "add_to_cart",
            "cart": "view_cart",
            "checkout": "checkout"
        }
        
        user_lower = user_input.lower()
        
        for trigger, action in cart_triggers.items():
            if trigger in user_lower:
                return {
                    "action": action,
                    "trigger_word": trigger,
                    "requires_llm": True,  # Even short inputs may need LLM for cart actions
                    "rpc_required": True
                }
        
        return None
    
    async def _enter_full_consultation_mode(self, user_input: str, context: ConsultationContext) -> Dict[str, Any]:
        """Enter full consultation mode for complex inputs."""
        
        context.trust_stage = TrustStage.REAL_CONCERNS_EMERGING
        
        # This would integrate with your existing LLM system
        full_consultation_response = f"""
        I can hear there's a lot going on. Let's break this down together.
        
        Your body is telling you something important, and I want to make sure 
        we address not just what you're asking for, but what you actually need.
        
        Based on what you've shared: {user_input}
        
        I'm sensing this connects to [detected patterns]. 
        
        Tell me more about what's really concerning you - 
        I'm here to help you optimize, not just hydrate.
        """
        
        return {
            "response": full_consultation_response,
            "consultation_mode": "full",
            "psychological_safety_established": True,
            "trust_gateway_status": "fully_open",
            "ready_for_real_concerns": True
        }
    
    async def _continue_trust_building(self, user_input: str, context: ConsultationContext, trust_analysis: Dict[str, Any]) -> Dict[str, Any]:
        """Continue building trust when not ready for deep consultation."""
        
        trust_building_techniques = [
            "I'm really glad you brought this up...",
            "This is exactly the kind of thing I love helping people with...",
            "You're asking such a thoughtful question...",
            "Most people don't think about this connection..."
        ]
        
        return {
            "trust_building_response": trust_building_techniques[0],
            "psychological_safety_score": context.psychological_safety_score,
            "next_trust_building_step": "Encourage more sharing",
            "trust_gateway_progress": "building"
        }

# Example usage and testing
async def demo_trust_consultation():
    """Demonstrate the trust-based consultation flow."""
    
    flow = TrustBasedConsultationFlow()
    
    # Simulate user journey
    test_scenarios = [
        ("Hi", "initial_contact"),
        ("I'm tired", "trust_gateway_opening"),
        ("I just had this intense workout and I'm worried I'm not recovering properly", "real_concerns_emerging"),
        ("I feel like I'm always exhausted no matter how much I sleep or what I eat", "deep_consultation")
    ]
    
    print("🔥 TRUST-BASED CONSULTATION FLOW DEMO\n")
    
    context = ConsultationContext(
        user_id="demo_user",
        session_id="demo_session",
        trust_stage=TrustStage.INITIAL_CONTACT,
        psychological_safety_score=0.0,
        real_concerns_revealed=[],
        surface_requests=[],
        enhancement_opportunities=[],
        cart_value_potential=0.0
    )
    
    for user_input, expected_stage in test_scenarios:
        print(f"👤 User: '{user_input}'")
        
        result = await flow.process_user_input(user_input, context)
        
        print(f"🤖 Instant Response: {result['instant_response']['response']}")
        print(f"🧠 Trust Stage: {context.trust_stage.value}")
        print(f"📊 Psychological Safety: {context.psychological_safety_score:.2f}")
        print(f"⚡ Response Time: {result['instant_response'].get('response_time_ms', 0):.0f}ms")
        
        if result.get('consultation_result', {}).get('real_concerns_extracted'):
            print(f"💡 Real Concerns: {result['consultation_result']['real_concerns_extracted']}")
        
        if result.get('consultation_result', {}).get('cart_recommendations'):
            cart_value = result['consultation_result']['cart_recommendations']['total_value']
            print(f"💰 Cart Value: ${cart_value:.2f}")
        
        if context.venue_dependency_created:
            print("🏆 ENHANCEMENT DEPENDENCY CREATED!")
            print("   → User now expects venues to provide enhancement capability")
        
        print("─" * 60)

if __name__ == "__main__":
    asyncio.run(demo_trust_consultation())
