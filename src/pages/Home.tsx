import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, BookOpen, Gamepad2, FileText, Trash2, ArrowRight,
  ChevronDown, FolderPlus, Folder as FolderIcon,
  Pencil, Check, X, GripVertical,
} from 'lucide-react';
import {
  DndContext, DragOverlay, PointerSensor,
  useSensor, useSensors, useDroppable, useDraggable,
  type DragEndEvent, type DragStartEvent,
} from '@dnd-kit/core';
import { Button } from '../components/ui/Button';
import { useWordSet } from '../hooks/useWordSet';
import type { WordSet, Folder } from '../types/word';
import { getTheme } from '../types/word';
import { useIsDark } from '../hooks/useIsDark';
import { cn } from '../utils/cn';

// ── 폴더 이동 드롭다운 ────────────────────────────────────────────

interface FolderPickerProps {
  folders: Folder[];
  currentFolderId?: string;
  onPick: (folderId: string | null) => void;
  onClose: () => void;
}

function FolderPicker({ folders, currentFolderId, onPick, onClose }: FolderPickerProps) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-1 z-50 bg-[var(--color-surface)] border border-[var(--color-hairline)] rounded-[12px] shadow-[0_8px_24px_rgba(0,0,0,0.12)] min-w-[160px] overflow-hidden animate-fade-in"
    >
      {currentFolderId && (
        <button
          onClick={() => onPick(null)}
          className="flex items-center gap-2 w-full px-3 py-2.5 text-[13px] text-left hover:bg-[var(--color-canvas)] transition-colors text-[var(--color-ink-muted)]"
        >
          <X size={13} /> 폴더에서 제거
        </button>
      )}
      {folders.length === 0 && !currentFolderId && (
        <p className="px-3 py-2.5 text-[12px] text-[var(--color-ink-faint)]">폴더가 없어요</p>
      )}
      {folders.map(f => (
        <button
          key={f.id}
          onClick={() => onPick(f.id)}
          className={cn(
            'flex items-center gap-2 w-full px-3 py-2.5 text-[13px] text-left hover:bg-[var(--color-canvas)] transition-colors',
            f.id === currentFolderId
              ? 'text-[var(--color-primary)] font-semibold'
              : 'text-[var(--color-ink)]'
          )}
        >
          <span>{f.emoji}</span>
          <span className="truncate">{f.name}</span>
          {f.id === currentFolderId && <Check size={12} className="ml-auto shrink-0" />}
        </button>
      ))}
    </div>
  );
}

// ── 단어장 카드 (순수 UI) ──────────────────────────────────────────

interface SetCardProps {
  set: WordSet;
  folders: Folder[];
  onOpen: () => void;
  onDelete: (e: React.MouseEvent) => void;
  onMove: (folderId: string | null) => void;
  /** useDraggable에서 받은 listeners — drag handle에 부착 */
  dragListeners?: Record<string, unknown>;
  isDragging?: boolean;
}

function SetCard({ set, folders, onOpen, onDelete, onMove, dragListeners, isDragging }: SetCardProps) {
  const isDark = useIsDark();
  const theme = getTheme(set.theme, isDark);
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <div
      className={cn(
        'group relative flex items-center gap-2 bg-[var(--color-surface)] rounded-[14px] border border-[var(--color-hairline)]',
        'px-3 py-3 transition-all duration-150',
        isDragging
          ? 'opacity-40 shadow-none'
          : 'cursor-pointer hover:border-[var(--color-primary)] hover:shadow-[0_2px_12px_rgba(124,58,237,0.12)]',
      )}
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onOpen()}
    >
      {/* 드래그 핸들 */}
      <div
        className="cursor-grab active:cursor-grabbing p-1 rounded text-[var(--color-hairline)] hover:text-[var(--color-ink-muted)] transition-colors shrink-0 touch-none"
        onClick={e => e.stopPropagation()}
        {...(dragListeners as React.HTMLAttributes<HTMLDivElement>)}
      >
        <GripVertical size={14} />
      </div>

      {/* 이모지 */}
      <div
        className="w-9 h-9 rounded-[10px] flex items-center justify-center text-lg shrink-0"
        style={{ backgroundColor: theme.cardBg, border: `1px solid ${theme.cardBorder}` }}
      >
        {set.emoji}
      </div>

      {/* 제목 + 단어 수 */}
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-bold text-[var(--color-ink)] truncate">{set.title}</p>
        <p className="text-[11px] text-[var(--color-ink-muted)]">{set.words.length}개 단어</p>
      </div>

      {/* 호버 액션 */}
      <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all shrink-0">
        <div className="relative">
          <button
            onClick={e => { e.stopPropagation(); setPickerOpen(v => !v); }}
            aria-label="폴더로 이동"
            className="p-1.5 rounded-[8px] text-[var(--color-ink-faint)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-subtle)] transition-all"
          >
            <FolderIcon size={13} />
          </button>
          {pickerOpen && (
            <FolderPicker
              folders={folders}
              currentFolderId={set.folderId}
              onPick={fid => { onMove(fid); setPickerOpen(false); }}
              onClose={() => setPickerOpen(false)}
            />
          )}
        </div>
        <button
          onClick={onDelete}
          aria-label="단어장 삭제"
          className="p-1.5 rounded-[8px] text-[var(--color-ink-faint)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-subtle)] transition-all"
        >
          <Trash2 size={13} />
        </button>
      </div>

      {/* 학습 시작 */}
      <div className="flex items-center gap-1 text-[12px] font-semibold shrink-0" style={{ color: theme.primary }}>
        학습 시작 <ArrowRight size={13} />
      </div>
    </div>
  );
}

// ── 드래그 가능한 단어장 행 ────────────────────────────────────────

function DraggableSetCard(props: Omit<SetCardProps, 'dragListeners' | 'isDragging'>) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: props.set.id });

  return (
    <div ref={setNodeRef} {...attributes}>
      <SetCard {...props} dragListeners={listeners} isDragging={isDragging} />
    </div>
  );
}

// ── 드롭 가능한 폴더 섹션 ────────────────────────────────────────

interface FolderSectionProps {
  folder: Folder;
  sets: WordSet[];
  allFolders: Folder[];
  isExpanded: boolean;
  isDraggingAny: boolean;
  onToggle: () => void;
  onOpenSet: (set: WordSet) => void;
  onDeleteSet: (e: React.MouseEvent, id: string) => void;
  onMoveSet: (setId: string, folderId: string | null) => void;
  onRenameFolder: (id: string, name: string) => void;
  onDeleteFolder: (id: string) => void;
}

function FolderSection({
  folder, sets, allFolders, isExpanded, isDraggingAny,
  onToggle, onOpenSet, onDeleteSet, onMoveSet, onRenameFolder, onDeleteFolder,
}: FolderSectionProps) {
  const { setNodeRef, isOver } = useDroppable({ id: `folder-${folder.id}` });

  const [renaming, setRenaming] = useState(false);
  const [nameInput, setNameInput] = useState(folder.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (renaming) inputRef.current?.focus();
  }, [renaming]);

  function commitRename() {
    const trimmed = nameInput.trim();
    if (trimmed && trimmed !== folder.name) onRenameFolder(folder.id, trimmed);
    setRenaming(false);
  }

  const showDropHint = isDraggingAny && !isOver;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'rounded-[14px] border-2 overflow-hidden transition-all duration-150',
        isOver
          ? 'border-[var(--color-primary)] shadow-[0_0_0_3px_var(--color-primary-subtle)]'
          : 'border-[var(--color-hairline)]',
      )}
    >
      {/* 폴더 헤더 */}
      <div
        className={cn(
          'group flex items-center gap-2 px-4 py-3 transition-colors',
          isOver ? 'bg-[var(--color-primary-subtle)]' : 'bg-[var(--color-canvas)]',
        )}
      >
        <button onClick={onToggle} className="flex items-center gap-2 flex-1 min-w-0 text-left">
          <ChevronDown
            size={16}
            className={cn(
              'text-[var(--color-ink-muted)] transition-transform shrink-0',
              !isExpanded && !isDraggingAny && '-rotate-90',
            )}
          />
          <span className="text-lg leading-none">{folder.emoji}</span>
          {renaming ? (
            <input
              ref={inputRef}
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') commitRename();
                if (e.key === 'Escape') setRenaming(false);
              }}
              onBlur={commitRename}
              onClick={e => e.stopPropagation()}
              className="flex-1 min-w-0 bg-[var(--color-surface)] border border-[var(--color-primary)] rounded-[6px] px-2 py-0.5 text-[14px] font-bold text-[var(--color-ink)] outline-none"
            />
          ) : (
            <span className="text-[14px] font-bold text-[var(--color-ink)] truncate">{folder.name}</span>
          )}
          <span className="text-[12px] text-[var(--color-ink-muted)] shrink-0">{sets.length}개</span>
        </button>

        {isOver && (
          <span className="text-[12px] font-bold text-[var(--color-primary)] shrink-0 animate-fade-in">
            여기에 놓기
          </span>
        )}

        {!isDraggingAny && (
          <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all shrink-0">
            <button
              onClick={() => { setNameInput(folder.name); setRenaming(true); }}
              className="p-1.5 rounded-[6px] text-[var(--color-ink-faint)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-subtle)] transition-all"
              title="이름 변경"
            >
              <Pencil size={13} />
            </button>
            <button
              onClick={() => {
                if (confirm(`"${folder.name}" 폴더를 삭제할까요? 단어장은 미분류로 이동합니다.`)) {
                  onDeleteFolder(folder.id);
                }
              }}
              className="p-1.5 rounded-[6px] text-[var(--color-ink-faint)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-subtle)] transition-all"
              title="폴더 삭제"
            >
              <Trash2 size={13} />
            </button>
          </div>
        )}
      </div>

      {/* 단어장 목록 */}
      {(isExpanded || isDraggingAny) && (
        <div className="border-t border-[var(--color-hairline)] bg-[var(--color-surface)]">
          {sets.length === 0 && !isOver ? (
            <p className={cn(
              'px-4 py-4 text-[13px] text-center transition-colors',
              showDropHint
                ? 'text-[var(--color-primary)] font-semibold'
                : 'text-[var(--color-ink-faint)]',
            )}>
              {showDropHint ? '📂 여기로 드래그해서 넣기' : '아직 단어장이 없어요'}
            </p>
          ) : (
            <div className="p-2 flex flex-col gap-1.5">
              {sets.map(set => (
                <DraggableSetCard
                  key={set.id}
                  set={set}
                  folders={allFolders}
                  onOpen={() => onOpenSet(set)}
                  onDelete={e => onDeleteSet(e, set.id)}
                  onMove={fid => onMoveSet(set.id, fid)}
                />
              ))}
              {isOver && sets.length > 0 && (
                <div className="h-[52px] rounded-[12px] border-2 border-dashed border-[var(--color-primary)] bg-[var(--color-primary-subtle)] flex items-center justify-center text-[13px] font-semibold text-[var(--color-primary)] animate-fade-in">
                  여기에 놓기
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── 드롭 가능한 미분류 존 ─────────────────────────────────────────

function DroppableUncategorized({ children, isDraggingFromFolder }: { children: React.ReactNode; isDraggingFromFolder: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'uncategorized' });

  if (!isDraggingFromFolder) return <>{children}</>;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'rounded-[14px] border-2 transition-all duration-150 p-2',
        isOver
          ? 'border-[var(--color-primary)] bg-[var(--color-primary-subtle)] shadow-[0_0_0_3px_var(--color-primary-subtle)]'
          : 'border-dashed border-[var(--color-hairline)]',
      )}
    >
      {isOver && (
        <p className="text-center text-[13px] font-semibold text-[var(--color-primary)] mb-2 animate-fade-in">
          미분류로 이동
        </p>
      )}
      {children}
    </div>
  );
}

// ── 드래그 오버레이 미니 카드 ─────────────────────────────────────

function DragPreviewCard({ set }: { set: WordSet }) {
  const isDark = useIsDark();
  const theme = getTheme(set.theme, isDark);
  return (
    <div className="flex items-center gap-2 bg-[var(--color-surface)] rounded-[14px] border-2 border-[var(--color-primary)] px-3 py-3 shadow-[0_12px_32px_rgba(124,58,237,0.25)] w-[280px] rotate-2">
      <div
        className="w-9 h-9 rounded-[10px] flex items-center justify-center text-lg shrink-0"
        style={{ backgroundColor: theme.cardBg, border: `1px solid ${theme.cardBorder}` }}
      >
        {set.emoji}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-bold text-[var(--color-ink)] truncate">{set.title}</p>
        <p className="text-[11px] text-[var(--color-ink-muted)]">{set.words.length}개 단어</p>
      </div>
    </div>
  );
}

// ── 메인 ─────────────────────────────────────────────────────────

export default function Home() {
  const navigate = useNavigate();
  const {
    sets, folders,
    setActiveSetId, deleteSet,
    createFolder, updateFolder, deleteFolder, moveSetToFolder,
  } = useWordSet();

  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(() => new Set(folders.map(f => f.id)));
  const [activeSetId, setActiveDragSetId] = useState<string | null>(null);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const newFolderInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      folders.forEach(f => { if (!next.has(f.id)) next.add(f.id); });
      return next;
    });
  }, [folders.length]);

  useEffect(() => {
    if (creatingFolder) newFolderInputRef.current?.focus();
  }, [creatingFolder]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const activeSet = activeSetId ? sets.find(s => s.id === activeSetId) : null;
  const isDraggingFromFolder = activeSet ? !!activeSet.folderId : false;

  function handleDragStart({ active }: DragStartEvent) {
    setActiveDragSetId(active.id as string);
    // 드래그 중에는 모든 폴더 펼치기
    setExpandedFolders(new Set(folders.map(f => f.id)));
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveDragSetId(null);
    if (!over) return;
    const setId = active.id as string;
    const overId = over.id as string;
    if (overId === 'uncategorized') {
      moveSetToFolder(setId, null);
    } else if (overId.startsWith('folder-')) {
      const folderId = overId.replace('folder-', '');
      const currentSet = sets.find(s => s.id === setId);
      if (currentSet?.folderId !== folderId) {
        moveSetToFolder(setId, folderId);
      }
    }
  }

  function handleOpenSet(set: WordSet) {
    setActiveSetId(set.id);
    navigate(`/study/${set.id}`);
  }

  function handleDeleteSet(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    if (confirm('단어장을 삭제할까요?')) deleteSet(id);
  }

  function toggleFolder(id: string) {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function commitNewFolder() {
    const trimmed = newFolderName.trim();
    if (trimmed) createFolder(trimmed);
    setCreatingFolder(false);
    setNewFolderName('');
  }

  function handleRenameFolder(id: string, name: string) {
    const folder = folders.find(f => f.id === id);
    if (folder) updateFolder({ ...folder, name });
  }

  const uncategorized = sets.filter(s => !s.folderId);
  const isDraggingAny = !!activeSetId;

  if (sets.length === 0 && folders.length === 0) {
    return (
      <div className="min-h-screen bg-[var(--color-canvas)]">
        <div className="flex flex-col items-center justify-center min-h-[80vh] gap-8 px-4">
          <div
            className="w-20 h-20 rounded-[28px] flex items-center justify-center text-4xl"
            style={{ background: 'linear-gradient(135deg, #4C1D95 0%, #7C3AED 50%, #A855F7 100%)' }}
          >
            📚
          </div>
          <div className="text-center">
            <h1 className="text-[24px] sm:text-[32px] font-extrabold text-[var(--color-ink)] tracking-tight mb-2">
              단짝에 오신 걸 환영해요!
            </h1>
            <p className="text-[14px] sm:text-[16px] text-[var(--color-ink-muted)] whitespace-nowrap">
              단어를 입력하면 즉시 퀴즈 게임과 인쇄용 시험지를 만들 수 있어요.
            </p>
          </div>
          <Button size="lg" onClick={() => navigate('/input')}>
            <Plus size={18} /> 첫 단어장 만들기
          </Button>
          <div className="grid grid-cols-3 gap-3 w-full max-w-sm sm:max-w-lg mt-4">
            {[
              { icon: <BookOpen size={18} />, title: '게임처럼 재밌게', desc: '다양한 게임으로 단어 암기' },
              { icon: <Gamepad2 size={18} />, title: '무료로 모든 기능', desc: '핵심 기능 완전 무료' },
              { icon: <FileText size={18} />, title: '시험지 한 번에', desc: '클릭 몇 번으로 완성' },
            ].map(f => (
              <div key={f.title} className="flex flex-col items-center gap-1.5 p-3 bg-[var(--color-surface)] rounded-[14px] border border-[var(--color-hairline)] text-center">
                <div className="text-[var(--color-primary)]">{f.icon}</div>
                <p className="text-[12px] font-semibold text-[var(--color-ink)]">{f.title}</p>
                <p className="text-[11px] text-[var(--color-ink-muted)]">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-canvas)]">
      <div className="max-w-[960px] mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-[28px] font-extrabold text-[var(--color-ink)] tracking-tight">내 단어장</h1>
          <div className="flex items-center gap-2">
            <Button variant="utility" size="sm" onClick={() => setCreatingFolder(true)}>
              <FolderPlus size={14} /> 새 폴더
            </Button>
            <Button size="sm" onClick={() => navigate('/input')}>
              <Plus size={14} /> 새 단어장
            </Button>
          </div>
        </div>

        {/* 새 폴더 입력 */}
        {creatingFolder && (
          <div className="flex items-center gap-2 mb-4 p-3 bg-[var(--color-surface)] rounded-[12px] border-2 border-[var(--color-primary)] shadow-[0_0_0_3px_var(--color-primary-subtle)]">
            <span className="text-lg">📁</span>
            <input
              ref={newFolderInputRef}
              value={newFolderName}
              onChange={e => setNewFolderName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') commitNewFolder();
                if (e.key === 'Escape') { setCreatingFolder(false); setNewFolderName(''); }
              }}
              placeholder="폴더 이름 입력"
              className="flex-1 text-[15px] font-semibold text-[var(--color-ink)] outline-none placeholder:text-[var(--color-ink-faint)] bg-transparent"
            />
            <button
              onClick={commitNewFolder}
              disabled={!newFolderName.trim()}
              className="px-3 py-1.5 rounded-[8px] text-[13px] font-bold text-white transition-all disabled:opacity-40"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              만들기
            </button>
            <button
              onClick={() => { setCreatingFolder(false); setNewFolderName(''); }}
              className="p-1.5 rounded-[8px] text-[var(--color-ink-muted)] hover:bg-[var(--color-canvas)] transition-all"
            >
              <X size={15} />
            </button>
          </div>
        )}

        {/* 드래그 힌트 (드래그 중) */}
        {isDraggingAny && (
          <p className="text-center text-[12px] text-[var(--color-ink-muted)] mb-3 animate-fade-in">
            폴더 위에 놓으면 이동돼요
          </p>
        )}

        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex flex-col gap-3">
            {/* 폴더들 */}
            {folders.map(folder => (
              <FolderSection
                key={folder.id}
                folder={folder}
                sets={sets.filter(s => s.folderId === folder.id)}
                allFolders={folders}
                isExpanded={expandedFolders.has(folder.id)}
                isDraggingAny={isDraggingAny}
                onToggle={() => toggleFolder(folder.id)}
                onOpenSet={handleOpenSet}
                onDeleteSet={handleDeleteSet}
                onMoveSet={moveSetToFolder}
                onRenameFolder={handleRenameFolder}
                onDeleteFolder={deleteFolder}
              />
            ))}

            {/* 미분류 단어장 */}
            {(uncategorized.length > 0 || isDraggingFromFolder) && (
              <div>
                {folders.length > 0 && (
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-ink-muted)] mb-2 px-1">
                    미분류
                  </p>
                )}
                <DroppableUncategorized isDraggingFromFolder={isDraggingFromFolder}>
                  <div className="flex flex-col gap-1.5">
                    {uncategorized.map(set => (
                      <DraggableSetCard
                        key={set.id}
                        set={set}
                        folders={folders}
                        onOpen={() => handleOpenSet(set)}
                        onDelete={e => handleDeleteSet(e, set.id)}
                        onMove={fid => moveSetToFolder(set.id, fid)}
                      />
                    ))}
                  </div>
                </DroppableUncategorized>
              </div>
            )}

            {sets.length === 0 && folders.length > 0 && (
              <div className="text-center py-8 text-[var(--color-ink-muted)]">
                <p className="text-[14px] mb-3">단어장을 만들고 폴더에 정리해보세요!</p>
                <Button onClick={() => navigate('/input')}>
                  <Plus size={16} /> 새 단어장
                </Button>
              </div>
            )}
          </div>

          {/* 드래그 오버레이 */}
          <DragOverlay dropAnimation={{ duration: 150, easing: 'ease' }}>
            {activeSet ? <DragPreviewCard set={activeSet} /> : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}
