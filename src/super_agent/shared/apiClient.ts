import 'dotenv/config';

const BASE_URL       = process.env.API_BASE_URL      ?? 'http://localhost:3000/api/v1';
const ADMIN_EMAIL    = process.env.API_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.API_ADMIN_PASSWORD;

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  throw new Error('Las variables de entorno API_ADMIN_EMAIL y API_ADMIN_PASSWORD son obligatorias.');
}

let accessToken:  string | null = null;
let refreshToken: string | null = null;
let refreshing:   Promise<void> | null = null;

async function login(): Promise<void> {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  if (!res.ok) throw new Error(`Login fallido: ${res.status}`);
  const body    = await res.json() as { data: { accessToken: string; refreshToken: string } };
  accessToken   = body.data.accessToken;
  refreshToken  = body.data.refreshToken;
}

async function doRefresh(): Promise<void> {
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
  const body   = await res.json() as { data: { accessToken: string; refreshToken: string } };
  accessToken  = body.data.accessToken;
  refreshToken = body.data.refreshToken;
}

function refresh(): Promise<void> {
  if (!refreshing) {
    refreshing = doRefresh().finally(() => { refreshing = null; });
  }
  return refreshing;
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
