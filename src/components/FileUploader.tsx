import React, { useState, useRef } from 'react';
import { UploadCloud, FileAudio, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { AudioPlayer } from './AudioPlayer.tsx';

interface FileUploaderProps {
  onAudioReady: (audioData: {
    audioBase64: string;
    mimeType: string;
    duration: number;
    blobUrl: string;
    name: string;
  }) => void;
  onClear: () => void;
  isProcessing: boolean;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  onAudioReady,
  onClear,
  isProcessing,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const acceptedFormats = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/webm', 'audio/ogg', 'audio/m4a', 'audio/x-m4a', 'audio/aac', 'audio/flac'];

  const processFile = (file: File) => {
    setError(null);

    // Validate size (limit 25MB for smooth processing)
    if (file.size > 25 * 1024 * 1024) {
      setError('File size exceeds 25MB limit. Please upload a smaller audio clip.');
      return;
    }

    // MIME type resolution
    let mimeType = file.type;
    if (!mimeType) {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext === 'mp3') mimeType = 'audio/mp3';
      else if (ext === 'wav') mimeType = 'audio/wav';
      else if (ext === 'm4a') mimeType = 'audio/m4a';
      else if (ext === 'ogg') mimeType = 'audio/ogg';
      else if (ext === 'webm') mimeType = 'audio/webm';
      else mimeType = 'audio/mpeg';
    }

    const blobUrl = URL.createObjectURL(file);
    setSelectedFile(file);
    setPreviewUrl(blobUrl);

    // Read file as Base64
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64String = reader.result as string;
      onAudioReady({
        audioBase64: base64String,
        mimeType,
        duration: 0,
        blobUrl,
        name: file.name,
      });
    };
    reader.onerror = () => {
      setError('Failed to read the audio file. Please try another file.');
    };
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      processFile(file);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const handleRemove = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClear();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <div className="flex items-start gap-2.5 p-3.5 bg-rose-950/60 border border-rose-800/80 rounded-xl text-rose-200 text-sm">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {!selectedFile ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-2xl cursor-pointer transition-all text-center ${
            isDragging
              ? 'border-emerald-400 bg-emerald-950/20 scale-[0.99]'
              : 'border-slate-700/80 bg-slate-900/40 hover:bg-slate-900/70 hover:border-slate-600'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*,.mp3,.wav,.m4a,.webm,.ogg,.aac,.flac"
            className="hidden"
            onChange={handleFileInput}
            disabled={isProcessing}
          />

          <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 text-emerald-400 flex items-center justify-center shadow-inner mb-3">
            <UploadCloud className="w-8 h-8" />
          </div>

          <h4 className="text-base font-semibold text-white mb-1">
            Upload Urdu Voice File
          </h4>
          <p className="text-xs text-slate-400 max-w-sm mb-3">
            Drag & drop your voice recording here, or click to browse files from your device.
          </p>

          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-800/90 text-slate-400 border border-slate-700/60">
              MP3, WAV, M4A, WEBM, OGG, AAC
            </span>
            <span className="text-xs text-slate-500">•</span>
            <span className="text-[11px] text-slate-400">Max 25MB</span>
          </div>

          <span className="mt-3 text-xs font-urdu text-emerald-400 font-medium">
            اردو آڈیو فائل یہاں اپ لوڈ کریں
          </span>
        </div>
      ) : (
        <div className="flex flex-col gap-3 p-4 rounded-2xl bg-slate-900/80 border border-emerald-500/40 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                <FileAudio className="w-4 h-4" />
              </div>
              <div className="truncate">
                <div className="text-sm font-semibold text-white truncate max-w-xs sm:max-w-md">
                  {selectedFile.name}
                </div>
                <div className="text-xs text-slate-400">
                  {formatFileSize(selectedFile.size)}
                </div>
              </div>
            </div>

            <button
              type="button"
              disabled={isProcessing}
              onClick={handleRemove}
              className="text-xs text-slate-400 hover:text-rose-400 flex items-center gap-1 transition-colors p-1.5 rounded-lg hover:bg-slate-800 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {previewUrl && (
            <AudioPlayer src={previewUrl} title={selectedFile.name} />
          )}

          <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
            <span className="flex items-center gap-1 text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" /> File ready for translation
            </span>
            <span>Click Convert button below</span>
          </div>
        </div>
      )}
    </div>
  );
};
