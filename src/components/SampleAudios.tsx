import React, { useState } from 'react';
import { Sparkles, Loader2, PlayCircle, CheckCircle2 } from 'lucide-react';

interface SampleAudiosProps {
  onSelectSample: (audioData: {
    audioBase64: string;
    mimeType: string;
    duration: number;
    blobUrl: string;
    name: string;
  }) => void;
  isProcessing: boolean;
}

interface SampleMeta {
  key: string;
  title: string;
  urduPreview: string;
  romanPreview: string;
  category: string;
}

export const SampleAudios: React.FC<SampleAudiosProps> = ({
  onSelectSample,
  isProcessing,
}) => {
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [activeKey, setActiveKey] = useState<string | null>(null);

  const samples: SampleMeta[] = [
    {
      key: 'greeting',
      title: 'Polite Greeting & Assistance',
      category: 'Conversational',
      urduPreview: 'السلام علیکم! امید ہے آپ خیریت سے ہوں گے...',
      romanPreview: 'Assalam-o-Alaikum! Umeed hai aap khairiyat se honge...',
    },
    {
      key: 'business',
      title: 'Project Deadline & Meeting',
      category: 'Professional',
      urduPreview: 'براہ کرم کل کی میٹنگ کا وقت تصدیق کر دیں...',
      romanPreview: 'Barahe karam kal ki meeting ka waqt tasdeeq kar dein...',
    },
    {
      key: 'travel',
      title: 'Asking for City Directions',
      category: 'Travel & Urban',
      urduPreview: 'کیا آپ مجھے بتا سکتے ہیں کہ سب سے قریبی میٹرو...',
      romanPreview: 'Kya aap mujhe bata sakte hain ke sab se qareebi metro...',
    },
    {
      key: 'proverb',
      title: 'Traditional Urdu Wisdom',
      category: 'Philosophical',
      urduPreview: 'محنت کبھی رائیگاں نہیں جاتی، اور صبر کا پھل...',
      romanPreview: 'Mehnat kabhi raigan nahi jaati, aur sabar ka phal...',
    },
  ];

  const handleLoadSample = async (sample: SampleMeta) => {
    if (isProcessing || loadingKey) return;

    setLoadingKey(sample.key);
    try {
      const res = await fetch('/api/sample-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sampleKey: sample.key }),
      });

      const data = await res.json();
      if (!data.success || !data.audioBase64) {
        throw new Error(data.error || 'Failed to load sample audio');
      }

      // Convert base64 to blob URL
      const byteCharacters = atob(data.audioBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'audio/wav' });
      const blobUrl = URL.createObjectURL(blob);

      setActiveKey(sample.key);
      onSelectSample({
        audioBase64: data.audioBase64,
        mimeType: 'audio/wav',
        duration: 4,
        blobUrl,
        name: `Urdu_Sample_${sample.title}`,
      });
    } catch (err) {
      console.error('Error fetching sample audio:', err);
    } finally {
      setLoadingKey(null);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span className="flex items-center gap-1.5 font-medium text-slate-300">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          No microphone or file handy? Try ready-made Urdu voice clips:
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {samples.map((sample) => {
          const isLoading = loadingKey === sample.key;
          const isSelected = activeKey === sample.key;

          return (
            <button
              key={sample.key}
              type="button"
              disabled={isProcessing || !!loadingKey}
              onClick={() => handleLoadSample(sample)}
              className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between cursor-pointer group ${
                isSelected
                  ? 'border-emerald-500 bg-emerald-950/30 shadow-md shadow-emerald-950/30'
                  : 'border-slate-800 bg-slate-900/60 hover:bg-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <span className="text-xs font-semibold text-white group-hover:text-emerald-300 transition-colors">
                  {sample.title}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                  {sample.category}
                </span>
              </div>

              <div className="font-urdu text-sm text-emerald-400/90 text-right leading-loose mb-1">
                {sample.urduPreview}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-[11px] text-slate-400">
                <span className="italic truncate max-w-[170px]">{sample.romanPreview}</span>

                <div className="flex items-center gap-1 shrink-0 text-emerald-400 font-medium">
                  {isLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : isSelected ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <PlayCircle className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                  )}
                  <span>{isLoading ? 'Loading...' : isSelected ? 'Loaded' : 'Use Clip'}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
