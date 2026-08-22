import React, { useRef, useState, useEffect } from "react";
import { Camera, RefreshCw, Trash2, CheckCircle2, Sparkles, Image as ImageIcon } from "lucide-react";
import Button from "../../src/components/ui/Button";
import { useLanguage } from "../../tanmay/i18n/LanguageContext";

/**
 * CameraCapture Component with i18n
 * Handles mobile camera capture and file selection with flat corporate government styling.
 */
export default function CameraCapture({ imageFile, onImageSelected, onImageRemoved, disabled = false }) {
  const { t } = useLanguage();
  const fileInputRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!imageFile) {
      setPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(imageFile);
    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [imageFile]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        alert("Please select a valid image file (JPEG, PNG, WEBP).");
        return;
      }
      onImageSelected(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;

    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      onImageSelected(file);
    }
  };

  const triggerInput = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="w-full mb-5">
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-bold uppercase tracking-wider text-gov-navy flex items-center gap-1.5">
          <Camera className="w-3.5 h-3.5 text-gov-navy" />
          <span>{t('report.photoEvidence')}</span>
          <span className="text-rose-600">*</span>
        </label>
        {imageFile && (
          <span className="text-[11px] font-mono font-bold text-gov-navy bg-gov-surface px-2 py-0.5 rounded border border-gov-border">
            {(imageFile.size / (1024 * 1024)).toFixed(2)} MB
          </span>
        )}
      </div>

      {/* Hidden Mobile-First Camera Input */}
      <input
        ref={fileInputRef}
        id="camera-file-input"
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled}
      />

      {!imageFile ? (
        /* Empty State: Tap to Snap or Upload */
        <div
          onClick={triggerInput}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`group relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-150 ${
            isDragging
              ? "border-gov-navy bg-gov-surface"
              : "border-gov-border hover:border-gov-navy bg-gov-surface/50 hover:bg-gov-surface"
          } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
        >
          <div className="w-12 h-12 mb-3 rounded-lg bg-gov-navy text-gov-accent flex items-center justify-center shadow-soft group-hover:scale-105 transition-transform">
            <Camera className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-gov-navy text-center">
            {t('report.tapToSnap')}
          </p>
          <p className="text-xs text-gov-muted mt-1 text-center font-medium">
            {t('report.dragDrop')}
          </p>
          <div className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-bold text-gov-navy bg-gov-accent/20 px-3 py-1 rounded border border-gov-accent-dark/30 uppercase tracking-wider">
            <Sparkles className="w-3 h-3 text-gov-navy" />
            <span>{t('report.groqBadge')}</span>
          </div>
        </div>
      ) : (
        /* Image Preview Card */
        <div className="relative rounded-xl overflow-hidden border border-gov-border bg-gov-navy shadow-card">
          <img
            src={previewUrl}
            alt="Evidence preview"
            className="w-full h-52 object-cover object-center"
          />

          {/* Dark scrim overlay at bottom */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />

          {/* Top Status Badge */}
          <div className="absolute top-3 left-3 bg-gov-navy/90 text-gov-accent text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded border border-white/20 shadow flex items-center gap-1.5 backdrop-blur-xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-gov-accent" />
            <span>{t('report.photoVerified')}</span>
          </div>

          {/* Actions Bar */}
          <div className="absolute bottom-3 inset-x-3 flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="white"
              size="sm"
              onClick={triggerInput}
              disabled={disabled}
              icon={RefreshCw}
              className="flex-1 text-xs font-bold text-gov-navy shadow"
            >
              {t('report.retake')}
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={onImageRemoved}
              disabled={disabled}
              icon={Trash2}
              className="text-xs font-bold shadow"
            >
              {t('report.remove')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
