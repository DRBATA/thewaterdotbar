import asyncio
import logging
import os
from dotenv import load_dotenv
from PIL import Image
from livekit.agents import JobContext, Worker, WorkerOptions
from livekit.plugins.deepgram import STT
from livekit.plugins.openai import LLM, TTS
from livekit.plugins.hedra import AvatarSession

# Load environment variables from .env file
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)

# Main agent entrypoint
async def entrypoint(ctx: JobContext):
    logging.info("Agent entrypoint triggered")

    # Initialize plugins
    stt = STT()
    llm = LLM()
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

    logging.info("Agent is ready and listening...")

    async for event in stt_stream:
        if event.type == 'final_transcript':
            text = event.alternatives[0].transcript
            if not text:
                continue

            logging.info(f'User said: "{text}"')

            # Generate a response using the LLM
            # TODO: Replace this with our hydration coach prompt
            chat_stream = llm.chat(ctx, f'The user said: "{text}". Respond conversationally.')

            # Stream the response to both TTS for audio and Hedra for animation
            await asyncio.gather(
                tts.say(chat_stream, stream_id=video_out.stream_id),
                video_out.play(chat_stream)
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
