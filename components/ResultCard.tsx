import React from 'react';
import { TranslationItem } from '../types';
import { AudioButton } from './AudioButton';

interface ResultCardProps {
  item: TranslationItem;
  onClick?: () => void;
}

export const ResultCard: React.FC<ResultCardProps> = ({ item, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className={`
        bg-white rounded-xl shadow-sm border border-slate-100 p-4 
        flex flex-col items-center justify-center relative 
        transition-all duration-200
        ${onClick ? 'cursor-pointer hover:shadow-md hover:border-teal-200 hover:-translate-y-0.5 active:translate-y-0' : ''}
      `}
    >
      <div className="absolute top-2 right-2">
        <AudioButton text={item.text} />
      </div>
      
      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
        {item.partOfSpeech}
      </div>
      
      <div className="text-3xl font-chinese font-medium text-slate-800 mb-1 text-center">
        {item.text}
      </div>
      
      <div className="text-lg font-medium text-teal-600 font-sans tracking-tight">
        {item.jyutping}
      </div>
    </div>
  );
};