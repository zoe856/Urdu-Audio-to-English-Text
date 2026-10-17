import React, { useState } from 'react';
import {
  Volume2,
  Copy,
  Check,
  Download,
  Share2,
  Sparkles,
  BookOpen,
  Info,
  Layers,
  Loader2,
  BookmarkCheck,
} from 'lucide-react';
import { TranslationData } from '../types/translation.ts';
import { AudioPlayer } from './AudioPlayer.tsx';

interface TranslationResultProps {
  data: TranslationData;
  originalAudioUrl?: string;
  originalAudioName?: string;
  onSaveToHistory?: () => void;
  isSaved?: boolean;
}

export const TranslationResult: React.FC<TranslationResultProps> = ({
  data,
  originalAudioUrl,
  originalAudioName,
  onSaveToHistory,
  isSaved = false,
}) => {
  const [activeTab, setActiveTab] = useState<'natural' | 'formal' | 'casual' | 'literal'>('natural');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isPlayingTts, setIsPlayingTts] = useState(false);
  const [ttsLoading, setTtsLoading] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<'Kore' | 'Puck' | 'Zephyr' | 'Charon'>('Kore');
  const [audioTtsInstance, setAudioTtsInstance] = useState<HTMLAudioElement | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const getDisplayedEnglish = () => {
    switch (activeTab) {
      case 'formal':
        return data.formalTranslation || data.englishTranslation;
      case 'casual':
        return data.casualTranslation || data.englishTranslation;
      case 'literal':
        return data.literalTranslation || data.englishTranslation;
      case 'natural':
      default:
        return data.englishTranslation;
    }
  };

  const handleSpeakEnglish = async () => {
    const textToSpeak = getDisplayedEnglish();
    if (!textToSpeak) return;

    // Stop current speech if active
    if (isPlayingTts && audioTtsInstance) {
      audioTtsInstance.pause();
      setIsPlayingTts(false);
      return;
    }

    setTtsLoading(true);
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToSpeak, voice: selectedVoice }),
      });

      const json = await res.json();
      if (!json.success || !json.audioBase64) {
        throw new Error(json.error || 'TTS returned empty audio');
      }

      const audioUrl = `data:audio/wav;base64,${json.audioBase64}`;
      const audio = new Audio(audioUrl);
      setAudioTtsInstance(audio);

      audio.onplay = () => setIsPlayingTts(true);
      audio.onended = () => setIsPlayingTts(false);
      audio.onerror = () => {
        setIsPlayingTts(false);
        fallbackWebSpeech(textToSpeak);
      };

      await audio.play();
    } catch (err) {
      console.warn('Gemini TTS server fallback to browser speech synthesis:', err);
      fallbackWebSpeech(textToSpeak);
    } finally {
      setTtsLoading(false);
    }
  };

  const fallbackWebSpeech = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.95;
      utterance.onstart = () => setIsPlayingTts(true);
      utterance.onend = () => setIsPlayingTts(false);
      utterance.onerror = () => setIsPlayingTts(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const downloadTextReport = () => {
    const content = `=== BOLTRANSLATE: URDU TO ENGLISH CONVERSION ===
Date: ${new Date().toLocaleString()}
Audio Name: ${originalAudioName || 'Urdu Voice Note'}
Tone Detected: ${data.toneDetected || 'Natural'}
Confidence Score: ${data.confidenceScore || 98}%

--- PERFECT ENGLISH TRANSLATION ---
${data.englishTranslation}

${data.formalTranslation ? `Formal Version:\n${data.formalTranslation}\n` : ''}
${data.casualTranslation ? `Casual Version:\n${data.casualTranslation}\n` : ''}
${data.literalTranslation ? `Literal Breakdown:\n${data.literalTranslation}\n` : ''}

--- ORIGINAL URDU TRANSCRIPT (نستعلیق) ---
${data.urduTranscript}

--- ROMAN URDU TRANSLITERATION ---
${data.romanUrdu}

--- SUMMARY ---
${data.summary || ''}

${
  data.vocabulary && data.vocabulary.length > 0
    ? `--- VOCABULARY BREAKDOWN ---\n` +
      data.vocabulary
        .map((v) => `• ${v.urdu} (${v.roman}) -> ${v.english}${v.context ? ` [${v.context}]` : ''}`)
        .join('\n')
    : ''
}

Generated with BolTranslate AI
`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Urdu_Translation_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const displayedEnglish = getDisplayedEnglish();

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Top Meta Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl">
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            Urdu Speech Converted
          </span>

          {data.toneDetected && (
            <span className="px-2.5 py-1 rounded-full text-xs bg-slate-800 text-slate-300 border border-slate-700">
              Tone: <strong className="text-white font-medium">{data.toneDetected}</strong>
            </span>
          )}

          {data.confidenceScore && (
            <span className="px-2.5 py-1 rounded-full text-xs bg-slate-800 text-teal-300 border border-slate-700 font-mono">
              Accuracy: {data.confidenceScore}%
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onSaveToHistory && (
            <button
              type="button"
              onClick={onSaveToHistory}
              className={`p-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                isSaved
                  ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
              }`}
              title="Save to History"
            >
              <BookmarkCheck className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">{isSaved ? 'Saved' : 'Save'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={downloadTextReport}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer"
            title="Download Full Text Report"
          >
            <Download className="w-4 h-4 text-slate-300" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* HERO SECTION: English Output */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border-2 border-emerald-500/50 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="flex flex-wrap items-center justify-between gap-4 mb-4 relative z-10">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-emerald-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              Perfect English Output
            </div>
            <h3 className="text-lg md:text-xl font-bold text-white mt-0.5">
              Clear & Fluent Translation
            </h3>
          </div>

          {/* Style Selector Tabs */}
          <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('natural')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                activeTab === 'natural'
                  ? 'bg-emerald-500 text-slate-950 shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Natural
            </button>
            {data.formalTranslation && (
              <button
                type="button"
                onClick={() => setActiveTab('formal')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  activeTab === 'formal'
                    ? 'bg-emerald-500 text-slate-950 shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Formal
              </button>
            )}
            {data.casualTranslation && (
              <button
                type="button"
                onClick={() => setActiveTab('casual')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  activeTab === 'casual'
                    ? 'bg-emerald-500 text-slate-950 shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Casual
              </button>
            )}
            {data.literalTranslation && (
              <button
                type="button"
                onClick={() => setActiveTab('literal')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  activeTab === 'literal'
                    ? 'bg-emerald-500 text-slate-950 shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Literal
              </button>
            )}
          </div>
        </div>

        {/* Translation text box */}
        <div className="relative z-10 bg-slate-950/70 rounded-2xl p-6 border border-emerald-500/30 mb-5">
          <p className="text-xl md:text-2xl font-semibold text-white leading-relaxed select-text">
            "{displayedEnglish}"
          </p>

          {data.summary && activeTab === 'natural' && (
            <div className="mt-3 pt-3 border-t border-slate-800/80 text-xs text-slate-400 flex items-start gap-1.5">
              <Info className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong>Core Message:</strong> {data.summary}
              </span>
            </div>
          )}
        </div>

        {/* Action Controls for English Output */}
        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10 pt-2 border-t border-slate-800">
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={ttsLoading}
              onClick={handleSpeakEnglish}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs md:text-sm transition-all shadow-md active:scale-95 cursor-pointer ${
                isPlayingTts
                  ? 'bg-rose-500 hover:bg-rose-600 text-white animate-pulse'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
              }`}
            >
              {ttsLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
              <span>{isPlayingTts ? 'Stop English Audio' : 'Listen in English'}</span>
            </button>

            {/* Voice persona selector */}
            <select
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value as any)}
              className="bg-slate-950 text-slate-300 text-xs rounded-xl px-3 py-2 border border-slate-700 outline-none hover:border-slate-600"
            >
              <option value="Kore">Voice: Kore (Natural Female)</option>
              <option value="Puck">Voice: Puck (Engaging Male)</option>
              <option value="Zephyr">Voice: Zephyr (Soft Female)</option>
              <option value="Charon">Voice: Charon (Deep Male)</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => copyToClipboard(displayedEnglish, 'english')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs md:text-sm font-medium border border-slate-700 transition-all active:scale-95 cursor-pointer"
          >
            {copiedKey === 'english' ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">Copied Translation!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy English</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* DUAL SECTION: Spoken Urdu Transcript & Audio Player */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Urdu Nastaliq Transcription */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                Urdu Voice Transcription (اردو متن)
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(data.urduTranscript, 'urdu')}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 p-1 rounded hover:bg-slate-800 transition-colors"
                title="Copy Urdu Script"
              >
                {copiedKey === 'urdu' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>{copiedKey === 'urdu' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800/80 mb-4 min-h-[90px] flex items-center justify-end">
              <p className="font-urdu text-xl md:text-2xl text-emerald-200 leading-[2.4] text-right select-text w-full">
                {data.urduTranscript}
              </p>
            </div>
          </div>

          {/* Roman Urdu Transliteration */}
          <div className="pt-3 border-t border-slate-800/80">
            <div className="flex items-center justify-between mb-1 text-[11px] text-slate-400">
              <span className="font-medium text-slate-300">Roman Urdu Pronunciation:</span>
              <button
                type="button"
                onClick={() => copyToClipboard(data.romanUrdu, 'roman')}
                className="hover:text-white flex items-center gap-1"
              >
                {copiedKey === 'roman' ? 'Copied' : 'Copy Roman'}
              </button>
            </div>
            <p className="text-xs text-slate-300 italic font-mono bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/60">
              {data.romanUrdu}
            </p>
          </div>
        </div>

        {/* Input Voice Playback & Audio Insights */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                Original Audio Playback
              </span>
              {originalAudioName && (
                <span className="text-[11px] text-slate-400 font-mono truncate max-w-[150px]">
                  {originalAudioName}
                </span>
              )}
            </div>

            {originalAudioUrl ? (
              <AudioPlayer src={originalAudioUrl} title="Original Spoken Urdu" className="mb-4" />
            ) : (
              <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 text-xs text-slate-400 italic text-center mb-4">
                Audio stream converted directly.
              </div>
            )}
          </div>

          {/* Linguistic notes */}
          {data.audioNotes && (
            <div className="pt-3 border-t border-slate-800/80 text-xs text-slate-400">
              <span className="font-semibold text-slate-300 block mb-1">Acoustic & Dialect Notes:</span>
              <p className="bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/60">
                {data.audioNotes}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* VOCABULARY & IDIOM BREAKDOWN */}
      {data.vocabulary && data.vocabulary.length > 0 && (
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-md">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-4 h-4 text-emerald-400" />
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              Urdu-English Vocabulary Breakdown
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.vocabulary.map((item, idx) => (
              <div
                key={idx}
                className="bg-slate-950/80 border border-slate-800 hover:border-slate-700 p-3.5 rounded-xl transition-all"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-urdu text-lg text-emerald-300 font-medium">
                    {item.urdu}
                  </span>
                  <span className="text-xs font-mono text-slate-400 italic">
                    {item.roman}
                  </span>
                </div>
                <div className="text-sm font-semibold text-white mb-0.5">
                  {item.english}
                </div>
                {item.context && (
                  <div className="text-[11px] text-slate-400">
                    {item.context}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
