const TOKEN_KEY = "mc_token";

export async function ensureToken(API: string): Promise<string> {
  let token = sessionStorage.getItem(TOKEN_KEY);

  if (!token) {
    const res = await fetch(`${API}/auth/anon`, { method: "POST" });
    if (!res.ok) throw new Error(`anon failed: ${res.status}`);

    const data = await res.json();
    token = data.access_token as string;
    sessionStorage.setItem(TOKEN_KEY, token);
  }

  return token; // 여기선 string으로 확정됨
}