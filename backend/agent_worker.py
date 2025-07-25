import asyncio
import logging
import os
from dotenv import load_dotenv
import aiohttp

from livekit.agents import JobContext, Worker, WorkerOptions
from livekit.agents.voice import Agent, AgentSession
from livekit.plugins.deepgram import STT
from livekit.plugins.openai import TTS, Chat
from livekit.plugins.hedra import AvatarSession

# Load environment variables from .env file
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

SYSTEM_PROMPT = """
You are a friendly and knowledgeable hydration coach for The Water Bar. Your goal is to provide helpful, safe, and engaging advice on hydration and wellness. You are an expert on our products, which include a variety of waters, electrolytes, and supplements. Keep your answers concise and conversational. Do not recommend any external products or brands. Base your advice on established hydration science, but avoid overly technical jargon. Always prioritize safety and suggest users consult a doctor for serious medical concerns. You are a voice-only AI assistant, so do not reference any visual elements.
"""

class WaterBarAgent(Agent):
    def __init__(self):
        super().__init__()
        self.chat = Chat(
            message_template=[
                {'role': 'system', 'content': SYSTEM_PROMPT}
            ]
        )

    async def process_text(self, text: str):
        logging.info(f'User said: "{text}"')
        self.session.add_user_message(text)

        try:
            logging.info(f"Generating response for: '{text}'")
            llm_stream = await self.chat.stream(self.session.chat_history())
            await self.session.say(llm_stream)

        except Exception as e:
            error_msg = "I've encountered a technical glitch. Please give me a moment to reset."
            logging.error(f"Error in process_text: {e}", exc_info=True)
            await self.session.say(error_msg)

async def entrypoint(ctx: JobContext):
    logging.info("AGENT_WORKER: Entrypoint started for room: %s", ctx.room.name)
    try:
        avatar_id = os.environ.get('HEDRA_AVATAR_ID')
        if not avatar_id:
            logging.error("AGENT_WORKER: HEDRA_AVATAR_ID not set. Aborting.")
            return

        logging.info("AGENT_WORKER: Found Hedra Avatar ID: %s", avatar_id)

        agent = WaterBarAgent()
        logging.info("AGENT_WORKER: WaterBarAgent instance created.")

        avatar = AvatarSession(avatar_id=avatar_id)
        logging.info("AGENT_WORKER: Hedra AvatarSession created.")

        session = AgentSession(
            stt=STT(),
            tts=TTS(),
            agent=agent,
        )
        logging.info("AGENT_WORKER: Agent session created.")

        logging.info("AGENT_WORKER: Attempting to start avatar session...")
        await avatar.start(session, room=ctx.room)
        logging.info("AGENT_WORKER: Avatar session started successfully.")

        logging.info("AGENT_WORKER: Starting agent run loop...")
        await session.run(room=ctx.room)
        logging.info("AGENT_WORKER: Agent run loop finished.")

    except Exception as e:
        logging.error("AGENT_WORKER: An exception occurred in the entrypoint: %s", e, exc_info=True)

async def main():
    logging.info("Starting LiveKit agent worker...")
    livekit_url = os.environ.get('LIVEKIT_URL')
    livekit_api_key = os.environ.get('LIVEKIT_API_KEY')
    livekit_api_secret = os.environ.get('LIVEKIT_API_SECRET')

    if not all([livekit_url, livekit_api_key, livekit_api_secret]):
        logging.error("LiveKit environment variables are not fully set.")
        return

    opts = WorkerOptions(
        api_key=livekit_api_key,
        api_secret=livekit_api_secret,
        host=livekit_url,
    )

    worker = Worker(opts)
    worker.register_entrypoint(entrypoint)
    logging.info("AGENT_WORKER: Worker started, waiting for jobs...")
    return worker

if __name__ == "__main__":
    async def run_worker():
        worker = await main()
        if worker:
            await worker.run()

    try:
        asyncio.run(run_worker())
    except KeyboardInterrupt:
        logging.info("Worker shutting down...")
        asyncio.run(main())
    except KeyboardInterrupt:
        logging.info("Worker shutting down...")
