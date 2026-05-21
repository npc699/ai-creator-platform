import { HomeFeed } from "@/components/layout/home-feed";
import { HomeSidebar } from "@/components/layout/home-sidebar";

export default function HomePage() {
  return (
    <div className="flex items-stretch">
      <HomeFeed />
      <HomeSidebar />
    </div>
  );
}
