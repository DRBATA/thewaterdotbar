import asyncio
import logging
import os
from dotenv import load_dotenv
from PIL import Image
from livekit.agents import JobContext, Worker, WorkerOptions
from livekit.plugins.deepgram import STT
from livekit.plugins.openai import TTS
from livekit.plugins.hedra import AvatarSession
import aiohttp
import json

# Load environment variables from .env file
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)

# Store conversation history per session
conversation_sessions = {}

# Main agent entrypoint
async def entrypoint(ctx: JobContext):
    logging.info("Agent entrypoint triggered")

    # Initialize plugins
    stt = STT()
    tts = TTS()
    
    # Load the local avatar image using Pillow, as per the documentation
    avatar_path = os.path.join(os.path.dirname(__file__), '..', 'public', 'images', 'avatar_live.png')
    avatar_image = Image.open(avatar_path)
    hedra = AvatarSession(avatar_image=avatar_image)

    # Start the avatar's video stream
    video_out = hedra.stream(ctx)
    await ctx.room.local_participant.publish_track(video_out.track)

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
                # Call the existing Water Bar chat API
                async with aiohttp.ClientSession() as session:
                    payload = {
                        "messages": conversation_sessions[session_id],
                        "userProfile": None  # Could be enhanced to pass user profile data
                    }
                    
                    # Use your deployed Next.js app URL or localhost for development
                    api_url = os.environ.get('CHAT_API_URL', 'https://waterbarmenu.vercel.app/api/chat')
                    
                    async with session.post(api_url, json=payload) as response:
                        if response.status == 200:
                            # The chat API returns a streaming response
                            response_text = ""
                            async for chunk in response.content.iter_chunked(1024):
                                chunk_text = chunk.decode('utf-8')
                                response_text += chunk_text
                            
                            # Add assistant response to conversation history
                            conversation_sessions[session_id].append({
                                "role": "assistant", 
                                "content": response_text
                            })
                            
                            logging.info(f'Chat API response: "{response_text[:100]}..."')
                            
                            # Stream the response to both TTS for audio and Hedra for animation
                            await asyncio.gather(
                                tts.say(response_text, stream_id=video_out.stream_id),
                                video_out.play(response_text)
                            )
                        else:
                            error_msg = "I'm having trouble accessing my knowledge base right now. Let me give you some general hydration advice instead."
                            logging.error(f"Chat API error: {response.status}")
                            await asyncio.gather(
                                tts.say(error_msg, stream_id=video_out.stream_id),
                                video_out.play(error_msg)
                            )
                            
            except Exception as e:
                error_msg = "I'm experiencing some technical difficulties. Please try again in a moment."
                logging.error(f"Error calling chat API: {e}")
                await asyncio.gather(
                    tts.say(error_msg, stream_id=video_out.stream_id),
                    video_out.play(error_msg)
                )

# CLI command to run the agent
async def main():
    livekit_url = os.environ.get("LIVEKIT_URL")
    livekit_api_key = os.environ.get("LIVEKIT_API_KEY")
    livekit_api_secret = os.environ.get("LIVEKIT_API_SECRET")
    
    print(f"Starting LiveKit agent...")
    print(f"Connecting to: {livekit_url}")
    
    # Create and run the LiveKit worker
    opts = WorkerOptions(
        entrypoint_fnc=entrypoint,
        ws_url=livekit_url,
        api_key=livekit_api_key,
        api_secret=livekit_api_secret,
    )
    worker = Worker(opts)
    await worker.run()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass
