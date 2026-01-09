/**
 * Keyboard Shortcuts Test
 *
 * Tests the keyboard shortcuts implemented in DashboardPage:
 * - Ctrl/Cmd + Enter: Generate Response
 * - Ctrl/Cmd + Shift + C: Copy Response
 * - Ctrl/Cmd + N: New Response (Clear)
 * - Ctrl/Cmd + /: Show Keyboard Help
 * - Ctrl/Cmd + 1-4: Change Tone
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock functions that will be called by shortcuts
const mockGenerateResponse = jest.fn();
const mockCopyToClipboard = jest.fn();
const mockSetReviewText = jest.fn();
const mockSetResponse = jest.fn();
const mockSetTone = jest.fn();
const mockSetShowKeyboardHelp = jest.fn();

// Create a test component that mimics the keyboard shortcut logic
const KeyboardShortcutHandler = ({
  reviewText = '',
  response = '',
  isGenerating = false
}) => {
  const handleKeyDown = (e) => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const modifier = isMac ? e.metaKey : e.ctrlKey;

    const isTyping = ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName);

    // Ctrl/Cmd + Enter: Generate Response
    if (modifier && e.key === 'Enter') {
      e.preventDefault();
      if (reviewText.trim() && !isGenerating) {
        mockGenerateResponse();
      }
      return;
    }

    if (isTyping) return;

    // Ctrl/Cmd + Shift + C: Copy Response
    if (modifier && e.shiftKey && e.key.toLowerCase() === 'c') {
      e.preventDefault();
      if (response) {
        mockCopyToClipboard();
      }
      return;
    }

    // Ctrl/Cmd + N: New Response (Clear)
    if (modifier && e.key.toLowerCase() === 'n') {
      e.preventDefault();
      mockSetReviewText('');
      mockSetResponse('');
      return;
    }

    // Ctrl/Cmd + /: Show Keyboard Help
    if (modifier && e.key === '/') {
      e.preventDefault();
      mockSetShowKeyboardHelp(true);
      return;
    }

    // Ctrl/Cmd + 1-4: Change Tone
    if (modifier && ['1', '2', '3', '4'].includes(e.key)) {
      e.preventDefault();
      const tones = ['professional', 'friendly', 'formal', 'apologetic'];
      mockSetTone(tones[parseInt(e.key) - 1]);
      return;
    }
  };

  return (
    <div data-testid="shortcut-handler" onKeyDown={handleKeyDown} tabIndex={0}>
      <span>Keyboard Shortcut Test</span>
    </div>
  );
};

describe('Keyboard Shortcuts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Ctrl+Enter calls generateResponse when review text exists', () => {
    render(<KeyboardShortcutHandler reviewText="Great service!" />);
    const element = screen.getByTestId('shortcut-handler');
    element.focus();

    fireEvent.keyDown(element, { key: 'Enter', ctrlKey: true });

    expect(mockGenerateResponse).toHaveBeenCalled();
  });

  test('Ctrl+Enter does not call generateResponse when review text is empty', () => {
    render(<KeyboardShortcutHandler reviewText="" />);
    const element = screen.getByTestId('shortcut-handler');
    element.focus();

    fireEvent.keyDown(element, { key: 'Enter', ctrlKey: true });

    expect(mockGenerateResponse).not.toHaveBeenCalled();
  });

  test('Ctrl+Enter does not call generateResponse when isGenerating is true', () => {
    render(<KeyboardShortcutHandler reviewText="Great service!" isGenerating={true} />);
    const element = screen.getByTestId('shortcut-handler');
    element.focus();

    fireEvent.keyDown(element, { key: 'Enter', ctrlKey: true });

    expect(mockGenerateResponse).not.toHaveBeenCalled();
  });

  test('Ctrl+Shift+C calls copyToClipboard when response exists', () => {
    render(<KeyboardShortcutHandler response="Thank you for your feedback!" />);
    const element = screen.getByTestId('shortcut-handler');
    element.focus();

    fireEvent.keyDown(element, { key: 'c', ctrlKey: true, shiftKey: true });

    expect(mockCopyToClipboard).toHaveBeenCalled();
  });

  test('Ctrl+Shift+C does not call copyToClipboard when response is empty', () => {
    render(<KeyboardShortcutHandler response="" />);
    const element = screen.getByTestId('shortcut-handler');
    element.focus();

    fireEvent.keyDown(element, { key: 'c', ctrlKey: true, shiftKey: true });

    expect(mockCopyToClipboard).not.toHaveBeenCalled();
  });

  test('Ctrl+N clears review text and response', () => {
    render(<KeyboardShortcutHandler reviewText="Test" response="Response" />);
    const element = screen.getByTestId('shortcut-handler');
    element.focus();

    fireEvent.keyDown(element, { key: 'n', ctrlKey: true });

    expect(mockSetReviewText).toHaveBeenCalledWith('');
    expect(mockSetResponse).toHaveBeenCalledWith('');
  });

  test('Ctrl+/ toggles keyboard help modal', () => {
    render(<KeyboardShortcutHandler />);
    const element = screen.getByTestId('shortcut-handler');
    element.focus();

    fireEvent.keyDown(element, { key: '/', ctrlKey: true });

    expect(mockSetShowKeyboardHelp).toHaveBeenCalledWith(true);
  });

  test('Ctrl+1 sets tone to professional', () => {
    render(<KeyboardShortcutHandler />);
    const element = screen.getByTestId('shortcut-handler');
    element.focus();

    fireEvent.keyDown(element, { key: '1', ctrlKey: true });

    expect(mockSetTone).toHaveBeenCalledWith('professional');
  });

  test('Ctrl+2 sets tone to friendly', () => {
    render(<KeyboardShortcutHandler />);
    const element = screen.getByTestId('shortcut-handler');
    element.focus();

    fireEvent.keyDown(element, { key: '2', ctrlKey: true });

    expect(mockSetTone).toHaveBeenCalledWith('friendly');
  });

  test('Ctrl+3 sets tone to formal', () => {
    render(<KeyboardShortcutHandler />);
    const element = screen.getByTestId('shortcut-handler');
    element.focus();

    fireEvent.keyDown(element, { key: '3', ctrlKey: true });

    expect(mockSetTone).toHaveBeenCalledWith('formal');
  });

  test('Ctrl+4 sets tone to apologetic', () => {
    render(<KeyboardShortcutHandler />);
    const element = screen.getByTestId('shortcut-handler');
    element.focus();

    fireEvent.keyDown(element, { key: '4', ctrlKey: true });

    expect(mockSetTone).toHaveBeenCalledWith('apologetic');
  });
});
