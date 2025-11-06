import { ReactNode, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Wallet,
  LayoutDashboard,
  Receipt,
  PiggyBank,
  FileText,
  BarChart3,
  Sparkles,
  User,
  LogOut,
} from "lucide-react";
import { storage } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const user = storage.user.get();

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      const url = user.avatarUrl
        ? user.avatarUrl
        : null;
      const img = new Image();
      img.src = url;
      img.onload = () => setAvatarUrl(url);
      img.onerror = () => setAvatarUrl(null);
    } else {
      setAvatarUrl(null);
    }
  }, [user]);

  const handleLogout = () => {
    storage.user.remove();
    toast({
      title: "Đã đăng xuất",
      description: "Hẹn gặp lại bạn!",
    });
    navigate("/login");
  };

  const navItems = [
    { path: "/dashboard", label: "Tổng quan", icon: LayoutDashboard },
    { path: "/expenses", label: "Chi tiêu", icon: Receipt },
    { path: "/budgets", label: "Ngân sách", icon: PiggyBank },
    { path: "/invoices", label: "Hóa đơn", icon: FileText },
    { path: "/reports", label: "Báo cáo", icon: BarChart3 },
    { path: "/ai-suggestions", label: "AI Gợi ý", icon: Sparkles },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          {/* Logo */}
          <Link
            to="/dashboard"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center">
              <Wallet className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold hidden sm:inline">
              Pocket Money
            </span>
          </Link>

          {/* Navigation */}
          <nav className="hidden lg:flex gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                location.pathname === item.path ||
                location.pathname.startsWith(item.path + "/");
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-elegant"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="flex items-center gap-3">
            <Link
              to="/profile"
              className="flex items-center gap-3 hover:opacity-80 transition-all"
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={user?.fullName || "Avatar"}
                  className="h-10 w-10 rounded-full border border-gray-300 object-cover shadow-sm"
                />
              ) : (
                <div className="h-10 w-10 flex items-center justify-center rounded-full bg-gray-200">
                  <User className="h-5 w-5 text-gray-600" />
                </div>
              )}
              
            </Link>

            <Button
              variant="ghost"
              onClick={handleLogout}
              className="hidden sm:flex"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Đăng xuất
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="sm:hidden"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t z-50 shadow-lg">
        <div className="grid grid-cols-4 gap-1 p-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              location.pathname === item.path ||
              location.pathname.startsWith(item.path + "/");
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Main */}
      <main className="container mx-auto px-4 py-6 pb-24 lg:pb-6">
        {children}
      </main>
    </div>
  );
};

export default Layout;
