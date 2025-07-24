import asyncio
import logging
import os
from dotenv import load_dotenv
import aiohttp

from livekit.agents import JobContext, Worker, WorkerOptions, agent
from livekit.plugins import deepgram, openai, hedra

# Load environment variables from .env file
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

class MyAgent(agent.Agent):
    def __init__(self):
        super().__init__()
        self.chat_api_url = os.environ.get('CHAT_API_URL', 'https://waterbarmenu.vercel.app/api/chat')
        self.stt = deepgram.STT()
        self.tts = openai.TTS()
        self.chat = openai.Chat()

    async def start(self):
        # This is where you can add any agent startup logic
        logging.info("MyAgent started")

    async def process_text(self, text):
        # The Agent class automatically handles history and TTS
        logging.info(f"Processing user text: {text}")
        
        # Add user message to chat history
        self.chat.add_user_message(text)
        
        try:
            # Call external chat API
            async with aiohttp.ClientSession() as http_session:
                payload = {
                    "messages": self.chat.chat_history(),
                    "userProfile": None # Skipping profile for now
                }
                logging.info(f"Sending payload to chat API with {len(self.chat.chat_history())} messages")
                async with http_session.post(self.chat_api_url, json=payload) as response:
                    if response.status == 200:
                        response_text = await response.text()
                        logging.info(f'Chat API response: "{response_text[:100]}..."')
                        if not response_text.strip():
                            response_text = "I'm having a bit of trouble thinking. Could you ask that again?"
                        
                        # Use the agent's built-in say method to stream TTS
                        await self.say(response_text)
                    else:
                        error_msg = "I can't seem to connect to my knowledge base right now."
                        logging.error(f"Chat API error: {response.status} - {await response.text()}")
                        await self.say(error_msg)
        except Exception as e:
            error_msg = "I've encountered a technical glitch. Please give me a moment to reset."
            logging.error(f"Error in process_text: {e}", exc_info=True)
            await self.say(error_msg)

async def entrypoint(ctx: JobContext):
    logging.info("AGENT_WORKER: Entrypoint started for room: %s", ctx.room.name)
    try:
        avatar_id = os.environ.get('HEDRA_AVATAR_ID')
        if not avatar_id:
            logging.error("AGENT_WORKER: HEDRA_AVATAR_ID not set. Aborting.")
            return

        logging.info("AGENT_WORKER: Found Hedra Avatar ID: %s", avatar_id)

        agent_instance = MyAgent()
        logging.info("AGENT_WORKER: MyAgent instance created.")

        avatar_session = hedra.AvatarSession(avatar_id=avatar_id)
        logging.info("AGENT_WORKER: Hedra AvatarSession created.")

        logging.info("AGENT_WORKER: Attempting to start avatar session...")
        # The avatar session now takes the agent instance directly
        await avatar_session.start(agent_instance, room=ctx.room)
        logging.info("AGENT_WORKER: Avatar session started successfully.")

        logging.info("AGENT_WORKER: Starting agent run loop...")
        await agent_instance.run()
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
