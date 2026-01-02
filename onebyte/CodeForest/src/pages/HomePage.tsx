import { Header } from '../components/Header';
import { HeroBanner } from '../components/HeroBanner';
import { PostFeed } from '../components/PostFeed';

export function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <HeroBanner />
      <PostFeed />
    </div>
  );
}
