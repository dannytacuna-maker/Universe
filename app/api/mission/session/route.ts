import { isMissionDatabaseConfigured } from "@/lib/server/mission-record-database";
import {
  getMissionAuthorization,
  isMissionAuthConfigured,
} from "@/lib/server/mission-auth";

export const runtime = "nodejs";

export async function GET() {
  const configured = isMissionAuthConfigured() && isMissionDatabaseConfigured();
  const authorization = configured
    ? await getMissionAuthorization()
    : { authenticated: false, owner: null };

  return Response.json({
    authenticated: authorization.authenticated,
    authorized: authorization.owner !== null,
    configured,
    ownerEmail: authorization.owner?.email ?? null,
  });
}
