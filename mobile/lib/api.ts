import AsyncStorage from '@react-native-async-storage/async-storage';

// Centralized API configuration. Users can dynamically update the IP address on screen during debugging!
let API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.100:3000'; // Environment variable or fallback LAN IP

export interface UserSession {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
}

export function getApiBaseUrl(): string {
  return API_BASE_URL;
}

export async function setApiBaseUrl(url: string): Promise<void> {
  API_BASE_URL = url.trim().replace(/\/$/, ''); // Remove trailing slashes
  await AsyncStorage.setItem('cookbro_api_base_url', API_BASE_URL);
}

// Initialize API Base URL from local storage on load
AsyncStorage.getItem('cookbro_api_base_url').then(savedUrl => {
  if (savedUrl) {
    API_BASE_URL = savedUrl;
  }
});

/** Save user session information to local AsyncStorage */
export async function saveSession(user: UserSession): Promise<void> {
  await AsyncStorage.setItem('cookbro_session', JSON.stringify(user));
}

/** Load user session information from local AsyncStorage */
export async function loadSession(): Promise<UserSession | null> {
  const sessionStr = await AsyncStorage.getItem('cookbro_session');
  if (!sessionStr) return null;
  try {
    return JSON.parse(sessionStr) as UserSession;
  } catch {
    return null;
  }
}

/** Clear active user session (Logout) */
export async function clearSession(): Promise<void> {
  await AsyncStorage.removeItem('cookbro_session');
}

/** Base API fetch client that injects authorization headers dynamically */
export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const session = await loadSession();
  
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  
  // Inject x-user-uid for server authorization
  if (session?.uid) {
    headers.set('x-user-uid', session.uid);
  }

  const url = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  
  return fetch(url, {
    ...options,
    headers,
  });
}
