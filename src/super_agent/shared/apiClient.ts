import 'dotenv/config';

const BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:3000/api/v1';
const REQUEST_TIMEOUT_MS = Number(process.env.API_REQUEST_TIMEOUT_MS ?? 10000);
const MAX_RETRIES = Number(process.env.API_MAX_RETRIES ?? 2);

function getCredentials(): { email: string; password: string } {
  const email    = process.env.API_AGENT_EMAIL    ?? process.env.API_ADMIN_EMAIL;
  const password = process.env.API_AGENT_PASSWORD ?? process.env.API_ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error('Las variables de entorno API_AGENT_EMAIL y API_AGENT_PASSWORD son obligatorias.');
  }
  return { email, password };
}

let accessToken:  string | null = null;
let refreshToken: string | null = null;
let refreshing:   Promise<void> | null = null;
let loggingIn:    Promise<void> | null = null;

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function login(): Promise<void> {
  const { email, password } = getCredentials();
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(`Login fallido: ${res.status}`);
  const body    = await res.json() as { data: { accessToken: string; refreshToken: string } };
  accessToken   = body.data.accessToken;
  refreshToken  = body.data.refreshToken;
}

function ensureLogin(): Promise<void> {
  if (accessToken) return Promise.resolve();
  if (!loggingIn) {
    loggingIn = login().finally(() => { loggingIn = null; });
  }
  return loggingIn;
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

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  await ensureLogin();

  const doRequest = () =>
    fetchWithTimeout(
      `${BASE_URL}${path}`,
      {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          Authorization:  `Bearer ${accessToken}`,
          ...(options.headers ?? {}),
        },
      },
      REQUEST_TIMEOUT_MS,
    );

  let attempt = 0;
  while (true) {
    try {
      let res = await doRequest();
      if (res.status === 401) {
        await refresh();
        res = await doRequest();
      }
      if (res.status >= 500 && attempt < MAX_RETRIES) {
        attempt++;
        await delay(2 ** attempt * 200);
        continue;
      }
      return res;
    } catch (err) {
      if (attempt >= MAX_RETRIES) throw err;
      attempt++;
      await delay(2 ** attempt * 200);
    }
  }
}

export { BASE_URL };
