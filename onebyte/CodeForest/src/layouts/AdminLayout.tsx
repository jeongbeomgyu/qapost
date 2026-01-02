import { Link, useLocation } from 'react-router-dom';
import { Header } from '../components/Header';
import { Folder, Users } from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();

  const menuItems = [
    { path: '/admin/categories', label: '카테고리 관리', icon: Folder },
    { path: '/admin/users', label: '회원 관리', icon: Users },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-border">
          <nav className="p-6">
            <div className="mb-6 text-muted-foreground">관리자 메뉴</div>
            <div className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded transition-colors ${
                      isActive
                        ? 'bg-secondary text-primary'
                        : 'text-foreground hover:bg-secondary/50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 bg-background p-8">{children}</main>
      </div>
    </div>
  );
}
