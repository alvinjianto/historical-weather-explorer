import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import PhotoUploader from '@/components/PhotoUploader';
import { MAX_FILE_SIZE_MB } from '@/lib/diary';

describe('PhotoUploader', () => {
  it('shows the shared maximum upload size', () => {
    render(
      <PhotoUploader
        isUploading={false}
        error={null}
        onUpload={vi.fn()}
        onClearError={vi.fn()}
      />
    );

    expect(screen.getByText(`PNG, JPEG, WebP, GIF — max ${MAX_FILE_SIZE_MB} MB`)).toBeInTheDocument();
  });
});
