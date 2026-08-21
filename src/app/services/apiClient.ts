export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * A basic API client wrapper around fetch.
 * Automatically adds Authorization headers if a token exists in localStorage.
 */
export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('auth_token');
  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  // NOTE: This currently simulates an API call since there's no real backend yet.
  // In a real implementation, you would use:
  // const response = await fetch(`/api${endpoint}`, { ...options, headers });
  
  // SIMULATED BACKEND DELAY
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Throw for simulated failures
  if (endpoint.includes('error')) {
    throw new ApiError(500, 'Simulated API Error');
  }

  // Simulate returning some generic JSON
  return {} as T;
}
