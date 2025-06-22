import { cookies } from "next/headers"

/**
 * Returns a stable anonymous session ID stored in the `sb_session_id` cookie.
 * Falls back to `crypto.randomUUID()` so we need no extra dependency.
 */
export async function getSessionId(): Promise<string> {
  const cookieStore = await cookies();
  const existing = cookieStore.get("sb_session_id")?.value;
  if (existing) return existing;

  const id = crypto.randomUUID();
  // 7-day lifespan, httpOnly so client JS cannot read it.
  cookieStore.set("sb_session_id", id, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
  });
  return id;
}
