import { HomeFeed } from "@/components/layout/home-feed";
import { FeedPageLayout } from "@/components/layout/feed-page-layout";

export default function HomePage() {
  return (
    <FeedPageLayout>
      <HomeFeed />
    </FeedPageLayout>
  );
}
