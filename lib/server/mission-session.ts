import { createHmac, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";

const sessionCookieName = "mission-control-session";
const sessionDurationSeconds = 60 * 60 * 24 * 30;
export const missionOwnerId = "daniel";

function getSessionSecret() {
  return process.env.MISSION_CONTROL_SESSION_SECRET ?? "";
}

function signSession(expiresAt: number) {
  return createHmac("sha256", getSessionSecret())
    .update(`${missionOwnerId}:${expiresAt}`)
    .digest("base64url");
}

function constantTimeEqual(first: string, second: string) {
  const firstBytes = Buffer.from(first);
  const secondBytes = Buffer.from(second);

  return (
    firstBytes.length === secondBytes.length &&
    timingSafeEqual(firstBytes, secondBytes)
  );
}

export function isMissionSessionConfigured() {
  return Boolean(
    process.env.MISSION_CONTROL_ACCESS_KEY &&
    process.env.MISSION_CONTROL_SESSION_SECRET,
  );
}

export function verifyMissionAccessKey(accessKey: string) {
  const expected = process.env.MISSION_CONTROL_ACCESS_KEY;
  return expected !== undefined && constantTimeEqual(accessKey, expected);
}

export async function createMissionSession() {
  const expiresAt = Math.floor(Date.now() / 1000) + sessionDurationSeconds;
  const value = `v1.${expiresAt}.${signSession(expiresAt)}`;
  const cookieStore = await cookies();

  cookieStore.set(sessionCookieName, value, {
    httpOnly: true,
    maxAge: sessionDurationSeconds,
    path: "/",
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function clearMissionSession() {
  const cookieStore = await cookies();
  cookieStore.delete(sessionCookieName);
}

export async function hasValidMissionSession() {
  if (!isMissionSessionConfigured()) {
    return false;
  }

  const cookieStore = await cookies();
  const value = cookieStore.get(sessionCookieName)?.value;

  if (value === undefined) {
    return false;
  }

  const [version, rawExpiresAt, signature] = value.split(".");
  const expiresAt = Number(rawExpiresAt);

  return (
    version === "v1" &&
    Number.isSafeInteger(expiresAt) &&
    expiresAt > Math.floor(Date.now() / 1000) &&
    typeof signature === "string" &&
    constantTimeEqual(signature, signSession(expiresAt))
  );
}

export function isSameOriginRequest(request: Request) {
  const origin = request.headers.get("origin");
  return origin === null || origin === new URL(request.url).origin;
}
