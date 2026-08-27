import React, { useState } from 'react';
import { Mic, MicOff, Volume2, Sparkles, CheckCircle } from 'lucide-react';

export default function VoiceRecorder({ lang, onTranscriptionComplete }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');

  const sampleTamilPhrases = [
    "மட்டுத்தாவணி பேருந்து நிலையம் அருகே குப்பை கொட்டி நாறுது, வழி முழுக்கவும் நாற்றம் பிடிச்சிருக்கு.",
    "வேளச்சேரி ரயில் நிலையம் பக்கத்துல ட்ரைனேஜ் உடைஞ்சு ரோடு முழுக்க சாக்கடை தண்ணி தேங்கி நிற்குது.",
    "காந்திபுரம் அவினாசி ரோட்டுல பெரிய குழி விழுந்துருக்கு, பைக் காரங்க விழுந்து அடிபடுது.",
    "சேலம் ஜங்ஷன் மெயின் ரோட்டுல 4 தெருவிளக்கு எரியல, ராத்திரி நேரம் ரொம்ப இருட்டா இருக்கு."
  ];

  const sampleEngPhrases = [
    "Large garbage dump overflowing near Mattuthavani bus stand causing severe bad odor.",
    "Drainage pipe broken near Velachery railway station, sewage water flooded on road.",
    "Dangerous deep road pothole on Avinashi Road near Gandhipuram signal.",
    "Four streetlights broken and dark near Salem Railway Junction main road."
  ];

  const handleToggleRecord = () => {
    if (!isRecording) {
      setIsRecording(true);
      setTranscribedText('');
    } else {
      setIsRecording(false);
      setIsProcessing(true);

      // Simulate Sarvam AI Audio Processing latency
      setTimeout(() => {
        setIsProcessing(false);
        const randomIdx = Math.floor(Math.random() * sampleTamilPhrases.length);
        const textTa = sampleTamilPhrases[randomIdx];
        const textEn = sampleEngPhrases[randomIdx];
        
        setTranscribedText(lang === 'ta' ? textTa : textEn);
        if (onTranscriptionComplete) {
          onTranscriptionComplete({ textTa, textEn });
        }
      }, 1500);
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

      <button
        onClick={handleToggleRecord}
        className={`glass-btn ${isRecording ? 'glass-btn-danger' : 'glass-btn-primary'}`}
        style={{
          width: '76px',
          height: '76px',
          borderRadius: '50%',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto',
          boxShadow: isRecording ? '0 0 25px rgba(239, 68, 68, 0.7)' : '0 0 20px rgba(14, 165, 233, 0.5)'
        }}
      >
        {isRecording ? <MicOff size={32} className="animate-pulse-red" /> : <Mic size={32} />}
      </button>

      <div style={{ marginTop: '12px', fontSize: '0.85rem', color: isRecording ? '#fca5a5' : 'var(--text-dim)' }}>
        {isRecording
          ? (lang === 'ta' ? '🎙️ கேட்கிறது... (பேசி முடித்ததும் மீண்டும் அழுத்தவும்)' : '🎙️ Listening... (Tap again when finished)')
          : isProcessing
          ? (lang === 'ta' ? '⚡ Sarvam AI உரையாக மாற்றுகிறது...' : '⚡ Sarvam AI Processing Audio...')
          : (lang === 'ta' ? 'பேச மைக் அழுத்தவும்' : 'Tap Mic to Speak')}
      </div>

      {transcribedText && (
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
          <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', fontStyle: 'italic' }}>
            "{transcribedText}"
          </p>
        </div>
      )}
    </div>
  );
}
