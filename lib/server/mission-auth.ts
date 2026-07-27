import { auth, currentUser } from "@clerk/nextjs/server";

export const legacyMissionOwnerId = "daniel";

export type MissionOwner = Readonly<{
  email: string;
  id: string;
  userId: string;
}>;

export type MissionAuthorization = Readonly<{
  authenticated: boolean;
  owner: MissionOwner | null;
}>;

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function getAllowedOwnerEmail() {
  const email = process.env.MISSION_CONTROL_OWNER_EMAIL;
  return email === undefined ? null : normalizeEmail(email);
}

export function isMissionAuthConfigured() {
  return Boolean(
    process.env.CLERK_SECRET_KEY &&
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
    getAllowedOwnerEmail(),
  );
}

export async function getMissionAuthorization(): Promise<MissionAuthorization> {
  if (!isMissionAuthConfigured()) {
    return { authenticated: false, owner: null };
  }

  const { userId } = await auth();

  if (userId === null) {
    return { authenticated: false, owner: null };
  }

  const user = await currentUser();
  const allowedEmail = getAllowedOwnerEmail();
  const matchedEmail = user?.emailAddresses.find(
    ({ emailAddress }) => normalizeEmail(emailAddress) === allowedEmail,
  )?.emailAddress;

  if (matchedEmail === undefined || allowedEmail === null) {
    return { authenticated: true, owner: null };
  }

  return {
    authenticated: true,
    owner: {
      email: allowedEmail,
      id: `google:${allowedEmail}`,
      userId,
    },
  };
}

export function isSameOriginRequest(request: Request) {
  const origin = request.headers.get("origin");
  return origin === null || origin === new URL(request.url).origin;
}
