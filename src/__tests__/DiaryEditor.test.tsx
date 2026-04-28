import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DiaryEditor from '@/components/DiaryEditor';

describe('DiaryEditor', () => {
  it('renders with initial content', () => {
    render(<DiaryEditor initialContent="Hello world" saveStatus="idle" onChange={() => {}} />);
    expect(screen.getByRole('textbox')).toHaveValue('Hello world');
  });

  it('syncs initialContent into the textarea before the user has typed', () => {
    const { rerender } = render(
      <DiaryEditor initialContent="" saveStatus="idle" onChange={() => {}} />
    );
    expect(screen.getByRole('textbox')).toHaveValue('');

    rerender(<DiaryEditor initialContent="Loaded from server" saveStatus="idle" onChange={() => {}} />);
    expect(screen.getByRole('textbox')).toHaveValue('Loaded from server');
  });

  it('does not overwrite user text when initialContent changes after editing', () => {
    const { rerender } = render(
      <DiaryEditor initialContent="" saveStatus="idle" onChange={() => {}} />
    );

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'My draft' } });

    // Simulates a server response arriving and updating the parent's entry state
    rerender(<DiaryEditor initialContent="Server version" saveStatus="idle" onChange={() => {}} />);

    expect(screen.getByRole('textbox')).toHaveValue('My draft');
  });

  it('calls onChange with the new value when the user types', () => {
    const onChange = vi.fn();
    render(<DiaryEditor initialContent="" saveStatus="idle" onChange={onChange} />);

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'New text' } });

    expect(onChange).toHaveBeenCalledWith('New text');
  });

  it('shows Saved when saveStatus is saved', () => {
    render(<DiaryEditor initialContent="" saveStatus="saved" onChange={() => {}} />);
    expect(screen.getByText('Saved')).toBeInTheDocument();
  });

  it('shows Saving... when saveStatus is saving', () => {
    render(<DiaryEditor initialContent="" saveStatus="saving" onChange={() => {}} />);
    expect(screen.getByText('Saving...')).toBeInTheDocument();
  });

  it('shows Failed to save when saveStatus is error', () => {
    render(<DiaryEditor initialContent="" saveStatus="error" onChange={() => {}} />);
    expect(screen.getByText('Failed to save')).toBeInTheDocument();
  });

  it('shows no status label when saveStatus is idle', () => {
    render(<DiaryEditor initialContent="" saveStatus="idle" onChange={() => {}} />);
    expect(screen.queryByText('Saving...')).not.toBeInTheDocument();
    expect(screen.queryByText('Saved')).not.toBeInTheDocument();
  });

  it('displays the character count', () => {
    render(<DiaryEditor initialContent="Hello" saveStatus="idle" onChange={() => {}} />);
    expect(screen.getByText('5 characters')).toBeInTheDocument();
  });
});
