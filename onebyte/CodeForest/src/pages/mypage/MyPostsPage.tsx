import { MyPageLayout } from '../../layouts/MyPageLayout';
import { MyPostsSection } from '../../features/mypage/MyPostsSection';

export function MyPostsPage() {
  return (
    <MyPageLayout>
      <MyPostsSection />
    </MyPageLayout>
  );
}
