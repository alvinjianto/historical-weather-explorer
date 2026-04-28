'use client';

import { useRef, useState } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PhotoUploaderProps {
  isUploading: boolean;
  error: string | null;
  onUpload: (file: File) => void;
  onClearError: () => void;
}

export default function PhotoUploader({ isUploading, error, onUpload, onClearError }: PhotoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    onUpload(files[0]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="space-y-2">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isUploading && inputRef.current?.click()}
        className={cn(
          'flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-2xl px-4 py-6 transition-all cursor-pointer select-none',
          isDragging ? 'border-zinc-900 bg-zinc-100' : 'border-zinc-200 bg-zinc-50 hover:border-zinc-400 hover:bg-zinc-100',
          isUploading && 'opacity-50 cursor-not-allowed'
        )}
      >
        <ImagePlus className={cn('w-6 h-6 text-zinc-400', isDragging && 'text-zinc-700')} />
        <p className="text-xs text-zinc-500 text-center">
          {isUploading ? 'Uploading...' : 'Drop a photo here or click to browse'}
        </p>
        <p className="text-xs text-zinc-400">PNG, JPEG, WebP, GIF — max 10 MB</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
          disabled={isUploading}
        />
      </div>

      {error && (
        <div className="flex items-center justify-between gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600">
          <span>{error}</span>
          <button onClick={onClearError} className="shrink-0 text-red-400 hover:text-red-600">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
