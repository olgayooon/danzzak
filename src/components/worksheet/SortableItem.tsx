import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import type { ReactNode } from 'react';

interface SortableItemProps {
  id: string;
  children: ReactNode;
  editMode: boolean;
}

export function SortableItem({ id, children, editMode }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 10 : undefined,
      }}
      className="relative group"
    >
      {editMode && (
        <button
          {...attributes}
          {...listeners}
          className="absolute -left-6 top-1/2 -translate-y-1/2 p-1 text-[var(--color-ink-faint)] hover:text-[var(--color-ink-muted)] cursor-grab active:cursor-grabbing touch-none"
          aria-label="드래그하여 순서 변경"
        >
          <GripVertical size={14} />
        </button>
      )}
      {children}
    </div>
  );
}
