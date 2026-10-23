import React from 'react';
import { act, render, screen } from '@testing-library/react';
import ExpalJobTracker, { visibleOverlayPlacement } from './ExpalJobTracker';
import { useAuth } from '../AuthContext';

jest.mock('../AuthContext', () => ({ useAuth: jest.fn() }));

beforeEach(() => useAuth.mockReturnValue({ user: null }));

test('accepts height messages only from the same-origin tracker iframe', () => {
  render(<ExpalJobTracker />);
  const iframe = screen.getByTitle('EXPal job application tracker');
  const send = (origin, source, height) => act(() => {
    window.dispatchEvent(new MessageEvent('message', {
      origin, source, data: { type: 'expal:tracker-height', height },
    }));
  });
  send('https://unrelated.example', iframe.contentWindow, 1400);
  expect(iframe.getAttribute('height')).toBe('980');
  send(window.location.origin, window, 1400);
  expect(iframe.getAttribute('height')).toBe('980');
  send(window.location.origin, iframe.contentWindow, 1400);
  expect(iframe.getAttribute('height')).toBe('1400');
  send(window.location.origin, iframe.contentWindow, 999999);
  expect(iframe.getAttribute('height')).toBe('1400');
});

test('places tracker dialogs and toasts inside the visible part of a tall iframe', () => {
  expect(visibleOverlayPlacement(100, 4313, 0, 900, 912)).toEqual({ top: 16, maxHeight: 768, toastBottom: 3529 });
  expect(visibleOverlayPlacement(-2000, 4313, 0, 900, 500)).toEqual({ top: 2200, maxHeight: 868, toastBottom: 1429 });
  expect(visibleOverlayPlacement(100, 600, 0, 900, 500)).toEqual({ top: 50, maxHeight: 568, toastBottom: 16 });
  // A 100px sticky site header covers the top of the viewport after scrolling.
  expect(visibleOverlayPlacement(-2000, 4313, 100, 844, 900)).toEqual({ top: 2116, maxHeight: 712, toastBottom: 1485 });
});

test('uses distinct browser-local storage scopes for guest and signed-in accounts', () => {
  const { rerender } = render(<ExpalJobTracker />);
  expect(screen.getByTitle('EXPal job application tracker').getAttribute('src')).toContain('scope=guest');
  useAuth.mockReturnValue({ user: { id: 42 } });
  rerender(<ExpalJobTracker />);
  expect(screen.getByTitle('EXPal job application tracker').getAttribute('src')).toContain('scope=account-42');
  useAuth.mockReturnValue({ user: { id: 43 } });
  rerender(<ExpalJobTracker />);
  expect(screen.getByTitle('EXPal job application tracker').getAttribute('src')).toContain('scope=account-43');
});
