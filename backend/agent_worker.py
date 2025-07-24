import asyncio
import logging
import os
from dotenv import load_dotenv
import aiohttp

from livekit.agents import JobContext, Worker, WorkerOptions
from livekit.agents.voice import Agent, AgentSession
from livekit.plugins.deepgram import STT
from livekit.plugins.openai import TTS
from livekit.plugins.hedra import AvatarSession

# Load environment variables from .env file
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

class WaterBarAgent(Agent):
    def __init__(self):
        super().__init__()
        self.chat_api_url = os.environ.get('CHAT_API_URL', 'https://waterbarmenu.vercel.app/api/chat')

    async def process_text(self, text: str):
        logging.info(f'User said: "{text}"')
        # The AgentSession automatically manages the history, so we just append the new user message
        self.session.add_user_message(text)

        try:
            async with aiohttp.ClientSession() as http_session:
                payload = {
                    "messages": self.session.chat_history(),
                    "userProfile": None  # Skipping profile for now
                }
                logging.info(f"Sending payload to chat API with {len(self.session.chat_history())} messages")

                async with http_session.post(self.chat_api_url, json=payload) as response:
                    if response.status == 200:
                        response_text = await response.text()
                        logging.info(f'Chat API response received: "{response_text[:100]}..."')
                        if not response_text.strip():
                            response_text = "I'm having a bit of trouble thinking. Could you ask that again?"
                        
                        # The agent session will handle TTS and history automatically
                        await self.session.say(response_text)
                    else:
                        error_msg = "I can't seem to connect to my knowledge base. Let's talk about general hydration."
                        logging.error(f"Chat API error: {response.status} - {await response.text()}")
                        await self.session.say(error_msg)

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

    worker = Worker(
        entrypoint_fnc=entrypoint,
        options=WorkerOptions(
            api_key=livekit_api_key,
            api_secret=livekit_api_secret,
            ws_url=livekit_url,
        ),
    )
    await worker.run()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logging.info("Worker shutting down...")
