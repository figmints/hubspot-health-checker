interface IssueCardProps {
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  category: string;
}

export default function IssueCard({
  title,
  description,
  severity,
  category,
}: IssueCardProps) {
  const getSeverityStyles = () => {
    switch (severity) {
      case 'high':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'medium':
        return 'bg-amber-50 border-amber-200 text-amber-800';
      case 'low':
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  const getSeverityBadgeStyles = () => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-700';
      case 'medium':
        return 'bg-amber-100 text-amber-700';
      case 'low':
        return 'bg-blue-100 text-blue-700';
    }
  };

  return (
    <div className={`p-4 border rounded-lg ${getSeverityStyles()}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <h3 className="font-semibold text-sm mb-1">{title}</h3>
          <p className="text-sm opacity-80 mb-2">{description}</p>
          <span className="text-xs font-medium opacity-70">{category}</span>
        </div>
        <span className={`text-xs font-bold px-2 py-1 rounded whitespace-nowrap ${getSeverityBadgeStyles()}`}>
          {severity.toUpperCase()}
        </span>
      </div>
    </div>
  );
}
