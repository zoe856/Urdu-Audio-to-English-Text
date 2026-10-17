import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  UploadCloud,
  Sparkles,
  ArrowRight,
  Loader2,
  History,
  Volume2,
  HelpCircle,
  X,
  Languages,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Headphones,
} from 'lucide-react';
import { FileUploader } from './components/FileUploader.tsx';
import { VoiceRecorder } from './components/VoiceRecorder.tsx';
import { SampleAudios } from './components/SampleAudios.tsx';
import { TranslationResult } from './components/TranslationResult.tsx';
import { HistoryDrawer } from './components/HistoryDrawer.tsx';
import { TranslationData, ConversionRecord, TranslationTone } from './types/translation.ts';

export default function App() {
  const [activeTab, setActiveTab] = useState<'upload' | 'record' | 'samples'>('upload');
  const [tone, setTone] = useState<TranslationTone>('natural');

  // Audio payload state
  const [audioPayload, setAudioPayload] = useState<{
    audioBase64: string;
    mimeType: string;
    duration: number;
    blobUrl: string;
    name: string;
  } | null>(null);

  // Conversion process state
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Active translation output
  const [translationResult, setTranslationResult] = useState<TranslationData | null>(null);
  const resultRef = useRef<HTMLDivElement | null>(null);

  // History state
  const [historyRecords, setHistoryRecords] = useState<ConversionRecord[]>(() => {
    try {
      const saved = localStorage.getItem('boltranslate_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isTipsOpen, setIsTipsOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('boltranslate_history', JSON.stringify(historyRecords));
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }
  }, [historyRecords]);

  const handleAudioReady = (data: {
    audioBase64: string;
    mimeType: string;
    duration: number;
    blobUrl: string;
    name: string;
  }) => {
    setAudioPayload(data);
    setError(null);
  };

  const handleClearAudio = () => {
    if (audioPayload?.blobUrl) {
      URL.revokeObjectURL(audioPayload.blobUrl);
    }
    setAudioPayload(null);
    setError(null);
  };

  const handleConvert = async () => {
    if (!audioPayload) {
      setError('Please upload an Urdu audio file, record your voice, or select a sample clip first.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setProcessingStep('Transcribing Urdu audio & analyzing acoustic phonetics...');

    const stepTimer = setTimeout(() => {
      setProcessingStep('Verifying Nastaliq script & translating to fluent English...');
    }, 1800);

    try {
      const response = await fetch('/api/convert-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64: audioPayload.audioBase64,
          mimeType: audioPayload.mimeType,
          tone,
        }),
      });

      const resData = await response.json();

      if (!response.ok || !resData.success) {
        throw new Error(resData.error || 'Failed to convert Urdu audio. Please try again.');
      }

      setTranslationResult(resData.data);

      // Auto-save to history
      const newRecord: ConversionRecord = {
        id: `rec_${Date.now()}`,
        timestamp: Date.now(),
        audioName: audioPayload.name || 'Urdu Voice Clip',
        audioDataUrl: audioPayload.blobUrl,
        audioDuration: audioPayload.duration,
        data: resData.data,
        tone,
      };

      setHistoryRecords((prev) => [newRecord, ...prev.slice(0, 19)]);

      // Scroll smoothly to results
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
    } catch (err: any) {
      console.error('Conversion error:', err);
      setError(err?.message || 'Something went wrong during translation. Please check the audio and try again.');
    } finally {
      clearTimeout(stepTimer);
      setIsProcessing(false);
      setProcessingStep('');
    }
  };

  const handleSelectHistoryRecord = (record: ConversionRecord) => {
    setTranslationResult(record.data);
    setAudioPayload({
      audioBase64: '',
      mimeType: 'audio/wav',
      duration: record.audioDuration || 0,
      blobUrl: record.audioDataUrl || '',
      name: record.audioName,
    });
    setTone(record.tone);
    setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleDeleteRecord = (id: string) => {
    setHistoryRecords((prev) => prev.filter((r) => r.id !== id));
  };

  const handleClearAllHistory = () => {
    setHistoryRecords([]);
  };

  const resetAll = () => {
    handleClearAudio();
    setTranslationResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 shadow-md shadow-emerald-500/20 font-bold">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-lg text-white tracking-tight">
                  BolTranslate
                </h1>
                <span className="font-urdu text-sm text-emerald-400 font-medium px-2 py-0.5 rounded-md bg-emerald-950/60 border border-emerald-500/30">
                  اردو سے انگلش
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Urdu Voice to English Perfect Translation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsTipsOpen(true)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-colors text-xs flex items-center gap-1.5 cursor-pointer"
              title="Urdu Voice Tips"
            >
              <HelpCircle className="w-4 h-4" />
              <span className="hidden md:inline">Voice Tips</span>
            </button>

            <button
              type="button"
              onClick={() => setIsHistoryOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-medium flex items-center gap-2 transition-all cursor-pointer"
            >
              <History className="w-4 h-4 text-emerald-400" />
              <span>History</span>
              {historyRecords.length > 0 && (
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] flex items-center justify-center font-mono">
                  {historyRecords.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 flex flex-col gap-8">
        {/* Intro Hero Banner */}
        <div className="text-center max-w-2xl mx-auto pt-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-medium mb-3">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>High-Fidelity Urdu Speech-to-English AI</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Speak in Urdu. Get <span className="text-emerald-400">Flawless English</span>.
          </h2>
          <p className="mt-2 text-sm text-slate-400 leading-relaxed">
            Upload voice files, record spoken Urdu on your microphone, or choose a sample.
            Our engine captures authentic Pakistani accents, slang, and formal Urdu, delivering pristine English.
          </p>
        </div>

        {/* Input Card Container */}
        <div className="bg-slate-900/70 border border-slate-800/90 rounded-3xl p-5 sm:p-7 shadow-xl">
          {/* Input Method Tabs */}
          <div className="flex border-b border-slate-800 pb-4 mb-6 gap-2">
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => setActiveTab('upload')}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'upload'
                  ? 'bg-slate-800 text-emerald-400 shadow-xs border border-slate-700'
                  : 'text-slate-400 hover:text-white hover:bg-slate-850'
              }`}
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload Voice File</span>
            </button>

            <button
              type="button"
              disabled={isProcessing}
              onClick={() => setActiveTab('record')}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'record'
                  ? 'bg-slate-800 text-emerald-400 shadow-xs border border-slate-700'
                  : 'text-slate-400 hover:text-white hover:bg-slate-850'
              }`}
            >
              <Mic className="w-4 h-4" />
              <span>Record Urdu (Mic)</span>
            </button>

            <button
              type="button"
              disabled={isProcessing}
              onClick={() => setActiveTab('samples')}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'samples'
                  ? 'bg-slate-800 text-emerald-400 shadow-xs border border-slate-700'
                  : 'text-slate-400 hover:text-white hover:bg-slate-850'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Sample Audio</span>
            </button>
          </div>

          {/* Active Tab Panel */}
          <div className="mb-6">
            {activeTab === 'upload' && (
              <FileUploader
                onAudioReady={handleAudioReady}
                onClear={handleClearAudio}
                isProcessing={isProcessing}
              />
            )}

            {activeTab === 'record' && (
              <VoiceRecorder
                onAudioReady={handleAudioReady}
                onClear={handleClearAudio}
                isProcessing={isProcessing}
              />
            )}

            {activeTab === 'samples' && (
              <SampleAudios
                onSelectSample={handleAudioReady}
                isProcessing={isProcessing}
              />
            )}
          </div>

          {/* Tone & Style Selector */}
          <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold text-slate-300 block mb-1">
                English Translation Style:
              </span>
              <p className="text-[11px] text-slate-400">
                Choose how you want the English output framed
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setTone('natural')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  tone === 'natural'
                    ? 'bg-emerald-500 text-slate-950 font-semibold shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Natural & Fluent
              </button>
              <button
                type="button"
                onClick={() => setTone('formal')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  tone === 'formal'
                    ? 'bg-emerald-500 text-slate-950 font-semibold shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Formal & Professional
              </button>
              <button
                type="button"
                onClick={() => setTone('casual')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  tone === 'casual'
                    ? 'bg-emerald-500 text-slate-950 font-semibold shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Casual & Daily
              </button>
              <button
                type="button"
                onClick={() => setTone('literal')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  tone === 'literal'
                    ? 'bg-emerald-500 text-slate-950 font-semibold shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Literal Structure
              </button>
            </div>
          </div>

          {/* Error Notice */}
          {error && (
            <div className="mt-5 p-4 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-200 text-xs sm:text-sm flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-semibold block mb-0.5">Translation Notice</span>
                <span>{error}</span>
              </div>
              <button
                type="button"
                onClick={() => setError(null)}
                className="text-rose-400 hover:text-rose-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Convert CTA */}
          <div className="mt-6 pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-400">
              {audioPayload ? (
                <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                  <CheckCircle className="w-4 h-4" /> Audio ready: {audioPayload.name}
                </span>
              ) : (
                <span>Upload a voice file or record speech above to begin</span>
              )}
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              {(audioPayload || translationResult) && (
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={resetAll}
                  className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              )}

              <button
                type="button"
                disabled={isProcessing || !audioPayload}
                onClick={handleConvert}
                className={`w-full sm:w-auto px-7 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all shadow-lg active:scale-95 cursor-pointer ${
                  !audioPayload
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    : isProcessing
                    ? 'bg-emerald-600 text-white cursor-wait'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20 hover:shadow-emerald-500/40'
                }`}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Converting Urdu Voice...</span>
                  </>
                ) : (
                  <>
                    <span>Convert Urdu Voice to English</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Processing step indicator */}
          {isProcessing && (
            <div className="mt-4 p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl flex items-center gap-2.5 text-xs text-emerald-300 animate-pulse">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
              <span>{processingStep}</span>
            </div>
          )}
        </div>

        {/* Translation Result Output Section */}
        <div ref={resultRef}>
          {translationResult && (
            <TranslationResult
              data={translationResult}
              originalAudioUrl={audioPayload?.blobUrl}
              originalAudioName={audioPayload?.name}
              isSaved={historyRecords.some((r) => r.data.urduTranscript === translationResult.urduTranscript)}
              onSaveToHistory={() => {
                const alreadySaved = historyRecords.some((r) => r.data.urduTranscript === translationResult.urduTranscript);
                if (!alreadySaved && audioPayload) {
                  const newRecord: ConversionRecord = {
                    id: `rec_${Date.now()}`,
                    timestamp: Date.now(),
                    audioName: audioPayload.name || 'Urdu Voice Note',
                    audioDataUrl: audioPayload.blobUrl,
                    audioDuration: audioPayload.duration,
                    data: translationResult,
                    tone,
                  };
                  setHistoryRecords((prev) => [newRecord, ...prev]);
                }
              }}
            />
          )}
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-800/60">
          <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/80 flex flex-col gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <Languages className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-semibold text-white">Full Dialect Support</h4>
            <p className="text-xs text-slate-400">
              Accurately decodes everyday colloquial Urdu, Karachi/Lahori slang, literary vocabulary, and formal expressions.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/80 flex flex-col gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-950/80 border border-teal-500/30 text-teal-400 flex items-center justify-center">
              <Volume2 className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-semibold text-white">Natural Speech Playback</h4>
            <p className="text-xs text-slate-400">
              Listen to your translated English spoken with native pronunciation and selectable voice styles (Kore, Puck, Zephyr).
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/80 flex flex-col gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-950/80 border border-blue-500/30 text-blue-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-semibold text-white">Dual Script & Vocab</h4>
            <p className="text-xs text-slate-400">
              Receive both beautiful Nastaliq Urdu script and Roman Urdu transliteration, complete with key vocabulary analysis.
            </p>
          </div>
        </div>
      </main>

      {/* History Drawer */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        records={historyRecords}
        onSelectRecord={handleSelectHistoryRecord}
        onClearHistory={handleClearAllHistory}
        onDeleteRecord={handleDeleteRecord}
      />

      {/* Voice Tips Modal */}
      {isTipsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-emerald-400" />
                <span>Tips for Perfect Urdu Voice Input</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsTipsOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
                <strong className="text-emerald-400 block mb-1">1. Speak at Natural Speed</strong>
                Speak in standard or conversational Urdu at a steady pace. You don't need to slow down unnaturally.
              </div>
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
                <strong className="text-emerald-400 block mb-1">2. Mixed Urdu & English (Urdish)</strong>
                The AI understands natural code-switching where English loanwords (e.g., 'meeting', 'office', 'station') are used.
              </div>
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
                <strong className="text-emerald-400 block mb-1">3. Clear Microphone Audio</strong>
                Ensure minimal background television or fan noise. A simple phone microphone or headset yields 99%+ accuracy.
              </div>
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
                <strong className="text-emerald-400 block mb-1">4. Supported Formats</strong>
                MP3, WAV, M4A (voice notes from WhatsApp or iPhone), WEBM, OGG, and AAC up to 25MB.
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsTipsOpen(false)}
              className="mt-2 w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors"
            >
              Got it, let's convert!
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-6 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">BolTranslate AI</span>
            <span>•</span>
            <span className="font-urdu text-emerald-400/90 text-sm">اردو آواز سے انگریزی ترجمہ</span>
          </div>
          <div className="text-slate-500">
            Powered by Gemini Multi-modal Speech Intelligence
          </div>
        </div>
      </footer>
    </div>
  );
}
