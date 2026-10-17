import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Pause, Play, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { AudioVisualizer } from './AudioVisualizer.tsx';
import { AudioPlayer } from './AudioPlayer.tsx';

interface VoiceRecorderProps {
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

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onAudioReady,
  onClear,
  isProcessing,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedBlobUrl, setRecordedBlobUrl] = useState<string | null>(null);
  const [recordedDuration, setRecordedDuration] = useState(0);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const durationTrackerRef = useRef<number>(0);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  const startRecording = async () => {
    setErrorMessage(null);
    setRecordedBlobUrl(null);
    audioChunksRef.current = [];
    durationTrackerRef.current = 0;
    setRecordingTime(0);

    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      setStream(audioStream);

      // Determine best supported MIME type
      const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/mp4',
        'audio/wav',
      ];
      let selectedMime = '';
      for (const mime of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mime)) {
          selectedMime = mime;
          break;
        }
      }

      const recorder = new MediaRecorder(audioStream, selectedMime ? { mimeType: selectedMime } : undefined);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const finalMime = recorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: finalMime });
        const url = URL.createObjectURL(audioBlob);
        setRecordedBlobUrl(url);
        const finalDur = durationTrackerRef.current;
        setRecordedDuration(finalDur);

        // Convert blob to base64
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64data = reader.result as string;
          onAudioReady({
            audioBase64: base64data,
            mimeType: finalMime,
            duration: finalDur,
            blobUrl: url,
            name: `Urdu_Voice_Note_${new Date().toLocaleTimeString().replace(/:/g, '-')}`,
          });
        };

        // Stop stream tracks
        audioStream.getTracks().forEach((track) => track.stop());
        setStream(null);
      };

      recorder.start(250); // Emit chunk every 250ms
      setIsRecording(true);
      setIsPaused(false);

      timerRef.current = setInterval(() => {
        durationTrackerRef.current += 1;
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Microphone access denied or error:', err);
      setErrorMessage(
        err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError'
          ? 'Microphone permission was denied. Please allow microphone access in your browser settings to record Urdu speech.'
          : 'Could not access microphone. Please check your audio input settings.'
      );
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      timerRef.current = setInterval(() => {
        durationTrackerRef.current += 1;
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (timerRef.current) clearInterval(timerRef.current);
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
    }
  };

  const handleDiscard = () => {
    if (recordedBlobUrl) {
      URL.revokeObjectURL(recordedBlobUrl);
    }
    setRecordedBlobUrl(null);
    setRecordingTime(0);
    durationTrackerRef.current = 0;
    onClear();
  };

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col gap-4">
      {errorMessage && (
        <div className="flex items-start gap-2.5 p-3.5 bg-rose-950/60 border border-rose-800/80 rounded-xl text-rose-200 text-sm">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Visualizer & Wave Canvas */}
      <AudioVisualizer stream={stream} isRecording={isRecording && !isPaused} />

      {/* State 1: Ready to Record */}
      {!isRecording && !recordedBlobUrl && (
        <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-700/80 rounded-2xl bg-slate-900/40 hover:bg-slate-900/60 transition-all text-center">
          <button
            type="button"
            disabled={isProcessing}
            onClick={startRecording}
            className="w-20 h-20 rounded-full bg-linear-to-tr from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white flex items-center justify-center shadow-lg shadow-emerald-950/50 hover:shadow-emerald-500/20 active:scale-95 transition-all mb-4 group cursor-pointer"
          >
            <Mic className="w-9 h-9 group-hover:scale-110 transition-transform" />
          </button>
          <h4 className="text-base font-semibold text-white mb-1">
            Tap to Record Urdu Voice
          </h4>
          <p className="text-xs text-slate-400 max-w-sm mb-2">
            Speak clearly in Urdu (اردو میں بات کریں). Say greetings, instructions, conversations, or questions.
          </p>
          <span className="text-[11px] font-urdu text-emerald-400/90 font-medium tracking-wide">
            مائیکروفون پر کلک کریں اور اردو میں بولیں
          </span>
        </div>
      )}

      {/* State 2: Active Recording */}
      {isRecording && (
        <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-slate-900/90 border border-emerald-500/40 shadow-xl">
          <div className="flex items-center gap-2 mb-3">
            <span className="relative flex h-3.5 w-3.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isPaused ? 'bg-amber-400' : 'bg-rose-500'} opacity-75`}></span>
              <span className={`relative inline-flex rounded-full h-3.5 w-3.5 ${isPaused ? 'bg-amber-500' : 'bg-rose-600'}`}></span>
            </span>
            <span className="text-xs font-semibold tracking-wider uppercase text-slate-300">
              {isPaused ? 'Recording Paused' : 'Listening & Recording Urdu...'}
            </span>
          </div>

          <div className="text-4xl font-mono font-bold text-white tracking-tight mb-5">
            {formatTimer(recordingTime)}
          </div>

          <div className="flex items-center gap-4">
            {isPaused ? (
              <button
                type="button"
                onClick={resumeRecording}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium transition-all"
              >
                <Play className="w-4 h-4 fill-current" /> Resume
              </button>
            ) : (
              <button
                type="button"
                onClick={pauseRecording}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium transition-all"
              >
                <Pause className="w-4 h-4" /> Pause
              </button>
            )}

            <button
              type="button"
              onClick={stopRecording}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md shadow-rose-900/40 transition-all active:scale-95 cursor-pointer"
            >
              <Square className="w-4 h-4 fill-current" /> Finish Recording
            </button>
          </div>
        </div>
      )}

      {/* State 3: Recording Complete & Preview Ready */}
      {!isRecording && recordedBlobUrl && (
        <div className="flex flex-col gap-3 p-4 rounded-2xl bg-slate-900/80 border border-emerald-500/40 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
              <CheckCircle2 className="w-4 h-4" /> Urdu Recording Captured ({formatTimer(recordedDuration)})
            </span>
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleDiscard}
              className="text-xs text-slate-400 hover:text-rose-400 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" /> Re-record
            </button>
          </div>

          <AudioPlayer src={recordedBlobUrl} title="Recorded Urdu Voice" />

          <p className="text-xs text-slate-400 italic text-center">
            You can preview your voice note above or click "Convert Urdu Voice" below to translate.
          </p>
        </div>
      )}
    </div>
  );
};
