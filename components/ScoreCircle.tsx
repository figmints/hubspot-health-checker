'use client';

import { useEffect, useState } from 'react';

interface ScoreCircleProps {
  score: number;
  size?: 'small' | 'large';
}

export default function ScoreCircle({ score, size = 'large' }: ScoreCircleProps) {
  const [displayScore, setDisplayScore] = useState(0);
  
  const sizeClasses = size === 'large' 
    ? 'w-64 h-64' 
    : 'w-40 h-40';
  
  const textSizeClasses = size === 'large'
    ? 'text-6xl'
    : 'text-4xl';

  useEffect(() => {
    let current = 0;
    const increment = score / 30;
    const timer = setInterval(() => {
      current += increment;
      if (current >= score) {
        setDisplayScore(score);
        clearInterval(timer);
      } else {
        setDisplayScore(Math.floor(current));
      }
    }, 30);

    return () => clearInterval(timer);
  }, [score]);

  // Determine color based on score
  const getColor = () => {
    if (displayScore >= 80) return 'from-emerald-500 to-green-600';
    if (displayScore >= 60) return 'from-blue-500 to-cyan-500';
    if (displayScore >= 40) return 'from-amber-500 to-orange-500';
    return 'from-red-500 to-rose-600';
  };

  const getTextColor = () => {
    if (displayScore >= 80) return 'text-emerald-600';
    if (displayScore >= 60) return 'text-blue-600';
    if (displayScore >= 40) return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <div className={`relative ${sizeClasses} mx-auto flex items-center justify-center`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${getColor()} rounded-full opacity-10`} />
      <div className={`absolute inset-2 bg-white rounded-full shadow-lg`} />
      <div className="relative z-10 text-center">
        <div className={`${textSizeClasses} font-bold ${getTextColor()}`}>
          {displayScore}
        </div>
        <div className="text-slate-600 text-sm font-medium mt-2">out of 100</div>
      </div>
    </div>
  );
}
