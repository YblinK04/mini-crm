import { QueryClient } from '@tanstack/react-query';

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'HttpError';
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new HttpError(res.status, text);
  }

  if (res.status === 204 || res.headers.get('content-length') === '0') {
    return {} as T;
  }

  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return res.json();
  }
  
  return (await res.text()) as unknown as T;
}

export async function customFetch<T>({
  url,
  method,
  body,
  headers,
}: {
  url: string;
  method: string;
  body?: any;
  headers?: any;
}): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    credentials: 'include', 
    body: method !== 'GET' && body ? JSON.stringify(body) : undefined
  });

  return handleResponse<T>(res);
}

export const api = {
  get: <T>(url: string, headers?: any) => customFetch<T>({ url, method: 'GET', headers }),
  post: <T>(url: string, body?: any, headers?: any) => customFetch<T>({ url, method: 'POST', body, headers }),
  put: <T>(url: string, body?: any, headers?: any) => customFetch<T>({ url, method: 'PUT', body, headers }),
  delete: <T>(url: string, headers?: any) => customFetch<T>({ url, method: 'DELETE', headers }),
  patch: <T>(url: string, body?: any, headers?: any) => customFetch<T>({ url, method: 'PATCH', body, headers }),
};

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        queryFn: async ({ queryKey }) => {
          const url = queryKey[0];
          if (typeof url !== 'string') {
            throw new Error('Query key must be a string URL when using default queryFn');
          }
          return api.get(url);
        },
        refetchOnWindowFocus: process.env.NODE_ENV === 'production',
        retry: (failureCount, error: unknown) => { 
          if (error instanceof HttpError) {
            if ([401, 403, 404].includes(error.status)) {
              return false; 
            }
          }
          return failureCount < 3;
        },
      },
      mutations: {
        retry: false
      }
    }
  });
}
