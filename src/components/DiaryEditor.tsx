'use client';

import { useEffect, useRef, useState } from 'react';
import { SaveStatus } from '@/types/diary';
import { cn } from '@/lib/utils';

interface DiaryEditorProps {
  initialContent: string;
  saveStatus: SaveStatus;
  onChange: (content: string) => void;
}

const STATUS_LABELS: Record<SaveStatus, string> = {
  idle: '',
  saving: 'Saving...',
  saved: 'Saved',
  error: 'Failed to save',
};

export default function DiaryEditor({ initialContent, saveStatus, onChange }: DiaryEditorProps) {
  const [content, setContent] = useState(initialContent);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // Only sync initialContent → content before the user has typed anything.
  // Once the user edits, we stop overwriting their text from prop changes.
  // The parent keys this component by date so it remounts on date navigation,
  // resetting this flag for the new day.
  const userHasEdited = useRef(false);

  useEffect(() => {
    if (!userHasEdited.current) {
      setContent(initialContent);
    }
  }, [initialContent]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [content]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    userHasEdited.current = true;
    setContent(e.target.value);
    onChange(e.target.value);
  };

  return (
    <div className="space-y-2">
      <textarea
        ref={textareaRef}
        value={content}
        onChange={handleChange}
        placeholder="How was this day for you?"
        className="w-full min-h-32 resize-none bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3 text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all leading-relaxed"
        rows={4}
      />
      <div className="flex items-center justify-between px-1">
        <span className="text-xs text-zinc-400">{content.length} characters</span>
        {saveStatus !== 'idle' && (
          <span
            className={cn(
              'text-xs',
              saveStatus === 'saved' && 'text-green-500',
              saveStatus === 'saving' && 'text-zinc-400',
              saveStatus === 'error' && 'text-red-500'
            )}
          >
            {STATUS_LABELS[saveStatus]}
          </span>
        )}
      </div>
    </div>
  );
}
