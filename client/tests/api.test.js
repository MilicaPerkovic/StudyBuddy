import { afterEach, describe, expect, it, vi } from 'vitest';
import { api, ApiError, errorMessage, tokenStore } from '../src/utils/api.js';

const mockFetch = (status, body) =>
  vi.spyOn(globalThis, 'fetch').mockResolvedValue({
    status,
    ok: status >= 200 && status < 300,
    json: () => Promise.resolve(body),
  });

afterEach(() => vi.restoreAllMocks());

describe('api', () => {
  it('sends the bearer token and JSON body', async () => {
    tokenStore.set('abc');
    const fetchSpy = mockFetch(200, { ok: true });
    await api('/courses', { method: 'POST', body: { name: 'X' } });
    const [url, opts] = fetchSpy.mock.calls[0];
    expect(url).toBe('/api/courses');
    expect(opts.headers.Authorization).toBe('Bearer abc');
    expect(opts.body).toBe('{"name":"X"}');
  });

  it('returns null for 204', async () => {
    mockFetch(204);
    expect(await api('/courses/1', { method: 'DELETE' })).toBeNull();
  });

  it('throws ApiError with details on failure', async () => {
    mockFetch(400, {
      error: 'Validation failed',
      details: [{ field: 'name', message: 'Required' }],
    });
    const err = await api('/courses').catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(400);
    expect(errorMessage(err)).toBe('Validation failed: name – Required');
  });

  it('clears the token and emits logout on 401', async () => {
    tokenStore.set('expired');
    const listener = vi.fn();
    window.addEventListener('studybuddy:logout', listener);
    mockFetch(401, { error: 'Invalid or expired token' });
    await expect(api('/courses')).rejects.toThrow('Invalid or expired token');
    expect(tokenStore.get()).toBeNull();
    expect(listener).toHaveBeenCalledOnce();
    window.removeEventListener('studybuddy:logout', listener);
  });
});
