const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

interface ApiFetchOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
}

const getToken = () => {
  if (typeof window === 'undefined') {
    return null;
  }
  return localStorage.getItem('forreal.token');
};

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const headers = new Headers(options.headers ?? {});
  headers.set('Content-Type', 'application/json');

  const token = getToken();
  if (token) {
    headers.set('Authorization', 'Bearer ' + token);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    cache: 'no-store',
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      data?.error ||
      (Array.isArray(data?.errors) ? data.errors.map((item: { msg: string }) => item.msg).join(', ') : null) ||
      'Request failed';
    throw new Error(message);
  }

  return data as T;
}
