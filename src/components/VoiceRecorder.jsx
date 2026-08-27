import React, { useState, useRef } from 'react';
import { Mic, MicOff, Volume2, Sparkles, CheckCircle, AlertCircle } from 'lucide-react';
import { apiService } from '../utils/apiService';

export default function VoiceRecorder({ lang, onTranscriptionComplete }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const [error, setError] = useState('');
  const [audioBlob, setAudioBlob] = useState(null);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const startRecording = async () => {
    try {
      setError('');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
        await processAudio(blob);
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setTranscribedText('');
    } catch (err) {
      console.error('Microphone access denied:', err);
      setError('Microphone access denied. Please allow microphone permission to record voice.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsProcessing(true);
    }
  };

  const processAudio = async (blob) => {
    try {
      setIsProcessing(true);
      setError('');
      
      const result = await apiService.processVoiceNote(blob);
      
      if (result.original_transcript) {
        setTranscribedText(result.original_transcript);
        if (onTranscriptionComplete) {
          onTranscriptionComplete({
            textTa: result.original_transcript,
            textEn: result.translated_english_text || result.original_transcript,
            audioBlob: blob
          });
        }
      } else {
        setError('Failed to process audio. Please try again or type your complaint.');
      }
    } catch (err) {
      console.error('Voice processing error:', err);
      setError('Failed to process voice recording. Please try again or type your complaint.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleRecord = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleDelete = () => {
    setAudioBlob(null);
    setTranscribedText('');
    if (onTranscriptionComplete) {
      onTranscriptionComplete(null);
    }
  };

  const playRecording = () => {
    if (audioBlob) {
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.play();
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '14px' }}>
        <Sparkles size={20} color="#0ea5e9" />
        <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-main)' }}>
          {lang === 'ta' ? 'குரல் மூலம் புகார் பதிவு (Sarvam AI)' : 'Voice Complaint Intake (Sarvam AI)'}
        </h3>
      </div>

      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '18px' }}>
        {lang === 'ta'
          ? 'மைக் பொத்தானை அழுத்தி உங்கள் புகாரைத் தமிழில் பேசுங்கள் (எ.கா: "தெருவிளக்கு எரியவில்லை")'
          : 'Tap mic and speak your issue naturally in Tamil or English'}
      </p>

      {error && (
        <div style={{
          marginBottom: '14px',
          padding: '10px',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '8px',
          color: '#fca5a5',
          fontSize: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          justifyContent: 'center'
        }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <button
        onClick={handleToggleRecord}
        className={`glass-btn ${isRecording ? 'glass-btn-danger' : 'glass-btn-primary'}`}
        disabled={isProcessing}
        style={{
          width: '76px',
          height: '76px',
          borderRadius: '50%',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto',
          boxShadow: isRecording ? '0 0 25px rgba(239, 68, 68, 0.7)' : '0 0 20px rgba(14, 165, 233, 0.5)',
          opacity: isProcessing ? 0.6 : 1
        }}
      >
        {isProcessing ? (
          <div className="animate-spin" style={{ width: 32, height: 32, border: '3px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }} />
        ) : isRecording ? (
          <MicOff size={32} className="animate-pulse-red" />
        ) : (
          <Mic size={32} />
        )}
      </button>

      <div style={{ marginTop: '12px', fontSize: '0.85rem', color: isRecording ? '#fca5a5' : 'var(--text-dim)' }}>
        {isProcessing
          ? (lang === 'ta' ? '⚡ Sarvam AI உரையாக மாற்றுகிறது...' : '⚡ Sarvam AI Processing Audio...')
          : isRecording
          ? (lang === 'ta' ? '🎙️ கேட்கிறது... (பேசி முடித்ததும் மீண்டும் அழுத்தவும்)' : '🎙️ Listening... (Tap again when finished)')
          : (lang === 'ta' ? 'பேச மைக் அழுத்தவும்' : 'Tap Mic to Speak')}
      </div>

      {(audioBlob || transcribedText) && !error && (
        <div style={{
          marginTop: '16px',
          padding: '14px',
          background: 'rgba(14, 165, 233, 0.1)',
          border: '1px solid rgba(14, 165, 233, 0.3)',
          borderRadius: '10px',
          textAlign: 'left'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 600 }}>
            <CheckCircle size={16} />
            <span>{lang === 'ta' ? 'Sarvam AI மாற்றிய உரை:' : 'Sarvam AI Transcribed Text:'}</span>
          </div>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', fontStyle: 'italic', marginBottom: '10px' }}>
            "{transcribedText}"
          </p>
          
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {audioBlob && (
              <button
                onClick={playRecording}
                className="glass-btn glass-btn-primary"
                style={{ fontSize: '0.8rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Volume2 size={14} />
                {lang === 'ta' ? 'சப்தம் கேளுங்கள்' : 'Play Recording'}
              </button>
            )}
            <button
              onClick={handleDelete}
              className="glass-btn glass-btn-danger"
              style={{ fontSize: '0.8rem', padding: '6px 12px' }}
            >
              {lang === 'ta' ? 'நீக்கு' : 'Delete'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
