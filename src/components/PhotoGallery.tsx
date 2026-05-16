'use client';

import { useState } from 'react';
import { X, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { DiaryPhoto } from '@/types/diary';

interface PhotoGalleryProps {
  photos: DiaryPhoto[];
  onDelete: (photoId: string) => void;
}

export default function PhotoGallery({ photos, onDelete }: PhotoGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  if (photos.length === 0) return null;

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);

  const prevPhoto = () =>
    setLightboxIndex((i) => (i !== null ? (i - 1 + photos.length) % photos.length : null));
  const nextPhoto = () =>
    setLightboxIndex((i) => (i !== null ? (i + 1) % photos.length : null));

  const confirmDelete = (photoId: string) => {
    onDelete(photoId);
    setConfirmDeleteId(null);
    if (lightboxIndex !== null) closeLightbox();
  };

  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        {photos.map((photo, index) => (
          <div key={photo.id} className="relative group aspect-square">
            <img
              src={photo.url}
              alt={photo.filename}
              className="w-full h-full object-cover rounded-xl cursor-pointer"
              onClick={() => openLightbox(index)}
            />
            {confirmDeleteId === photo.id ? (
              <div className="absolute top-1.5 right-1.5 flex items-center gap-1 bg-black/80 rounded-lg px-1.5 py-1">
                <span className="text-white/80 text-xs">Delete?</span>
                <button
                  onClick={() => confirmDelete(photo.id)}
                  className="text-red-400 hover:text-red-300 transition-colors"
                  title="Confirm delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  className="text-white/60 hover:text-white transition-colors"
                  title="Cancel"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDeleteId(photo.id)}
                className="absolute top-1.5 right-1.5 p-1 rounded-lg bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                title="Delete photo"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>

      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center"
          onClick={closeLightbox}
        >
          <div className="relative max-w-3xl w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <img
              src={photos[lightboxIndex].url}
              alt={photos[lightboxIndex].filename}
              className="w-full max-h-[80vh] object-contain rounded-2xl"
            />
            <button
              onClick={closeLightbox}
              className="absolute top-3 right-3 p-2 bg-black/60 text-white rounded-xl hover:bg-black/80 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            {photos.length > 1 && (
              <>
                <button
                  onClick={prevPhoto}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-black/60 text-white rounded-xl hover:bg-black/80 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={nextPhoto}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-black/60 text-white rounded-xl hover:bg-black/80 transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
            <p className="text-center text-white/60 text-xs mt-2">{photos[lightboxIndex].filename}</p>
          </div>
        </div>
      )}
    </>
  );
}
