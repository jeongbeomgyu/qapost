import { AdminLayout } from '../../layouts/AdminLayout';
import { UserManagementSection } from '../../features/admin/UserManagementSection';

export function AdminUsersPage() {
  return (
    <AdminLayout>
      <UserManagementSection />
    </AdminLayout>
  );
}
