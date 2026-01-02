import { AdminLayout } from '../../layouts/AdminLayout';
import { CategoryManagementSection } from '../../features/admin/CategoryManagementSection';

export function AdminCategoriesPage() {
  return (
    <AdminLayout>
      <CategoryManagementSection />
    </AdminLayout>
  );
}
