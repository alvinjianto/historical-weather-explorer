'use client';

import { BookOpen, MapPin } from 'lucide-react';
import { useDiaryEntry } from '@/hooks/useDiaryEntry';
import DiaryEditor from '@/components/DiaryEditor';
import PhotoUploader from '@/components/PhotoUploader';
import PhotoGallery from '@/components/PhotoGallery';
import { Location } from '@/types/weather';

interface DiaryPanelProps {
  date: string;
  location: Location & { name: string };
}

export default function DiaryPanel({ date, location }: DiaryPanelProps) {
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
      <div className="flex items-center gap-3 px-6 py-4 border-b border-zinc-100">
        <div className="p-2 bg-zinc-900 rounded-xl">
          <BookOpen className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-zinc-900">Daily Diary</p>
          {entry?.locationName && (
            <p className="text-xs text-zinc-400 flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {entry.locationName}
            </p>
          )}
        </div>
      </div>

      <div className="px-6 pb-6 space-y-4 pt-4">
        {isLoading ? (
          <div className="h-24 bg-zinc-100 rounded-2xl animate-pulse" />
        ) : (
          <>
            <DiaryEditor
              key={date}
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
  );
}
