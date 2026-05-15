import 'dotenv/config';

const BASE_URL       = process.env.API_BASE_URL      ?? 'http://localhost:3000/api/v1';
const ADMIN_EMAIL    = process.env.API_ADMIN_EMAIL!;
const ADMIN_PASSWORD = process.env.API_ADMIN_PASSWORD!;

let accessToken:  string | null = null;
let refreshToken: string | null = null;

async function login(): Promise<void> {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  if (!res.ok) throw new Error(`Login fallido: ${res.status}`);
  const body    = await res.json();
  accessToken   = body.data.accessToken;
  refreshToken  = body.data.refreshToken;
}

async function refresh(): Promise<void> {
  const res = await fetch(`${BASE_URL}/auth/refresh`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ refreshToken }),
  });
  if (!res.ok) {
    accessToken  = null;
    refreshToken = null;
    await login();
    return;
  }
  const body   = await res.json();
  accessToken  = body.data.accessToken;
  refreshToken = body.data.refreshToken;
}

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  if (!accessToken) await login();

  const doRequest = () =>
    fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization:  `Bearer ${accessToken}`,
        ...(options.headers ?? {}),
      },
    });

  let res = await doRequest();
  if (res.status === 401) {
    await refresh();
    res = await doRequest();
  }
  return res;
}

export { BASE_URL };
