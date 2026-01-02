import { Header } from '../components/Header';
import { PostDetail } from '../components/PostDetail';

export function PostDetailPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <PostDetail />
    </div>
  );
}
