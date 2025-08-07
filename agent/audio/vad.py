"""
Voice Activity Detection (VAD) for filtering non-speech audio chunks.
Reduces ASR processing load and improves latency.
"""

import numpy as np
from typing import Optional
import webrtcvad
import struct

class VoiceActivityDetector:
    """Simple VAD using WebRTC VAD and energy-based detection."""
    
    def __init__(self, aggressiveness: int = 2, sample_rate: int = 16000):
        """
        Initialize VAD.
        
        Args:
            aggressiveness: VAD aggressiveness (0-3, higher = more aggressive)
            sample_rate: Audio sample rate (8000, 16000, 32000, or 48000)
        """
        self.sample_rate = sample_rate
        self.frame_duration_ms = 30  # WebRTC VAD requires 10, 20, or 30ms frames
        self.frame_size = int(sample_rate * self.frame_duration_ms / 1000)
        
        try:
            self.vad = webrtcvad.Vad(aggressiveness)
        except ImportError:
            # Fallback to energy-based VAD if webrtcvad not available
            self.vad = None
        
        # Energy-based thresholds
        self.energy_threshold = 0.01
        self.zero_crossing_threshold = 0.1
    
    def is_speech(self, audio_chunk: bytes) -> bool:
        """
        Determine if audio chunk contains speech.
        
        Args:
            audio_chunk: Raw PCM audio bytes (16-bit, mono)
            
        Returns:
            True if speech is detected, False otherwise
        """
        if len(audio_chunk) < self.frame_size * 2:  # 2 bytes per sample
            return False
        
        # Try WebRTC VAD first
        if self.vad is not None:
            try:
                # WebRTC VAD requires specific frame sizes
                frame_bytes = self.frame_size * 2
                if len(audio_chunk) >= frame_bytes:
                    frame = audio_chunk[:frame_bytes]
                    return self.vad.is_speech(frame, self.sample_rate)
            except Exception:
                pass
        
        # Fallback to energy-based detection
        return self._energy_based_vad(audio_chunk)
    
    def get_speech_confidence(self, audio_chunk: bytes) -> float:
        """
        Get speech confidence score (0.0 - 1.0).
        
        Args:
            audio_chunk: Raw PCM audio bytes
            
        Returns:
            Confidence score between 0.0 and 1.0
        """
        if len(audio_chunk) < 4:
            return 0.0
        
        # Convert bytes to numpy array
        try:
            audio_data = np.frombuffer(audio_chunk, dtype=np.int16).astype(np.float32)
            audio_data = audio_data / 32768.0  # Normalize to [-1, 1]
        except Exception:
            return 0.0
        
        # Calculate multiple features
        energy = self._calculate_energy(audio_data)
        zcr = self._calculate_zero_crossing_rate(audio_data)
        spectral_centroid = self._calculate_spectral_centroid(audio_data)
        
        # Combine features for confidence score
        energy_score = min(1.0, energy / self.energy_threshold)
        zcr_score = min(1.0, zcr / self.zero_crossing_threshold)
        spectral_score = min(1.0, spectral_centroid / 1000.0)  # Normalize
        
        # Weighted combination
        confidence = (energy_score * 0.5 + zcr_score * 0.3 + spectral_score * 0.2)
        return min(1.0, confidence)
    
    def _energy_based_vad(self, audio_chunk: bytes) -> bool:
        """Simple energy-based voice activity detection."""
        try:
            audio_data = np.frombuffer(audio_chunk, dtype=np.int16).astype(np.float32)
            audio_data = audio_data / 32768.0
            
            energy = self._calculate_energy(audio_data)
            zcr = self._calculate_zero_crossing_rate(audio_data)
            
            return energy > self.energy_threshold and zcr > self.zero_crossing_threshold
        except Exception:
            return True  # Default to processing if error
    
    def _calculate_energy(self, audio_data: np.ndarray) -> float:
        """Calculate RMS energy of audio signal."""
        return float(np.sqrt(np.mean(audio_data ** 2)))
    
    def _calculate_zero_crossing_rate(self, audio_data: np.ndarray) -> float:
        """Calculate zero crossing rate."""
        if len(audio_data) < 2:
            return 0.0
        
        zero_crossings = np.sum(np.abs(np.diff(np.sign(audio_data))))
        return zero_crossings / (2.0 * len(audio_data))
    
    def _calculate_spectral_centroid(self, audio_data: np.ndarray) -> float:
        """Calculate spectral centroid (brightness measure)."""
        try:
            # Simple FFT-based spectral centroid
            fft = np.abs(np.fft.fft(audio_data))
            freqs = np.fft.fftfreq(len(audio_data), 1/self.sample_rate)
            
            # Only use positive frequencies
            positive_freqs = freqs[:len(freqs)//2]
            positive_fft = fft[:len(fft)//2]
            
            if np.sum(positive_fft) == 0:
                return 0.0
            
            centroid = np.sum(positive_freqs * positive_fft) / np.sum(positive_fft)
            return float(abs(centroid))
        except Exception:
            return 0.0
