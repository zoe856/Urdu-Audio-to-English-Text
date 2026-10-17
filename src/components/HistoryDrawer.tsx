import React from 'react';
import { History, Trash2, X, ExternalLink, Volume2, Calendar } from 'lucide-react';
import { ConversionRecord } from '../types/translation.ts';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  records: ConversionRecord[];
  onSelectRecord: (record: ConversionRecord) => void;
  onClearHistory: () => void;
  onDeleteRecord: (id: string) => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  records,
  onSelectRecord,
  onClearHistory,
  onDeleteRecord,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in">
      <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-white text-base">Translation History</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
              {records.length}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-3">
          {records.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <History className="w-12 h-12 text-slate-700 mb-3 stroke-1" />
              <p className="text-sm font-medium text-slate-300">No saved voice translations yet</p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">
                When you translate an Urdu voice note, click "Save" to keep it here for quick reference.
              </p>
            </div>
          ) : (
            records.map((record) => (
              <div
                key={record.id}
                className="bg-slate-950/70 border border-slate-800/90 hover:border-emerald-500/50 rounded-xl p-3.5 transition-all flex flex-col gap-2 group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="truncate">
                    <span className="text-xs font-semibold text-white truncate block">
                      {record.audioName || 'Urdu Voice Clip'}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      {new Date(record.timestamp).toLocaleString()}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteRecord(record.id);
                    }}
                    className="opacity-60 hover:opacity-100 text-slate-400 hover:text-rose-400 p-1 transition-opacity"
                    title="Delete item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="font-urdu text-sm text-emerald-400/90 text-right truncate">
                  {record.data.urduTranscript}
                </div>

                <p className="text-xs text-slate-300 font-medium line-clamp-2">
                  "{record.data.englishTranslation}"
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                    {record.tone}
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      onSelectRecord(record);
                      onClose();
                    }}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 transition-colors"
                  >
                    <span>View & Listen</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {records.length > 0 && (
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={onClearHistory}
              className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All History</span>
            </button>
            <span className="text-xs text-slate-500 font-mono">Stored in browser</span>
          </div>
        )}
      </div>
    </div>
  );
};
