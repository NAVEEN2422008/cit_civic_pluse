import React, { useState } from 'react';
import { Camera, FileText, MapPin, CheckCircle2, AlertCircle, ArrowLeft, ArrowRight, Sparkles, ShieldCheck, ShieldX } from 'lucide-react';
import PhotoCaptureStep from './PhotoCaptureStep';
import MultilingualTextStep from './MultilingualTextStep';
import LocationPickerStep from './LocationPickerStep';
import ReviewSubmitStep from './ReviewSubmitStep';
import { apiService } from '../../utils/apiService';
import { syncEngine } from '../../utils/syncEngine';
import { processNewComplaint } from '../../utils/AIProcessor';
import { translateText } from '../../utils/translationLayer';
import { analyzeReport, transcribeWithGemini, translateWithGemini, detectAiGenerated } from '../../utils/geminiService';
import { verifyMediaExifLocation } from '../../utils/mediaVerifier';
import { t } from '../../i18n/translations';

export default function ReportIssueContainer({ userAuth, onComplaintCreated }) {
  const [step, setStep] = useState(1); // 1: Photo, 2: Description & Voice Box, 3: Location, 4: Review
  
  // Intake state
  const [photoUrl, setPhotoUrl] = useState('');
  const [description, setDescription] = useState('');
  const [language, setLanguage] = useState(userAuth?.preferred_language || 'English');
  const [voiceData, setVoiceData] = useState(null);
  
  const [locationData, setLocationData] = useState({
    lat: 13.0827,
    lng: 80.2707,
    accuracy: 15.0,
    ward: '',
    source: 'GPS'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const handleExifLocation = (exifLoc) => {
    setLocationData(prev => ({
      ...prev,
      lat: exifLoc.lat,
      lng: exifLoc.lng,
      ward: typeof exifLoc.ward === 'string' ? exifLoc.ward : exifLoc.ward?.name || '',
      source: 'EXIF'
    }));
  };

  const handleFinalSubmit = async () => {
    setFeedback(null);

    const hasPhoto = Boolean(photoUrl);
    const hasText = Boolean(description && description.trim());
    const hasVoice = Boolean(voiceData);

    if (!hasPhoto && !hasText && !hasVoice) {
      setFeedback({
        type: 'error',
        text: language === 'Tamil'
          ? 'புகைப்படம், உரை அல்லது குரல் பதிவு - குறைந்தது ஒன்றை வழங்கவும்!'
          : 'Please provide at least a Photo, Text Description, or Voice Recording before submitting!'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const wardString = typeof locationData.ward === 'string'
        ? locationData.ward
        : (locationData.ward?.name || 'Greater Chennai Corporation (Ward 104 - Anna Nagar)');

      // 0) AI IMAGE & EXIF VERIFICATION (when photo present)
      if (hasPhoto && photoUrl.startsWith('data:')) {
        try {
          const m = photoUrl.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
          if (m) {
            const aiResult = await detectAiGenerated(m[2], m[1]);
            if (aiResult?.isAiGenerated && (aiResult.confidence || 0) >= 0.7) {
              setFeedback({
                type: 'error',
                text: language === 'Tamil'
                  ? 'AI-உருவாக்கப்பட்ட புகைப்படம் கண்டறியப்பட்டது (' + Math.round(aiResult.confidence * 100) + '% நம்பகத்தன்மை)! உண்மையான புகைப்படத்தை பதிவேற்றவும்.'
                  : `❌ AI-generated photo detected (${Math.round(aiResult.confidence * 100)}% confidence). Authentic physical photos only.`,
              });
              setIsSubmitting(false);
              return;
            }
            // EXIF GPS vs user GPS location check (if both present)
            if (locationData.exif?.hasGps && locationData.lat && locationData.lng) {
              const dist = verifyMediaExifLocation(
                locationData.exif.lat, locationData.exif.lng,
                locationData.lat, locationData.lng,
                500
              );
              if (dist.hasExifGps && !dist.isValidLocation) {
                setFeedback({
                  type: 'error',
                  text: language === 'Tamil'
                    ? `📍 புகைப்பட GPS அறிவிக்கப்பட்ட இடத்திலிருந்து ${dist.distanceMeters}m தூரத்தில் உள்ளது! (அதிகபட்சம் 500m)`
                    : `📍 Photo GPS is ${dist.distanceMeters}m from your reported location. Must be within 500m.`,
                });
                setIsSubmitting(false);
                return;
              }
            }
          }
        } catch (e) {
          // verification failure is non-fatal; continue submission
          console.warn('AI image / EXIF verify failed (non-fatal):', e.message);
        }
      }

      // 1) Translate multilingual description -> English (for AI)
      const enDescription = (description || voiceData?.transcript || '').trim();
      let translatedEn = enDescription;
      if (enDescription && language !== 'English') {
        // Try Gemini first, fall back to local
        try {
          const g = await translateWithGemini(enDescription, language, 'English');
          translatedEn = g?.text || await translateText(enDescription, language, 'English');
        } catch {
          translatedEn = await translateText(enDescription, language, 'English');
        }
      }

      // 2) Run AI pipeline: classify category, priority, anti-spam,
      //    anti-fraud GPS, 4D fusion duplicate detection
      const aiInput = {
        titleTa: language === 'Tamil' ? enDescription : '',
        titleEn: language === 'English' ? enDescription : translatedEn,
        photoUrl,
        location: {
          lat: locationData.lat,
          lon: locationData.lng,
          name: wardString,
        },
        voiceTranscriptTa: voiceData?.transcript || '',
      };
      const localResult = processNewComplaint(aiInput, []);

      if (localResult.status === 'REJECTED_SPAM' || localResult.status === 'REJECTED_GPS_MISMATCH') {
        setFeedback({
          type: 'error',
          text: language === 'Tamil'
            ? (localResult.reasonTa || 'புகார் நிராகரிக்கப்பட்டது')
            : (localResult.reasonEn || 'Complaint rejected'),
        });
        return;
      }

      // 3) Run Gemini analyzer (image + text) for richer classification
      let geminiAnalysis = null;
      if (hasPhoto || translatedEn) {
        try {
          // Extract base64 from data URL if present
          let photoBase64 = null;
          if (photoUrl && photoUrl.startsWith('data:')) {
            const m = photoUrl.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
            if (m) { photoBase64 = m[2]; }
          }
          geminiAnalysis = await analyzeReport({
            description: translatedEn,
            photoBase64,
            photoMime: 'image/jpeg',
            city: locationData.district || '',
            ward: wardString,
          });
        } catch (e) {
          console.warn('Gemini analysis failed, using local classifier:', e.message);
        }
      }

      // 4) Build the canonical issue — Gemini wins on classification
      //    when it returns a confident answer
      const localTicket = localResult.newTicket || localResult.masterTicket || {};
      const ticket = {
        titleEn: geminiAnalysis?.summary || localTicket.titleEn || translatedEn || description,
        titleTa: language === 'Tamil' ? enDescription : (aiInput.titleTa || geminiAnalysis?.summaryTa || ''),
        categoryEn: geminiAnalysis?.category || localTicket.categoryEn || 'General Civic Issue',
        categoryTa: geminiAnalysis?.categoryTa || localTicket.categoryTa || 'பொதுக் குறைபாடு',
        department: geminiAnalysis?.department || localTicket.department || 'CORPORATION',
        priority: geminiAnalysis?.priority || localTicket.priority || 'MEDIUM',
        priorityScore: geminiAnalysis?.priorityScore ?? localTicket.priorityScore ?? 50,
        slaExpiresAt: localTicket.slaExpiresAt,
        reasoning: geminiAnalysis?.reasoning,
        confidence: geminiAnalysis?.confidence,
      };

      // 5) Persist to backend (Firebase + REST fallback)
      const issuePayload = {
        description: translatedEn || enDescription || null,
        title_en: ticket.titleEn,
        title_ta: language === 'Tamil' ? enDescription : (aiInput.titleTa || null),
        category: ticket.categoryEn,
        category_en: ticket.categoryEn,
        category_ta: ticket.categoryTa || null,
        department: ticket.department,
        priority: ticket.priority,
        priority_score: ticket.priorityScore,
        ward: wardString,
        media_url: photoUrl || null,
        voice_url: voiceData?.base64 || null,
        voice_transcript: voiceData?.transcript || null,
        language,
        latitude: locationData.lat,
        longitude: locationData.lng,
        location_source: locationData.source,
        location_accuracy: locationData.accuracy,
        location_ward: wardString,
        sla_expires_at: ticket.slaExpiresAt,
        ai_processed: true,
        ai_source: geminiAnalysis ? 'gemini+local' : 'local',
        ai_confidence: geminiAnalysis?.confidence ?? ticket.confidence ?? null,
        ai_reasoning: geminiAnalysis?.reasoning || ticket.reasoning || null,
        ai_fusion_score: localResult.fusionScore || null,
        ai_status: localResult.status,
      };

      if (!navigator.onLine) {
        const offlineRecord = await syncEngine.enqueueOfflineComplaint(issuePayload);
        setFeedback({
          type: 'warning',
          text: `Offline — your complaint has been saved locally. It will upload and process automatically when connectivity returns.`
        });
        if (onComplaintCreated) {
          onComplaintCreated({
            ...issuePayload,
            id: offlineRecord.offline_submission_id,
            status: 'WAITING_FOR_SYNC',
            created_at: offlineRecord.created_at,
          });
        }
      } else {
        const res = await apiService.createIssue(issuePayload);
        try { await apiService.firebaseCreateIssue({ ...issuePayload, id: res?.id }); } catch {}

        const successMsg = language === 'Tamil'
          ? (localResult.messageTa || 'புகார் வெற்றிகரமாகப் பதிவு செய்யப்பட்டது!')
          : (geminiAnalysis
              ? `Complaint analyzed by Gemini AI (confidence ${Math.round((geminiAnalysis.confidence || 0) * 100)}%). ${localResult.messageEn || ''} Issue ID: ${res?.id}`
              : (localResult.messageEn || `Complaint registered successfully! Issue ID: ${res?.id}`));

        setFeedback({ type: 'success', text: successMsg });

        if (onComplaintCreated) {
          onComplaintCreated({
            ...issuePayload,
            id: res?.id || localTicket.id,
            status: 'OPEN',
            created_at: new Date().toISOString(),
            priority: ticket.priority,
            categoryEn: ticket.categoryEn,
            categoryTa: ticket.categoryTa,
            department: ticket.department,
            titleEn: ticket.titleEn,
            titleTa: ticket.titleTa,
            slaExpiresAt: ticket.slaExpiresAt,
            ai_confidence: ticket.confidence ?? geminiAnalysis?.confidence ?? null,
            ai_reasoning: ticket.reasoning || geminiAnalysis?.reasoning || null,
            workflow: 'NEW',
          });
        }
      }

      setTimeout(() => {
        setPhotoUrl('');
        setDescription('');
        setVoiceData(null);
        setStep(1);
        setFeedback(null);
      }, 2200);
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Failed to submit complaint.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '780px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Wizard Header Progress Indicator */}
      <div className="glass-panel" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)' }}>
              CITIZEN INTAKE WIZARD (STEP {step} OF 4)
            </span>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>
              {step === 1 && (language === 'Tamil' ? 'குடிமக்கள் புகார் புகைப்படம்' : 'Capture Defect Photo')}
              {step === 2 && (language === 'Tamil' ? 'உரை & குரல் விவரிப்பு' : 'Integrated Text & Voice Description')}
              {step === 3 && (language === 'Tamil' ? 'GPS & செய்லைட் இடம்' : 'GPS & Satellite Location')}
              {step === 4 && (language === 'Tamil' ? 'மதிப்பாய்வு & சமர்ப்பம்' : 'Review & Final Submission')}
            </h2>
          </div>

          <span className="badge badge-low" style={{ fontSize: '0.75rem' }}>
            {userAuth?.preferred_language || 'English'}
          </span>
        </div>

        {/* Step Progress Bar */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              onClick={() => setStep(s)}
              style={{
                flex: 1,
                height: '6px',
                borderRadius: '3px',
                background: s <= step ? 'var(--primary)' : 'rgba(255,255,255,0.15)',
                cursor: 'pointer',
                transition: 'background 0.3s ease'
              }}
            />
          ))}
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div className="glass-panel" style={{
          padding: '14px 20px',
          borderColor: feedback.type === 'success' ? '#10b981' : feedback.type === 'warning' ? '#f59e0b' : '#ef4444',
          background: feedback.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : feedback.type === 'warning' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {feedback.type === 'error' ? <AlertCircle color="#ef4444" /> : <CheckCircle2 color={feedback.type === 'success' ? '#10b981' : '#f59e0b'} />}
            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{feedback.text}</span>
          </div>
        </div>
      )}

      {/* Active Wizard Step Component */}
      {step === 1 && (
        <PhotoCaptureStep
          photoUrl={photoUrl}
          setPhotoUrl={setPhotoUrl}
          onExifLocationDetected={handleExifLocation}
          language={language}
        />
      )}

      {step === 2 && (
        <MultilingualTextStep
          description={description}
          setDescription={setDescription}
          language={language}
          setLanguage={setLanguage}
          voiceData={voiceData}
          setVoiceData={setVoiceData}
        />
      )}

      {step === 3 && (
        <LocationPickerStep
          locationData={locationData}
          setLocationData={setLocationData}
          onComplete={() => setStep(4)}
          language={language}
        />
      )}

      {step === 4 && (
        <ReviewSubmitStep
          photoUrl={photoUrl}
          description={description}
          voiceData={voiceData}
          locationData={locationData}
          language={language}
          isSubmitting={isSubmitting}
          onEditStep={(s) => setStep(s)}
          onSubmit={handleFinalSubmit}
        />
      )}

      {/* Wizard Footer Navigation Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
        <button
          type="button"
          disabled={step === 1}
          onClick={() => setStep(prev => prev - 1)}
          className="glass-btn"
          style={{ padding: '10px 18px', opacity: step === 1 ? 0.4 : 1 }}
        >
          <ArrowLeft size={16} />
          <span>{language === 'Tamil' ? 'மீண்டும்' : 'Back'}</span>
        </button>

        {step < 4 ? (
          <button
            type="button"
            onClick={() => setStep(prev => prev + 1)}
            className="glass-btn glass-btn-primary"
            style={{ padding: '10px 22px' }}
          >
            <span>{language === 'Tamil' ? 'அடுத்த கட்டம்' : 'Next Step'}</span>
            <ArrowRight size={16} />
          </button>
        ) : (
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {language === 'Tamil' ? 'சமர்ப்பிக்க தயார்' : 'Ready to submit'}
          </span>
        )}
      </div>
    </div>
  );
}
