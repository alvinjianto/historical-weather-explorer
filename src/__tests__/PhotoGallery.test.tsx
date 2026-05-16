import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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

  it('shows inline confirmation with Delete? label after first click', () => {
    render(<PhotoGallery photos={photos} onDelete={() => {}} />);

    fireEvent.click(screen.getAllByTitle('Delete photo')[0]);

    expect(screen.getByText('Delete?')).toBeInTheDocument();
    expect(screen.getByTitle('Confirm delete')).toBeInTheDocument();
    expect(screen.getByTitle('Cancel')).toBeInTheDocument();
  });

  it('calls onDelete with the photo id when confirm delete is clicked', () => {
    const onDelete = vi.fn();
    render(<PhotoGallery photos={photos} onDelete={onDelete} />);

    fireEvent.click(screen.getAllByTitle('Delete photo')[0]);
    fireEvent.click(screen.getByTitle('Confirm delete'));

    expect(onDelete).toHaveBeenCalledOnce();
    expect(onDelete).toHaveBeenCalledWith('p1');
  });

  it('cancels confirmation and restores delete button when cancel is clicked', () => {
    const onDelete = vi.fn();
    render(<PhotoGallery photos={photos} onDelete={onDelete} />);

    fireEvent.click(screen.getAllByTitle('Delete photo')[0]);
    expect(screen.getByText('Delete?')).toBeInTheDocument();

    fireEvent.click(screen.getByTitle('Cancel'));

    expect(screen.queryByText('Delete?')).not.toBeInTheDocument();
    expect(screen.getAllByTitle('Delete photo')).toHaveLength(2);
    expect(onDelete).not.toHaveBeenCalled();
  });

  it('only shows confirmation for the clicked photo, not others', () => {
    render(<PhotoGallery photos={photos} onDelete={() => {}} />);

    fireEvent.click(screen.getAllByTitle('Delete photo')[0]);

    expect(screen.getByText('Delete?')).toBeInTheDocument();
    expect(screen.getAllByTitle('Delete photo')).toHaveLength(1);
  });
});
