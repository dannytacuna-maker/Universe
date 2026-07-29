import { MissionAuthGate } from "@/components/auth/mission-auth-gate";
import { UniverseViewport } from "@/components/universe/universe-viewport";
import { getMissionAuthorization } from "@/lib/server/mission-auth";
import { NavigationStoreProvider } from "@/store/navigation-store-provider";

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
    <NavigationStoreProvider>
      <UniverseViewport ownerEmail={authorization.owner.email} />
    </NavigationStoreProvider>
  );
}
