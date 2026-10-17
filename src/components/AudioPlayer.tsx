import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX } from 'lucide-react';

interface AudioPlayerProps {
  src: string;
  title?: string;
  className?: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ src, title, className = '' }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState<number>(1);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
  }, [src]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch((e) => console.error('Audio playback failed', e));
    }
    setIsPlaying(!isPlaying);
  };

  const onTimeUpdate = () => {
    if (!audioRef.current) return;
    setCurrentTime(audioRef.current.currentTime);
  };

  const onLoadedMetadata = () => {
    if (!audioRef.current) return;
    setDuration(audioRef.current.duration || 0);
  };

  const onEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const cycleSpeed = () => {
    const speeds = [1, 1.25, 1.5, 0.75];
    const nextIndex = (speeds.indexOf(speed) + 1) % speeds.length;
    const newSpeed = speeds[nextIndex];
    setSpeed(newSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = newSpeed;
    }
  };

  const restartAudio = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(() => {});
    setIsPlaying(true);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className={`flex flex-col bg-slate-900/80 backdrop-blur-md rounded-2xl p-4 border border-slate-700/60 shadow-inner text-white ${className}`}>
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={onTimeUpdate}
        onLoadedMetadata={onLoadedMetadata}
        onEnded={onEnded}
        preload="metadata"
      />

      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-emerald-400 tracking-wide uppercase flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          {title || 'Audio Recording'}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={cycleSpeed}
            title="Change Playback Speed"
            className="text-xs px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono transition-colors"
          >
            {speed}x
          </button>
          <button
            type="button"
            onClick={toggleMute}
            className="text-slate-400 hover:text-white transition-colors"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={togglePlay}
          className="w-10 h-10 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center transition-all shadow-md active:scale-95"
        >
          {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
        </button>

        <button
          type="button"
          onClick={restartAudio}
          title="Restart from beginning"
          className="p-2 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <div className="flex-1 flex items-center gap-2">
          <input
            type="range"
            min={0}
            max={duration || 100}
            step="0.05"
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-400"
          />
        </div>

        <div className="text-xs font-mono text-slate-400 min-w-[70px] text-right">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>
    </div>
  );
};
