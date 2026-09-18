import { X } from 'lucide-react';

interface TagPillProps {
  name: string;
  color?: string;
  removable?: boolean;
  onRemove?: () => void;
  onClick?: () => void;
}

export function TagPill({ name, color, removable, onRemove, onClick }: TagPillProps) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full border-2 border-[var(--border)] bg-[var(--butter)] px-2.5 py-1 text-[11px] font-semibold text-[var(--plum)] transition-colors hover:-translate-y-0.5"
      style={color ? { backgroundColor: `${color}20`, color } : undefined}
      onClick={onClick}
    >
      #{name}
      {removable && onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-0.5 hover:text-red-500"
          aria-label={`Remove tag ${name}`}
        >
          <X size={12} />
        </button>
      )}
    </span>
  );
}
