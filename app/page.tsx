import { MissionAuthGate } from "@/components/auth/mission-auth-gate";
import { DashboardApp } from "@/components/dashboard/dashboard-app";
import { getMissionAuthorization } from "@/lib/server/mission-auth";
import { DashboardNavigationStoreProvider } from "@/store/dashboard-navigation-store-provider";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const authorization = await getMissionAuthorization();

  if (!authorization.authenticated) {
    return <MissionAuthGate state="signed-out" />;
  }

  if (authorization.owner === null) {
    return <MissionAuthGate state="forbidden" />;
  }

  return (
    <DashboardNavigationStoreProvider>
      <DashboardApp ownerEmail={authorization.owner.email} />
    </DashboardNavigationStoreProvider>
  );
}
