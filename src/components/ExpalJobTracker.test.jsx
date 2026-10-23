import React from 'react';
import { act, render, screen } from '@testing-library/react';
import ExpalJobTracker from './ExpalJobTracker';
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
