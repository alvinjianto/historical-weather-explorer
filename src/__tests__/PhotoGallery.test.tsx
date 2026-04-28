import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import PhotoGallery from '@/components/PhotoGallery';
import { DiaryPhoto } from '@/types/diary';

const makePhoto = (id: string, filename: string): DiaryPhoto => ({
  id,
  filename,
  url: `http://example.com/${filename}`,
  storagePath: `user/date/${filename}`,
  createdAt: '',
});

const photos = [makePhoto('p1', 'a.jpg'), makePhoto('p2', 'b.jpg')];

describe('PhotoGallery', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders nothing when photos array is empty', () => {
    const { container } = render(<PhotoGallery photos={[]} onDelete={() => {}} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders a thumbnail for each photo', () => {
    render(<PhotoGallery photos={photos} onDelete={() => {}} />);
    expect(screen.getAllByRole('img')).toHaveLength(2);
  });

  it('does not call onDelete on the first click', () => {
    const onDelete = vi.fn();
    render(<PhotoGallery photos={photos} onDelete={onDelete} />);

    fireEvent.click(screen.getAllByTitle('Delete photo')[0]);

    expect(onDelete).not.toHaveBeenCalled();
  });

  it('calls onDelete with the photo id on the second click', () => {
    const onDelete = vi.fn();
    render(<PhotoGallery photos={photos} onDelete={onDelete} />);

    fireEvent.click(screen.getAllByTitle('Delete photo')[0]);
    fireEvent.click(screen.getByTitle('Click again to confirm'));

    expect(onDelete).toHaveBeenCalledOnce();
    expect(onDelete).toHaveBeenCalledWith('p1');
  });

  it('resets the confirm state after 3 seconds so a single click no longer deletes', async () => {
    vi.useFakeTimers();
    const onDelete = vi.fn();
    render(<PhotoGallery photos={photos} onDelete={onDelete} />);

    // First click — enters confirm state
    fireEvent.click(screen.getAllByTitle('Delete photo')[0]);
    expect(screen.getByTitle('Click again to confirm')).toBeInTheDocument();

    // Advance past the 3s reset timer
    act(() => { vi.advanceTimersByTime(3000); });

    // Confirm button should be gone — both are back to 'Delete photo'
    expect(screen.queryByTitle('Click again to confirm')).not.toBeInTheDocument();
    expect(screen.getAllByTitle('Delete photo')).toHaveLength(2);

    // A single click now should NOT delete
    fireEvent.click(screen.getAllByTitle('Delete photo')[0]);
    expect(onDelete).not.toHaveBeenCalled();
  });

  it('cancels the reset timer if the user confirms before 3 seconds', () => {
    vi.useFakeTimers();
    const onDelete = vi.fn();
    render(<PhotoGallery photos={photos} onDelete={onDelete} />);

    fireEvent.click(screen.getAllByTitle('Delete photo')[0]);
    fireEvent.click(screen.getByTitle('Click again to confirm'));

    // Should have deleted immediately, not waiting for timer
    expect(onDelete).toHaveBeenCalledWith('p1');

    // Advancing the timer should not cause any side effects
    act(() => { vi.advanceTimersByTime(3000); });
    expect(onDelete).toHaveBeenCalledOnce();
  });
});
