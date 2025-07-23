import asyncio
import logging
import os
from dotenv import load_dotenv
from livekit.agents import JobContext, Worker, WorkerOptions
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

    # Initialize plugins
    stt = STT()
    tts = TTS()
    
    # Initialize Hedra avatar session using the uploaded avatar ID
    avatar_id = os.environ.get('HEDRA_AVATAR_ID')
    if not avatar_id:
        logging.error("HEDRA_AVATAR_ID environment variable not set")
        raise ValueError("HEDRA_AVATAR_ID environment variable is required")
    
    logging.info(f"Using Hedra avatar ID: {avatar_id}")
    hedra = AvatarSession(avatar_id=avatar_id)

    # Start the avatar session
    await hedra.start(session=ctx, room=ctx.room)
    
    # Get the video track from the avatar session
    video_track = hedra.video_track()
    await ctx.room.local_participant.publish_track(video_track)

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
                                tts.say(response_text, stream_id=video_track.stream_id),
                                hedra.play(response_text)
                            )
                        else:
                            error_msg = "I'm having trouble accessing my knowledge base right now. Let me give you some general hydration advice instead."
                            logging.error(f"Chat API error: {response.status}")
                            await asyncio.gather(
                                tts.say(error_msg, stream_id=video_track.stream_id),
                                hedra.play(error_msg)
                            )
                            
            except Exception as e:
                error_msg = "I'm experiencing some technical difficulties. Please try again in a moment."
                logging.error(f"Error calling chat API: {e}")
                await asyncio.gather(
                    tts.say(error_msg, stream_id=video_track.stream_id),
                    hedra.play(error_msg)
                )

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
