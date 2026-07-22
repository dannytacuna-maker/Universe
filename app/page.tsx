import { UniverseViewport } from "@/components/universe/universe-viewport";
import { NavigationStoreProvider } from "@/store/navigation-store-provider";

export default function HomePage() {
  return (
    <NavigationStoreProvider>
      <UniverseViewport />
    </NavigationStoreProvider>
  );
}
