import React, { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  stream: MediaStream | null;
  isRecording: boolean;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ stream, isRecording }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let audioCtx: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let source: MediaStreamAudioSourceNode | null = null;

    if (isRecording && stream) {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        audioCtx = new AudioContextClass();
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const drawLive = () => {
          animationId = requestAnimationFrame(drawLive);
          analyser!.getByteFrequencyData(dataArray);

          ctx.clearRect(0, 0, canvas.width, canvas.height);

          const barWidth = (canvas.width / bufferLength) * 1.5;
          let x = 0;

          for (let i = 0; i < bufferLength; i++) {
            const barHeight = (dataArray[i] / 255) * canvas.height * 0.9;

            // Gradient from emerald to teal
            const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
            gradient.addColorStop(0, '#10b981');
            gradient.addColorStop(0.5, '#06b6d4');
            gradient.addColorStop(1, '#3b82f6');

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.roundRect(x, (canvas.height - barHeight) / 2, barWidth - 2, Math.max(barHeight, 4), [4, 4, 4, 4]);
            ctx.fill();

            x += barWidth;
          }
        };

        drawLive();
      } catch (err) {
        console.warn('AudioContext visualization initialization issue:', err);
      }
    } else {
      // Idle pulsating visual wave
      let phase = 0;
      const drawIdle = () => {
        animationId = requestAnimationFrame(drawIdle);
        phase += 0.05;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const bars = 32;
        const barWidth = canvas.width / bars;

        for (let i = 0; i < bars; i++) {
          const heightFactor = Math.sin(phase + i * 0.3) * 0.35 + 0.45;
          const barHeight = canvas.height * 0.25 * heightFactor;

          ctx.fillStyle = 'rgba(100, 116, 139, 0.4)';
          ctx.beginPath();
          ctx.roundRect(i * barWidth + 2, (canvas.height - barHeight) / 2, barWidth - 4, Math.max(barHeight, 3), [2, 2, 2, 2]);
          ctx.fill();
        }
      };

      drawIdle();
    }

    return () => {
      cancelAnimationFrame(animationId);
      if (source) {
        try { source.disconnect(); } catch (_) {}
      }
      if (audioCtx && audioCtx.state !== 'closed') {
        try { audioCtx.close(); } catch (_) {}
      }
    };
  }, [isRecording, stream]);

  return (
    <div className="w-full bg-slate-950/60 rounded-xl p-2 border border-slate-800/80 overflow-hidden">
      <canvas
        ref={canvasRef}
        width={400}
        height={64}
        className="w-full h-16 block"
      />
    </div>
  );
};
