import { useState } from 'react';
import { X, Sparkles, ChevronDown, Check, Heart, BriefcaseBusiness, Lightbulb } from 'lucide-react';
import type { Folder } from '../types';

interface NewThreadModalProps {
  initialTitle?: string;
  onClose: () => void;
  onCreate: (title: string, folder: Folder, subfolder?: string, tags?: string[]) => Promise<void> | void;
}

export function NewThreadModal({ initialTitle = '', onClose, onCreate }: NewThreadModalProps) {
  const [title, setTitle] = useState(initialTitle);
  const [folder, setFolder] = useState<Folder>('Ideas');
  const [subfolder, setSubfolder] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [folderOpen, setFolderOpen] = useState(false);

  const folderOptions: { value: Folder; label: string; description: string; icon: typeof Heart; color: string }[] = [
    { value: 'Life', label: 'Life', description: 'Personal things and everyday moments', icon: Heart, color: '#e06b68' },
    { value: 'Doing', label: 'Doing', description: 'Projects and things in motion', icon: BriefcaseBusiness, color: '#4f46a5' },
    { value: 'Ideas', label: 'Ideas', description: 'Thoughts worth letting grow', icon: Lightbulb, color: '#c66b4b' },
  ];
  const selectedFolder = folderOptions.find((option) => option.value === folder) ?? folderOptions[0];
  const SelectedFolderIcon = selectedFolder.icon;

  const handleAddTag = () => {
    const tag = tagInput.toLowerCase().trim();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setTagInput('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;
    setIsSubmitting(true);
    await onCreate(title.trim(), folder, subfolder || undefined, tags.length > 0 ? tags : undefined);
  };

  return (
    <div className="fixed inset-0 bg-[#201b3b]/45 backdrop-blur-[2px] flex items-start sm:items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-thread-title"
        className="bg-[#fbf9f6] rounded-[1.75rem] shadow-[0_24px_70px_rgba(32,27,59,0.25)] w-full max-w-md p-5 sm:p-7 my-auto max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2rem)] overflow-y-auto border border-white/70"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-[#c66b4b] mb-2">
              <Sparkles size={16} />
              <span className="text-xs font-bold uppercase tracking-[0.18em]">Make room for it</span>
            </div>
            <h2 id="new-thread-title" className="text-2xl font-bold text-[#27231f]">Create a new thread</h2>
            <p className="text-sm text-[#766e64] mt-1">Give something in your life a place to grow.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-[#9a9186] hover:bg-[#eee7dc] hover:text-[#4b443c] transition-colors"
            aria-label="Close new thread dialog"
          >
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-[#d8cdbf] bg-white px-3 py-3 text-sm !text-[#27231f] caret-[#4f46a5] placeholder:text-[#9a9186] focus:border-[#8f89ca] focus:outline-none focus:ring-2 focus:ring-[#d9d5f3]"
              maxLength={200}
              autoFocus
            />
          </div>
          <div className="relative">
            <label className="block text-sm font-medium text-[#4b443c] mb-1">Where does it belong?</label>
            <button
              type="button"
              onClick={() => setFolderOpen((open) => !open)}
              className={`w-full flex items-center gap-3 border bg-white rounded-xl px-3 py-3 text-left transition-colors ${
                folderOpen ? 'border-[#8f89ca] ring-2 ring-[#d9d5f3]' : 'border-[#d8cdbf] hover:border-[#b9aec2]'
              }`}
              aria-haspopup="listbox"
              aria-expanded={folderOpen}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: `${selectedFolder.color}18`, color: selectedFolder.color }}>
                <SelectedFolderIcon size={17} />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-semibold text-[#4b443c]">{selectedFolder.label}</span>
                <span className="block text-xs text-[#9a9186] truncate">{selectedFolder.description}</span>
              </span>
              <ChevronDown size={17} className={`text-[#9a9186] transition-transform ${folderOpen ? 'rotate-180' : ''}`} />
            </button>
            {folderOpen && (
              <div className="absolute left-0 right-0 top-full z-10 mt-2 overflow-hidden rounded-2xl border border-[#e6ded2] bg-[#fbf9f6] p-1.5 shadow-[0_16px_32px_rgba(92,74,54,0.16)]" role="listbox" aria-label="Choose a folder">
                {folderOptions.map((option) => {
                  const Icon = option.icon;
                  const selected = option.value === folder;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      onClick={() => {
                        setFolder(option.value);
                        setFolderOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                        selected ? 'bg-[#ebe9f8]' : 'hover:bg-[#f1ece5]'
                      }`}
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: `${option.color}18`, color: option.color }}>
                        <Icon size={16} />
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm font-semibold text-[#4b443c]">{option.label}</span>
                        <span className="block text-xs text-[#9a9186] truncate">{option.description}</span>
                      </span>
                      {selected && <Check size={16} className="text-[#4f46a5]" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subfolder (optional)</label>
            <input
              type="text"
              value={subfolder}
              onChange={(e) => setSubfolder(e.target.value)}
              placeholder="e.g. health, active projects"
              className="w-full rounded-xl border border-[#d8cdbf] bg-white px-3 py-3 text-sm !text-[#27231f] caret-[#4f46a5] placeholder:text-[#9a9186] focus:border-[#8f89ca] focus:outline-none focus:ring-2 focus:ring-[#d9d5f3]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
            <div className="flex gap-2 mb-2 flex-wrap">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700"
                >
                  #{tag}
                  <button type="button" onClick={() => setTags(tags.filter((t) => t !== tag))} className="hover:text-red-500">
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Add a tag..."
                className="flex-1 rounded-xl border border-[#d8cdbf] bg-white px-3 py-3 text-sm !text-[#27231f] caret-[#4f46a5] placeholder:text-[#9a9186] focus:border-[#8f89ca] focus:outline-none focus:ring-2 focus:ring-[#d9d5f3]"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3 py-2 text-sm font-medium text-[#4f46a5] bg-[#ebe9f8] rounded-xl hover:bg-[#dedcf3] transition-colors"
              >
                Add
              </button>
            </div>
          </div>
          <div className="flex flex-col-reverse sm:flex-row gap-2 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 text-sm font-medium border border-[#d8cdbf] text-[#766e64] rounded-xl hover:bg-[#eee7dc] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="flex-1 px-4 py-3 text-sm font-semibold bg-gradient-to-r from-[#4f46a5] to-[#665bc0] text-white rounded-xl hover:from-[#40388f] hover:to-[#554bad] disabled:from-[#d8d2ca] disabled:to-[#d8d2ca] disabled:text-[#9a9186] transition-all shadow-[0_8px_18px_rgba(79,70,165,0.18)] disabled:shadow-none"
            >
              {isSubmitting ? 'Creating…' : 'Create thread'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
