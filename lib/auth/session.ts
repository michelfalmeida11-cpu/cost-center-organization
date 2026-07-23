import { Role } from "@/lib/procurement/types";

export const SESSION_COOKIE_NAME = "cyberproc_session";
const SESSION_TTL_SECONDS = 60 * 60 * 12;

type SessionPayload = {
  nome: string;
  email: string;
  role: Role;
  iat: number;
  exp: number;
};

function getSecret() {
  return process.env.AUTH_SESSION_SECRET ?? "cyberproc-dev-secret-change-me";
}

function toBase64Url(bytes: Uint8Array) {
  let raw = "";
  bytes.forEach((b) => {
    raw += String.fromCharCode(b);
  });
  return btoa(raw).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(base64url: string) {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (base64url.length % 4)) % 4);
  const raw = atob(base64);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) {
    bytes[i] = raw.charCodeAt(i);
  }
  return bytes;
}

function toHex(bytes: Uint8Array) {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function fromHex(hex: string) {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    out[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return out;
}

async function hmacSha256(value: string) {
  const keyData = new TextEncoder().encode(getSecret());
  const key = await crypto.subtle.importKey("raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return new Uint8Array(signature);
}

export async function createSessionToken(user: { nome: string; email: string; role: Role }) {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + SESSION_TTL_SECONDS;
  const payload: SessionPayload = {
    nome: user.nome,
    email: user.email,
    role: user.role,
    iat,
    exp,
  };

  const encodedPayload = toBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  const signature = await hmacSha256(encodedPayload);
  return `${encodedPayload}.${toHex(signature)}`;
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  const [payloadPart, signaturePart] = token.split(".");
  if (!payloadPart || !signaturePart) return null;

  const expectedSig = await hmacSha256(payloadPart);
  const receivedSig = fromHex(signaturePart);

  if (expectedSig.length !== receivedSig.length) return null;
  for (let i = 0; i < expectedSig.length; i += 1) {
    if (expectedSig[i] !== receivedSig[i]) return null;
  }

  const payloadRaw = new TextDecoder().decode(fromBase64Url(payloadPart));
  const payload = JSON.parse(payloadRaw) as SessionPayload;
  if (payload.exp < Math.floor(Date.now() / 1000)) return null;
  return payload;
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  };
}
