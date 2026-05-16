import { env } from '../config/env';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export class ApiError extends Error {
  status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export function getStoredToken() {
  return localStorage.getItem('tapklass_session_token');
}

export function setStoredToken(token: string) {
  localStorage.setItem('tapklass_session_token', token);
}

export function clearStoredToken() {
  localStorage.removeItem('tapklass_session_token');
}

const DEFAULT_TIMEOUT_MS = 6000;

async function request<T>(method: HttpMethod, path: string, body?: unknown): Promise<T> {
  if (!env.apiUrl) {
    throw new ApiError('Cloud API URL is not configured. Set VITE_API_URL.', 503);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(`${env.apiUrl}${path}`, {
      method,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(getStoredToken() ? { Authorization: `Bearer ${getStoredToken()}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new ApiError(payload.message || 'Request failed', response.status);
    }

    return payload as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if ((error as Error).name === 'AbortError') {
      throw new ApiError('Cloud request timed out. Working in offline mode.', 408);
    }
    throw new ApiError('Network error contacting cloud backend.', 0);
  } finally {
    clearTimeout(timeout);
  }
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
};
