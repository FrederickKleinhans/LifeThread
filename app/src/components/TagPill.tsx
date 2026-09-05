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
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#ebe9f8] text-[#4f46a5] cursor-pointer hover:bg-[#dedcf3] transition-colors"
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
