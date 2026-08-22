import React, { useState, useEffect, useRef } from "react";
import { FileText, Tag, Plus, Mic, MicOff, Volume2 } from "lucide-react";
import InputField from "../../src/components/ui/InputField";
import { useLanguage } from "../../tanmay/i18n/LanguageContext";

/**
 * SubmissionForm Component with i18n & Web Speech API Voice-to-Text
 * Renders description input, voice dictation, quick tags, and validation hints.
 */
export default function SubmissionForm({
  description,
  onDescriptionChange,
  disabled = false
}) {
  const { t, language } = useLanguage();
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = language === 'hi' ? 'hi-IN' : 'en-IN';

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = (e) => {
        console.warn('Speech recognition error:', e.error);
        setIsListening(false);
      };
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          const updated = description.trim()
            ? `${description.trim()} ${transcript}`
            : transcript;
          onDescriptionChange(updated);
        }
      };

      recognitionRef.current = recognition;
    }
  }, [language, description, onDescriptionChange]);

  const toggleVoiceInput = () => {
    if (disabled || !speechSupported || !recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.lang = language === 'hi' ? 'hi-IN' : 'en-IN';
        recognitionRef.current.start();
      } catch (err) {
        console.warn('Could not start speech recognition:', err);
      }
    }
  };

  const quickTags = [
    { key: 'report.tagPothole', defaultVal: 'Pothole on road' },
    { key: 'report.tagGarbage', defaultVal: 'Overflowing garbage bin' },
    { key: 'report.tagLight', defaultVal: 'Broken streetlight' },
    { key: 'report.tagWater', defaultVal: 'Water pipeline leakage' },
    { key: 'report.tagTree', defaultVal: 'Fallen tree blocking path' },
  ];

  const handleTagClick = (tagLabel) => {
    if (disabled) return;
    if (!description.trim()) {
      onDescriptionChange(tagLabel);
    } else if (!description.includes(tagLabel)) {
      onDescriptionChange(`${description.trim()}, ${tagLabel.toLowerCase()}`);
    }
  };

  return (
    <div className="w-full mb-6 font-sans">
      {/* Label and Voice Trigger Row */}
      <div className="flex items-center justify-between mb-1.5">
        <label htmlFor="issue-description" className="text-xs font-bold text-gov-navy uppercase tracking-wider">
          {t('report.issueDesc')} *
        </label>
        {speechSupported && (
          <button
            type="button"
            onClick={toggleVoiceInput}
            disabled={disabled}
            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              isListening
                ? "bg-red-600 text-white animate-pulse shadow-md"
                : "bg-gov-surface border border-gov-border text-gov-navy hover:bg-gov-navy hover:text-white"
            }`}
          >
            {isListening ? (
              <>
                <MicOff className="w-3.5 h-3.5" />
                <span>Listening ({language === 'hi' ? 'हिंदी' : 'English'})...</span>
              </>
            ) : (
              <>
                <Mic className="w-3.5 h-3.5 text-gov-navy" />
                <span>Speak Description ({language === 'hi' ? 'बोलकर लिखें' : 'Voice Input'})</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Primary Description Input */}
      <InputField
        as="textarea"
        id="issue-description"
        rows={4}
        maxLength={300}
        value={description}
        onChange={(e) => onDescriptionChange(e.target.value)}
        disabled={disabled}
        required
        placeholder={
          isListening
            ? language === 'hi'
              ? 'कृपया बोलें... आपकी आवाज दर्ज की जा रही है...'
              : 'Listening to your voice... Speak clearly...'
            : t('report.descPlaceholder')
        }
        icon={FileText}
      />

      {/* Quick Suggestion Pills */}
      <div className="mt-3">
        <p className="text-xs font-bold uppercase tracking-wider text-gov-muted mb-2 flex items-center gap-1.5">
          <Tag className="w-3 h-3 text-gov-muted" />
          <span>{t('report.quickTagsLabel')}</span>
        </p>
        <div className="flex flex-wrap gap-1.5">
          {quickTags.map((tagObj) => {
            const tagLabel = t(tagObj.key);
            return (
              <button
                key={tagObj.key}
                type="button"
                onClick={() => handleTagClick(tagLabel)}
                disabled={disabled}
                className="text-xs bg-gov-surface hover:bg-gov-navy hover:text-white border border-gov-border text-gov-navy font-semibold py-1 px-2.5 rounded transition-colors active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>{tagLabel}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

