"""
Enhanced Audio Processor with streaming ASR, VAD integration, and error handling.
Supports OpenAI Whisper, Deepgram, and AssemblyAI endpoints.
"""

import aiohttp
import asyncio
import json
import time
from typing import AsyncGenerator, Optional, Dict, Any
from tools.telemetry import stats
from audio.vad import VoiceActivityDetector

class AudioProcessor:
    """Streaming ASR with low-latency mode, VAD, and robust error handling."""
    
    def __init__(self, provider: str = "openai", api_key: str = "", config: Dict[str, Any] = None):
        self.provider = provider.lower()
        self.api_key = api_key
        self.config = config or {}
        self.session: Optional[aiohttp.ClientSession] = None
        self.vad = VoiceActivityDetector()
        
        # Provider-specific endpoints
        self.endpoints = {
            "openai": "wss://api.openai.com/v1/audio/transcriptions",
            "deepgram": "wss://api.deepgram.com/v1/listen",
            "assemblyai": "wss://api.assemblyai.com/v2/realtime/ws"
        }
        
        # Default configurations for each provider
        self.default_configs = {
            "openai": {
                "model": "whisper-1",
                "language": "en",
                "response_format": "json",
                "chunk_length_s": 0.1  # 100ms chunks
            },
            "deepgram": {
                "model": "nova-2",
                "language": "en-US",
                "encoding": "linear16",
                "sample_rate": 16000,
                "channels": 1,
                "interim_results": True,
                "punctuate": False,  # Faster without punctuation
                "diarize": False,
                "smart_format": False
            },
            "assemblyai": {
                "sample_rate": 16000,
                "word_boost": [],
                "encoding": "pcm_s16le"
            }
        }
    
    async def __aenter__(self):
        """Async context manager entry"""
        if not self.session:
            self.session = aiohttp.ClientSession()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        if self.session:
            await self.session.close()
    
    def _get_headers(self) -> Dict[str, str]:
        """Get provider-specific headers"""
        if self.provider == "openai":
            return {"Authorization": f"Bearer {self.api_key}"}
        elif self.provider == "deepgram":
            return {"Authorization": f"Token {self.api_key}"}
        elif self.provider == "assemblyai":
            return {"Authorization": self.api_key}
        return {}
    
    def _get_config(self) -> Dict[str, Any]:
        """Get merged configuration for the provider"""
        default = self.default_configs.get(self.provider, {})
        return {**default, **self.config}
    
    async def stream_transcript(self, audio_stream: AsyncGenerator[bytes, None]) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Stream audio to ASR provider and yield partial transcripts.
        
        Args:
            audio_stream: Async generator yielding PCM audio chunks
            
        Yields:
            Dict containing transcript data and metadata
        """
        if not self.session:
            self.session = aiohttp.ClientSession()
        
        endpoint = self.endpoints.get(self.provider)
        if not endpoint:
            raise ValueError(f"Unsupported ASR provider: {self.provider}")
        
        headers = self._get_headers()
        config = self._get_config()
        
        retry_count = 0
        max_retries = 3
        
        while retry_count < max_retries:
            try:
                async with self.session.ws_connect(endpoint, headers=headers) as ws:
                    # Send initial configuration
                    await self._send_config(ws, config)
                    
                    # Start audio streaming task
                    audio_task = asyncio.create_task(
                        self._stream_audio(ws, audio_stream)
                    )
                    
                    # Process incoming transcripts
                    async for transcript_data in self._process_transcripts(ws):
                        yield transcript_data
                    
                    # Wait for audio streaming to complete
                    await audio_task
                    break
                    
            except (aiohttp.ClientError, asyncio.TimeoutError) as e:
                retry_count += 1
                stats.increment(f'audio.{self.provider}.connection_error')
                
                if retry_count >= max_retries:
                    stats.increment(f'audio.{self.provider}.max_retries_exceeded')
                    raise Exception(f"Failed to connect to {self.provider} after {max_retries} attempts: {e}")
                
                # Exponential backoff
                await asyncio.sleep(2 ** retry_count)
    
    async def _send_config(self, ws: aiohttp.ClientWebSocketResponse, config: Dict[str, Any]):
        """Send provider-specific configuration"""
        if self.provider == "openai":
            await ws.send_json({
                "type": "session.update",
                "session": config
            })
        elif self.provider == "deepgram":
            # Deepgram config is sent via query parameters, not WebSocket
            pass
        elif self.provider == "assemblyai":
            await ws.send_json(config)
    
    async def _stream_audio(self, ws: aiohttp.ClientWebSocketResponse, audio_stream: AsyncGenerator[bytes, None]):
        """Stream audio chunks to the WebSocket"""
        try:
            chunk_count = 0
            async for chunk in audio_stream:
                start_time = time.perf_counter()
                
                # Apply VAD to filter out non-speech
                if self.vad.is_speech(chunk):
                    await self._send_audio_chunk(ws, chunk)
                    chunk_count += 1
                    
                    # Track timing
                    send_time = (time.perf_counter() - start_time) * 1000
                    stats.timing(f'audio.{self.provider}.send_chunk_ms', send_time)
                else:
                    stats.increment(f'audio.{self.provider}.vad_filtered')
            
            # Send end-of-stream signal
            await self._send_end_signal(ws)
            stats.gauge(f'audio.{self.provider}.chunks_sent', chunk_count)
            
        except Exception as e:
            stats.increment(f'audio.{self.provider}.stream_error')
            raise
    
    async def _send_audio_chunk(self, ws: aiohttp.ClientWebSocketResponse, chunk: bytes):
        """Send audio chunk with provider-specific format"""
        if self.provider == "openai":
            await ws.send_json({
                "type": "input_audio_buffer.append",
                "audio": chunk.hex()  # OpenAI expects hex-encoded audio
            })
        elif self.provider in ["deepgram", "assemblyai"]:
            await ws.send_bytes(chunk)
    
    async def _send_end_signal(self, ws: aiohttp.ClientWebSocketResponse):
        """Send end-of-stream signal"""
        if self.provider == "openai":
            await ws.send_json({
                "type": "input_audio_buffer.commit"
            })
        elif self.provider == "deepgram":
            await ws.send_json({"type": "CloseStream"})
        elif self.provider == "assemblyai":
            await ws.send_json({"terminate_session": True})
    
    async def _process_transcripts(self, ws: aiohttp.ClientWebSocketResponse) -> AsyncGenerator[Dict[str, Any], None]:
        """Process incoming transcript messages"""
        partial_buffer = ""
        word_count = 0
        
        async for msg in ws:
            if msg.type == aiohttp.WSMsgType.TEXT:
                try:
                    data = json.loads(msg.data)
                    transcript_data = self._parse_transcript(data)
                    
                    if transcript_data:
                        # Track metrics
                        stats.increment(f'audio.{self.provider}.transcript_received')
                        
                        # Count words for early ACK trigger
                        if transcript_data.get('is_partial'):
                            partial_buffer = transcript_data.get('text', '')
                            word_count = len(partial_buffer.split())
                            
                            # Add early ACK trigger flag
                            if word_count >= 6:
                                transcript_data['trigger_early_ack'] = True
                        
                        transcript_data['word_count'] = word_count
                        transcript_data['provider'] = self.provider
                        
                        yield transcript_data
                        
                except json.JSONDecodeError:
                    stats.increment(f'audio.{self.provider}.json_decode_error')
                    continue
                    
            elif msg.type == aiohttp.WSMsgType.ERROR:
                stats.increment(f'audio.{self.provider}.websocket_error')
                break
    
    def _parse_transcript(self, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Parse provider-specific transcript format"""
        if self.provider == "openai":
            if data.get('type') == 'conversation.item.input_audio_transcription.completed':
                return {
                    'text': data.get('transcript', ''),
                    'is_partial': False,
                    'confidence': 1.0,  # OpenAI doesn't provide confidence
                    'timestamp': time.time()
                }
        
        elif self.provider == "deepgram":
            if 'channel' in data and 'alternatives' in data['channel']:
                alt = data['channel']['alternatives'][0]
                return {
                    'text': alt.get('transcript', ''),
                    'is_partial': not data.get('is_final', False),
                    'confidence': alt.get('confidence', 0.0),
                    'timestamp': time.time()
                }
        
        elif self.provider == "assemblyai":
            if data.get('message_type') == 'PartialTranscript':
                return {
                    'text': data.get('text', ''),
                    'is_partial': True,
                    'confidence': data.get('confidence', 0.0),
                    'timestamp': time.time()
                }
            elif data.get('message_type') == 'FinalTranscript':
                return {
                    'text': data.get('text', ''),
                    'is_partial': False,
                    'confidence': data.get('confidence', 0.0),
                    'timestamp': time.time()
                }
        
        return None
    
    async def get_audio_metadata(self, audio_chunk: bytes) -> Dict[str, Any]:
        """Extract metadata from audio chunk"""
        return {
            'speech_confidence': self.vad.get_speech_confidence(audio_chunk),
            'speaker_count': 1,  # Placeholder - would need speaker diarization
            'chunk_size': len(audio_chunk),
            'timestamp': time.time()
        }
