import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = { ...process.env };

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

describe("apiClient", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env = {
      ...ORIGINAL_ENV,
      API_BASE_URL: "http://api.test",
      API_AGENT_EMAIL: "agent@test.com",
      API_AGENT_PASSWORD: "secret",
      API_MAX_RETRIES: "1",
    };
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    process.env = { ...ORIGINAL_ENV };
  });

  it("hace login perezoso en el primer apiFetch, no al importar el módulo", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const apiClientModule = await import("./apiClient.js");
    expect(fetchMock).not.toHaveBeenCalled();

    fetchMock
      .mockResolvedValueOnce(jsonResponse({ data: { accessToken: "tok1", refreshToken: "ref1" } }))
      .mockResolvedValueOnce(jsonResponse({ ok: true }));

    const res = await apiClientModule.apiFetch("/orders");

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][0]).toBe("http://api.test/auth/login");
    expect(res.status).toBe(200);
  });

  it("reintenta una vez tras un 401 usando refresh", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ data: { accessToken: "tok1", refreshToken: "ref1" } }))
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(jsonResponse({ data: { accessToken: "tok2", refreshToken: "ref2" } }))
      .mockResolvedValueOnce(jsonResponse({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    const { apiFetch } = await import("./apiClient.js");
    const res = await apiFetch("/orders");

    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(res.status).toBe(200);
  });

  it("reintenta con backoff ante un 5xx y termina devolviendo la respuesta exitosa", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ data: { accessToken: "tok1", refreshToken: "ref1" } }))
      .mockResolvedValueOnce(new Response(null, { status: 500 }))
      .mockResolvedValueOnce(jsonResponse({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    const { apiFetch } = await import("./apiClient.js");
    const res = await apiFetch("/orders");

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(res.status).toBe(200);
  });

  it("propaga el error de red tras agotar los reintentos", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ data: { accessToken: "tok1", refreshToken: "ref1" } }))
      .mockRejectedValue(new Error("network down"));
    vi.stubGlobal("fetch", fetchMock);

    const { apiFetch } = await import("./apiClient.js");
    await expect(apiFetch("/orders")).rejects.toThrow("network down");
  });

  it("no lanza al importar el módulo aunque falten credenciales; falla recién al intentar login", async () => {
    process.env.API_AGENT_EMAIL = "";
    process.env.API_AGENT_PASSWORD = "";
    vi.stubGlobal("fetch", vi.fn());

    const apiClientModule = await import("./apiClient.js");
    await expect(apiClientModule.apiFetch("/orders")).rejects.toThrow(/API_AGENT_EMAIL/);
  });
});
