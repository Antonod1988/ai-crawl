import React from 'react';

interface StatBarProps {
  label: string;
  current: number;
  max: number;
  colorClass: string;
  showValue?: boolean;
}

const StatBar: React.FC<StatBarProps> = ({ label, current, max, colorClass, showValue = true }) => {
  const percentage = Math.min(100, Math.max(0, (current / max) * 100));

  return (
    <div className="w-full mb-2">
      <div className="flex justify-between text-xs uppercase tracking-wider font-semibold mb-1 text-slate-400">
        <span>{label}</span>
        {showValue && <span>{current} / {max}</span>}
      </div>
      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-500 ease-out ${colorClass}`} 
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default StatBar;
