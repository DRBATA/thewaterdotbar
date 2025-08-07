"""
Enhanced Water Bar Agent - Stage 2 Latency Optimizations
Builds on your existing agent.py with minimal changes for better performance.
"""

import logging
import json
import uuid
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional, List, Dict, Any, TypedDict
from dotenv import load_dotenv
from livekit.agents import JobContext, WorkerOptions, cli, WorkerPermissions, RoomOutputOptions
from livekit.agents.llm import function_tool
from livekit.agents.voice import Agent, AgentSession, RunContext
from livekit.plugins import openai, silero, deepgram, hedra
from PIL import Image
import asyncio
import os
import aiohttp

# Enhanced telemetry for latency tracking
from tools.telemetry import stats

load_dotenv(dotenv_path=Path(__file__).parent / '.env')

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# Your existing data classes (unchanged)
class QuizAnswerDict(TypedDict):
    text: str
    is_correct: bool

class QuizQuestionDict(TypedDict):
    text: str
    answers: List[QuizAnswerDict]

@dataclass
class FlashCard:
    """Class to represent a flash card."""
    id: str
    question: str
    answer: str
    is_flipped: bool = False

@dataclass
class QuizAnswer:
    """Class to represent a quiz answer option."""
    id: str
    text: str
    is_correct: bool

@dataclass
class QuizQuestion:
    """Class to represent a quiz question."""
    id: str
    text: str
    answers: List[QuizAnswer]

@dataclass
class CartItem:
    """Class to represent a cart item."""
    id: str
    product_id: str
    name: str
    price: float
    quantity: int = 1

@dataclass
class Quiz:
    """Class to represent a quiz."""
    id: str
    questions: List[QuizQuestion]

# Enhanced configuration for latency optimization
@dataclass
class LatencyConfig:
    """Configuration for latency optimization features"""
    enable_early_ack: bool = True
    early_ack_word_threshold: int = 6
    enable_framework_checking: bool = True
    enable_performance_tracking: bool = True
    deepgram_interim_results: bool = True
    fast_ack_timeout_ms: int = 500
    smart_response_timeout_ms: int = 3000

class EnhancedUserData:
    """Enhanced user data with performance tracking."""
    
    def __init__(self):
        self.ctx: Optional[JobContext] = None
        self.flash_cards: List[FlashCard] = []
        self.quizzes: List[Quiz] = []
        self.cart_items: List[CartItem] = []
        self.products_data: List[Dict[str, Any]] = []
        
        # Performance tracking
        self.session_start_time = time.time()
        self.interaction_count = 0
        self.partial_transcript_buffer = ""
        self.last_ack_time = 0
        self.framework_completeness_scores: List[float] = []
    
    def track_interaction(self):
        """Track user interaction for performance metrics."""
        self.interaction_count += 1
        stats.increment('agent.interaction_count', session_id=str(id(self)))
    
    def update_partial_transcript(self, partial_text: str) -> bool:
        """Update partial transcript and check if early ACK should trigger."""
        self.partial_transcript_buffer = partial_text
        word_count = len(partial_text.split())
        
        # Track partial transcript metrics
        stats.gauge('agent.partial_word_count', word_count, session_id=str(id(self)))
        
        # Check if early ACK should trigger
        if word_count >= 6 and (time.time() - self.last_ack_time) > 2:
            self.last_ack_time = time.time()
            stats.increment('agent.early_ack_triggered', session_id=str(id(self)))
            return True
        
        return False
    
    def track_framework_completeness(self, response: str, score: float):
        """Track framework completeness for response quality."""
        self.framework_completeness_scores.append(score)
        stats.gauge('agent.framework_completeness', score, session_id=str(id(self)))
        
        # Keep only recent scores
        if len(self.framework_completeness_scores) > 10:
            self.framework_completeness_scores = self.framework_completeness_scores[-10:]

class EnhancedAvatarAgent(Agent):
    """Enhanced avatar agent with latency optimizations."""
    
    def __init__(self, config: LatencyConfig = None):
        self.config = config or LatencyConfig()
        
        # Initialize agent instance variables
        self.cached_products = []
        self.user_profile = {}
        self.session_id = f"voice_session_{uuid.uuid4().hex[:8]}"
        
        # Performance tracking
        self.response_times: List[float] = []
        self.early_ack_count = 0
        
        # Enhanced Deepgram configuration for partial transcripts
        deepgram_config = {}
        if self.config.deepgram_interim_results:
            deepgram_config = {
                "interim_results": True,
                "punctuate": False,  # Faster without punctuation
                "diarize": False,   # Single speaker mode
                "smart_format": False  # Raw transcription for speed
            }
        
        super().__init__(
            instructions=self._build_enhanced_instructions(),
            stt=deepgram.STT(**deepgram_config) if deepgram_config else deepgram.STT(),
            llm=openai.LLM(model="gpt-4o"),
            tts=openai.TTS(voice="alloy"),
            vad=silero.VAD.load(min_silence_duration=2.7),  # Keep your working config
        )
    
    def _build_enhanced_instructions(self) -> str:
        """Build enhanced system instructions with framework guidance."""
        base_instructions = """
        You are a Water Bar AI Hydration Coach. You MUST use function tools for all cart and product operations.
        
        MANDATORY FUNCTION USAGE:
        - ANY mention of "products", "what do you have", "catalog" → IMMEDIATELY call list_products()
        - ANY mention of "add", "put in cart", "I want" → IMMEDIATELY call add_to_cart(product_name, quantity)
        - ANY mention of "remove", "delete", "take out" → IMMEDIATELY call remove_from_cart(product_name, quantity)
        - ANY mention of "cart", "what's in my cart", "show cart" → IMMEDIATELY call view_cart()
        - ANY mention of "clear cart", "start fresh", "new cart" → IMMEDIATELY call clear_cart()
        - ANY mention of "hello", "hi", greeting → IMMEDIATELY call check_existing_cart()
        """
        
        if self.config.enable_framework_checking:
            framework_guidance = """
            
            WATER BAR COACHING FRAMEWORK (use for comprehensive responses):
            1. ASSESS: Understand user's hydration needs, activity level, goals
            2. RECOMMEND: Suggest specific products with clear rationale
            3. PLAN: Create actionable hydration timeline if appropriate
            4. EDUCATE: Share relevant insights without overwhelming detail
            5. ACTION: Guide user to add products to cart and complete purchase
            
            RESPONSE QUALITY STANDARDS:
            - Always explain WHY you're recommending specific products
            - Connect recommendations to user's stated needs or activities
            - Aim for substantial cart value through comprehensive planning
            - Be warm, knowledgeable, and practical in your communication
            """
            base_instructions += framework_guidance
        
        base_instructions += """
        
        CRITICAL RULES:
        1. NEVER respond conversationally about products - ALWAYS call list_products() first
        2. NEVER say "not available" - ALWAYS call add_to_cart() and let the function handle errors
        3. ALWAYS call functions IMMEDIATELY when users mention cart actions
        4. If unsure about product names, call add_to_cart() anyway - it will do fuzzy matching
        5. ALWAYS greet users by checking for existing carts first
        
        DO NOT HESITATE - CALL FUNCTIONS IMMEDIATELY!
        """
        
        return base_instructions
    
    async def on_partial_transcript(self, partial_text: str, user_data: EnhancedUserData):
        """Handle partial transcripts for early ACK triggering."""
        if not self.config.enable_early_ack:
            return
        
        should_ack = user_data.update_partial_transcript(partial_text)
        
        if should_ack:
            # Trigger early acknowledgment
            await self._send_early_ack(user_data, partial_text)
    
    async def _send_early_ack(self, user_data: EnhancedUserData, partial_text: str):
        """Send early acknowledgment based on partial transcript."""
        start_time = time.perf_counter()
        
        # Simple, context-aware acknowledgments
        ack_responses = {
            'product': "Let me find the perfect products for you...",
            'cart': "I'm checking your cart...",
            'plan': "I'm creating your personalized plan...",
            'question': "Great question! Let me think about that...",
            'default': "I'm processing your request..."
        }
        
        # Classify intent from partial text
        intent = self._classify_partial_intent(partial_text)
        ack_message = ack_responses.get(intent, ack_responses['default'])
        
        # Send acknowledgment (this would integrate with your TTS system)
        logger.info(f"Early ACK: {ack_message}")
        self.early_ack_count += 1
        
        # Track timing
        ack_time = (time.perf_counter() - start_time) * 1000
        stats.timing('agent.early_ack_latency_ms', ack_time, session_id=self.session_id)
    
    def _classify_partial_intent(self, partial_text: str) -> str:
        """Classify intent from partial transcript."""
        text_lower = partial_text.lower()
        
        if any(word in text_lower for word in ['product', 'have', 'sell', 'available']):
            return 'product'
        elif any(word in text_lower for word in ['cart', 'add', 'buy', 'purchase']):
            return 'cart'
        elif any(word in text_lower for word in ['plan', 'routine', 'schedule', 'daily']):
            return 'plan'
        elif any(word in text_lower for word in ['what', 'why', 'how', 'when', '?']):
            return 'question'
        else:
            return 'default'
    
    def _check_framework_completeness(self, response: str) -> float:
        """Check if response follows the Water Bar framework."""
        if not self.config.enable_framework_checking:
            return 1.0
        
        framework_keywords = {
            'assess': ['assess', 'need', 'goal', 'activity', 'current', 'state'],
            'recommend': ['recommend', 'suggest', 'perfect', 'ideal', 'best'],
            'plan': ['plan', 'routine', 'schedule', 'timeline', 'daily'],
            'educate': ['because', 'why', 'benefit', 'help', 'support', 'science'],
            'action': ['add', 'cart', 'purchase', 'buy', 'order', 'checkout']
        }
        
        response_lower = response.lower()
        component_scores = {}
        
        for component, keywords in framework_keywords.items():
            score = sum(1 for keyword in keywords if keyword in response_lower)
            component_scores[component] = min(1.0, score / len(keywords))
        
        overall_score = sum(component_scores.values()) / len(component_scores)
        
        # Bonus for comprehensive responses
        if len(response.split()) > 50:
            overall_score += 0.1
        
        return min(1.0, overall_score)
    
    # Your existing function tools (unchanged, but with performance tracking)
    
    @function_tool
    async def list_products(self, context: RunContext[EnhancedUserData]):
        """Get the current list of available Water Bar products from the database."""
        start_time = time.perf_counter()
        
        try:
            # Your existing implementation
            api_base_url = os.getenv('API_BASE_URL', 'http://localhost:3000')
            url = f"{api_base_url}/api/products-for-agent"
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url) as response:
                    if response.status == 200:
                        products = await response.json()
                        self.cached_products = products
                        context.user_data.products_data = products
                        
                        # Track performance
                        latency = (time.perf_counter() - start_time) * 1000
                        stats.timing('agent.list_products_latency_ms', latency, session_id=self.session_id)
                        stats.gauge('agent.products_count', len(products), session_id=self.session_id)
                        
                        return f"Found {len(products)} products available. I can help you find the perfect hydration solutions!"
                    else:
                        stats.increment('agent.list_products_error', session_id=self.session_id)
                        return "I'm having trouble accessing our product catalog right now. Please try again."
                        
        except Exception as e:
            stats.increment('agent.list_products_exception', session_id=self.session_id)
            logger.error(f"Error listing products: {e}")
            return "I'm having trouble accessing our product catalog right now. Please try again."
    
    @function_tool
    async def add_to_cart(self, context: RunContext[EnhancedUserData], items: str):
        """Add one or more items to the cart with performance tracking."""
        start_time = time.perf_counter()
        context.user_data.track_interaction()
        
        try:
            # Your existing implementation with added metrics
            items_data = json.loads(items)
            results = []
            
            for item in items_data:
                product_name = item.get('product_name', '')
                quantity = item.get('quantity', 1)
                
                result = await self._add_single_item_to_cart(context, product_name, quantity)
                results.append(result)
            
            # Track performance
            latency = (time.perf_counter() - start_time) * 1000
            stats.timing('agent.add_to_cart_latency_ms', latency, session_id=self.session_id)
            stats.gauge('agent.cart_items_added', len(items_data), session_id=self.session_id)
            
            return "\n".join(results)
            
        except Exception as e:
            stats.increment('agent.add_to_cart_error', session_id=self.session_id)
            logger.error(f"Error adding to cart: {e}")
            return f"I had trouble adding those items to your cart. Please try again."
    
    # Add performance tracking to other existing methods...
    # (I'll show the pattern - you can apply to all your existing function tools)
    
    async def _add_single_item_to_cart(self, context: RunContext[EnhancedUserData], product_name: str, quantity: int = 1):
        """Internal helper with performance tracking."""
        start_time = time.perf_counter()
        
        try:
            # Your existing implementation
            product_id = await self.find_product_id_by_name(context, product_name)
            
            if "not found" in product_id.lower():
                return f"Sorry, I couldn't find '{product_name}' in our catalog. Try 'list products' to see what's available."
            
            # Send RPC command to UI
            await context.room.perform_rpc(
                "cart_action",
                json.dumps({
                    "action": "add",
                    "product_id": product_id,
                    "product_name": product_name,
                    "quantity": quantity
                }),
                request_id=str(uuid.uuid4())
            )
            
            # Track performance
            latency = (time.perf_counter() - start_time) * 1000
            stats.timing('agent.add_single_item_latency_ms', latency, session_id=self.session_id)
            
            return f"✅ Added {quantity}x {product_name} to your cart!"
            
        except Exception as e:
            stats.increment('agent.add_single_item_error', session_id=self.session_id)
            logger.error(f"Error adding single item: {e}")
            return f"I had trouble adding {product_name} to your cart."
    
    def get_performance_summary(self) -> Dict[str, Any]:
        """Get performance summary for this agent session."""
        return {
            'session_id': self.session_id,
            'early_ack_count': self.early_ack_count,
            'response_times': self.response_times[-10:],  # Last 10 responses
            'avg_response_time': sum(self.response_times) / len(self.response_times) if self.response_times else 0,
            'config': {
                'early_ack_enabled': self.config.enable_early_ack,
                'framework_checking_enabled': self.config.enable_framework_checking,
                'performance_tracking_enabled': self.config.enable_performance_tracking
            }
        }

# Enhanced entrypoint with performance tracking
async def enhanced_entrypoint(ctx: JobContext):
    """Enhanced entrypoint with latency optimization."""
    start_time = time.perf_counter()
    
    # Load configuration
    config = LatencyConfig(
        enable_early_ack=True,
        early_ack_word_threshold=6,
        enable_framework_checking=True,
        enable_performance_tracking=True
    )
    
    # Create enhanced agent
    agent = EnhancedAvatarAgent(config)
    
    # Track session start
    stats.increment('agent.session_started')
    
    try:
        # Start agent session
        await agent.start(ctx.room, EnhancedUserData())
        
        # Track successful session
        session_duration = (time.perf_counter() - start_time) * 1000
        stats.timing('agent.session_duration_ms', session_duration)
        stats.increment('agent.session_completed')
        
    except Exception as e:
        stats.increment('agent.session_error')
        logger.error(f"Agent session error: {e}")
        raise

if __name__ == "__main__":
    # Enhanced startup with performance monitoring
    cli.run_app(WorkerOptions(entrypoint_fnc=enhanced_entrypoint))
