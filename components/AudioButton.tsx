import React, { useState, useCallback } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

interface AudioButtonProps {
  text: string;
}

export const AudioButton: React.FC<AudioButtonProps> = ({ text }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlay = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!window.speechSynthesis) {
      alert("Your browser does not support text-to-speech.");
      return;
    }

    // Cancel any current speaking
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    // Prefer Hong Kong Cantonese, fall back to Traditional Chinese (Taiwan), then generic Chinese
    utterance.lang = 'zh-HK'; 
    utterance.rate = 0.8; // Slightly slower for learning

    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    window.speechSynthesis.speak(utterance);
  }, [text]);

  return (
    <button
      onClick={handlePlay}
      className={`p-1.5 rounded-full transition-colors ${
        isPlaying 
          ? 'bg-teal-100 text-teal-600' 
          : 'text-slate-400 hover:bg-slate-100 hover:text-teal-600'
      }`}
      aria-label="Play pronunciation"
      title="Play pronunciation"
    >
      {isPlaying ? <Volume2 size={18} /> : <Volume2 size={18} />}
    </button>
  );
};