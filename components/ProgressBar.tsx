interface ProgressBarProps {
  label: string;
  score: number;
  icon?: string;
}

export default function ProgressBar({ label, score, icon }: ProgressBarProps) {
  const getColor = () => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 60) return 'bg-blue-500';
    if (score >= 40) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon && <span className="text-lg">{icon}</span>}
          <label className="font-semibold text-slate-900">{label}</label>
        </div>
        <span className="text-sm font-bold text-slate-600">{score}/100</span>
      </div>
      <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
        <div
          className={`h-full ${getColor()} rounded-full transition-all duration-500`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}
