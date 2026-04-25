'use client';

import { useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp, MapPin } from 'lucide-react';
import { useDiaryEntry } from '@/hooks/useDiaryEntry';
import DiaryEditor from '@/components/DiaryEditor';
import PhotoUploader from '@/components/PhotoUploader';
import PhotoGallery from '@/components/PhotoGallery';
import { Location } from '@/types/weather';
import { cn } from '@/lib/utils';

interface DiaryPanelProps {
  date: string;
  location: Location & { name: string };
}

export default function DiaryPanel({ date, location }: DiaryPanelProps) {
  const [isOpen, setIsOpen] = useState(true);
  const {
    entry,
    isLoading,
    isUploading,
    saveStatus,
    uploadError,
    saveContent,
    uploadPhoto,
    deletePhoto,
    clearUploadError,
  } = useDiaryEntry(date, location);

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-zinc-200 overflow-hidden">
      <button
        onClick={() => setIsOpen((o) => !o)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-zinc-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-zinc-900 rounded-xl">
            <BookOpen className="w-4 h-4 text-white" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-zinc-900">Daily Diary</p>
            {entry?.locationName && (
              <p className="text-xs text-zinc-400 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {entry.locationName}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {entry && entry.content.trim().length > 0 && (
            <span className="w-2 h-2 rounded-full bg-zinc-900" title="Entry saved" />
          )}
          {isOpen ? (
            <ChevronUp className="w-4 h-4 text-zinc-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-zinc-400" />
          )}
        </div>
      </button>

      <div className={cn('transition-all', isOpen ? 'block' : 'hidden')}>
        <div className="px-6 pb-6 space-y-4 border-t border-zinc-100 pt-4">
          {isLoading ? (
            <div className="h-24 bg-zinc-100 rounded-2xl animate-pulse" />
          ) : (
            <>
              <DiaryEditor
                initialContent={entry?.content ?? ''}
                saveStatus={saveStatus}
                onChange={saveContent}
              />
              <PhotoGallery photos={entry?.photos ?? []} onDelete={deletePhoto} />
              <PhotoUploader
                isUploading={isUploading}
                error={uploadError}
                onUpload={uploadPhoto}
                onClearError={clearUploadError}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
