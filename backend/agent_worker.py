import asyncio
import logging
import os
from dotenv import load_dotenv
from livekit.agents import JobContext, Worker, WorkerOptions, AgentSession, RoomOutputOptions
from livekit.plugins.deepgram import STT
from livekit.plugins.openai import TTS
from livekit.plugins.hedra import AvatarSession
import aiohttp

# Load environment variables
load_dotenv()

# Set up logging
logging.basicConfig(level=logging.INFO)

# Global conversation sessions storage
conversation_sessions = {}

async def entrypoint(ctx: JobContext):
    logging.info("Agent entrypoint triggered")

    # Skip Supabase integration for now - focus on core avatar pipeline

    # Initialize plugins
    stt = STT()
    tts = TTS()
    
    # Create agent session
    session = AgentSession(
        stt=stt,
        tts=tts
    )
    
    # Initialize Hedra avatar session using the uploaded avatar ID
    avatar_id = os.environ.get('HEDRA_AVATAR_ID')
    if not avatar_id:
        logging.error("HEDRA_AVATAR_ID environment variable not set")
        raise ValueError("HEDRA_AVATAR_ID environment variable is required")
    
    logging.info(f"Using Hedra avatar ID: {avatar_id}")
    avatar = AvatarSession(avatar_id=avatar_id)

    # Start the avatar session (let Hedra handle track publishing)
    await avatar.start(session, room=ctx.room)
    logging.info("Avatar session started successfully")
    
    # Start the agent session with audio disabled (avatar will handle audio)
    await session.start(
        room=ctx.room,
        room_output_options=RoomOutputOptions(audio_enabled=False)
    )
    logging.info("Agent session started with audio disabled")

    # Start listening to the user
    stt_stream = stt.stream(ctx)

    # Initialize conversation history for this session
    session_id = ctx.room.name
    if session_id not in conversation_sessions:
        conversation_sessions[session_id] = []

    logging.info("Agent is ready and listening...")

    async for event in stt_stream:
        if event.type == 'final_transcript':
            text = event.alternatives[0].transcript
            if not text:
                continue

            logging.info(f'User said: "{text}"')

            # Add user message to conversation history
            conversation_sessions[session_id].append({
                "role": "user",
                "content": text
            })

            try:
                # Skip user profile for now - use None
                user_profile = None
                logging.info("Using no user profile for this test")
                
                # Call the existing Water Bar chat API
                async with aiohttp.ClientSession() as http_session:
                    payload = {
                        "messages": conversation_sessions[session_id],
                        "userProfile": user_profile
                    }
                    
                    logging.info(f"Sending payload to chat API with {len(conversation_sessions[session_id])} messages")
                    
                    # Use your deployed Next.js app URL or localhost for development
                    api_url = os.environ.get('CHAT_API_URL', 'https://waterbarmenu.vercel.app/api/chat')
                    
                    async with http_session.post(api_url, json=payload) as response:
                        if response.status == 200:
                            # The chat API returns a streaming response
                            response_text = ""
                            async for chunk in response.content.iter_chunked(1024):
                                chunk_text = chunk.decode('utf-8')
                                response_text += chunk_text
                            
                            logging.info(f'Chat API response received: "{response_text[:100]}..."')
                            
                            if not response_text.strip():
                                logging.error("Chat API returned empty response!")
                                response_text = "I'm having trouble generating a response right now. Let me help you with general hydration advice."
                            
                            # Add assistant response to conversation history
                            conversation_sessions[session_id].append({
                                "role": "assistant", 
                                "content": response_text
                            })
                            
                            # Use the agent session's TTS (which will automatically feed to Hedra)
                            logging.info(f"Sending text to TTS: {response_text[:50]}...")
                            await session.say(response_text)
                        else:
                            error_msg = "I'm having trouble accessing my knowledge base right now. Let me give you some general hydration advice instead."
                            logging.error(f"Chat API error: {response.status}")
                            await session.say(error_msg)
                            
            except Exception as e:
                error_msg = "I'm experiencing some technical difficulties. Please try again in a moment."
                logging.error(f"Error calling chat API: {e}")
                await session.say(error_msg)

# CLI command to run the agent
async def main():
    logging.info("Starting LiveKit agent...")
    
    # Get environment variables
    livekit_url = os.environ.get('LIVEKIT_URL')
    livekit_api_key = os.environ.get('LIVEKIT_API_KEY')
    livekit_api_secret = os.environ.get('LIVEKIT_API_SECRET')
    
    logging.info(f"Connecting to: {livekit_url}")
    
    # Create worker
    worker = Worker(
        entrypoint_fnc=entrypoint,
        options=WorkerOptions(
            api_key=livekit_api_key,
            api_secret=livekit_api_secret,
            ws_url=livekit_url,
        ),
    )
    
    # Start the worker
    await worker.run()

if __name__ == "__main__":
    asyncio.run(main())
