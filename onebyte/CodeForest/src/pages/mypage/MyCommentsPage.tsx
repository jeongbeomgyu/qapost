import { MyPageLayout } from '../../layouts/MyPageLayout';
import { MyCommentsSection } from '../../features/mypage/MyCommentsSection';

export function MyCommentsPage() {
  return (
    <MyPageLayout>
      <MyCommentsSection />
    </MyPageLayout>
  );
}
