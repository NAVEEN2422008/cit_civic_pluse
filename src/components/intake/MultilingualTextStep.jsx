import React from 'react';
import { FileText, Globe } from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '../auth/LanguageSelectScreen';

export default function MultilingualTextStep({
  description,
  setDescription,
  language,
  setLanguage
}) {
  return (
    <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)' }}>
          <FileText size={22} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Step 2: Describe the Issue</h3>
        </div>

        {/* Language selector toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Globe size={15} color="#0ea5e9" />
          <select
            className="glass-input"
            style={{ fontSize: '0.8rem', padding: '4px 8px', width: 'auto' }}
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            {SUPPORTED_LANGUAGES.map(lang => (
              <option key={lang.code} value={lang.code} style={{ background: '#0f172a' }}>
                {lang.native} ({lang.label})
              </option>
            ))}
          </select>
        </div>
      </div>

      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
        Provide a text description in your preferred language ({language}).
      </p>

      <textarea
        className="glass-input"
        rows={4}
        maxLength={2000}
        placeholder={
          language === 'Tamil'
            ? 'சாலையில் பெரிய பள்ளம் உள்ளது, மழைநீர் தேங்கி போக்குவரத்துக்கு இடையூறாக உள்ளது...'
            : 'Describe the civic defect, landmark details, or severity...'
        }
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        style={{ fontSize: '0.95rem', lineHeight: '1.5' }}
      />

      <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
        {description.length} / 2000 characters
      </div>
    </div>
  );
}
