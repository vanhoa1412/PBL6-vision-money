import { ReactNode, useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Wallet,
  LayoutDashboard,
  Receipt,
  PiggyBank,
  FileText,
  BarChart3,
  Bell,
  User as UserIcon,
  LogOut,
  Settings, // Thêm icon Settings
  ChevronDown
} from "lucide-react";
import { storage } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import axiosClient from "@/lib/axios-client"; 

// [MỚI] Import Dropdown Menu (Đảm bảo bạn đã có component này trong dự án)
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const user = storage.user.get();

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      const url = user.avatarUrl ? user.avatarUrl : null;
      const img = new Image();
      img.src = url;
      img.onload = () => setAvatarUrl(url);
      img.onerror = () => setAvatarUrl(null);

      fetchUnreadCount();
      
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    } else {
      setAvatarUrl(null);
      setUnreadCount(0);
    }
  }, [user]);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const userId = Number(localStorage.getItem("userId")) || user?.id;
      if (userId) {
        const response = await axiosClient.get("/notifications/unread-count", {
            params: { userId: userId }
        });
        setUnreadCount(response.data); 
      }
    } catch (error) {
      console.error("Error fetching unread count:", error);
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
    { 
      path: "/notifications", 
      label: "Thông báo", 
      icon: Bell,
      badge: unreadCount > 0 ? unreadCount : undefined
    },
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

          {/* Navigation (Desktop) */}
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
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all relative ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-elegant"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                  {item.badge && item.badge > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs animate-pulse"
                    >
                      {item.badge > 99 ? '99+' : item.badge}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Dropdown Menu */}
          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 overflow-hidden border border-gray-200 hover:opacity-80 transition-opacity focus-visible:ring-0">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={user?.fullName || "Avatar"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-gray-100">
                      <UserIcon className="h-5 w-5 text-gray-500" />
                    </div>
                  )}
                </Button>
              </DropdownMenuTrigger>
              
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.fullName}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                <DropdownMenuItem onClick={() => navigate("/profile")}>
                  <UserIcon className="mr-2 h-4 w-4" />
                  <span>Hồ sơ cá nhân</span>
                </DropdownMenuItem>
                
                <DropdownMenuItem onClick={() => navigate("/settings")}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Cài đặt</span>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Đăng xuất</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
                className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all relative ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <div className="relative">
                  <Icon className="h-5 w-5" />
                  {item.badge && item.badge > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-2 -right-2 h-4 w-4 flex items-center justify-center p-0 text-xs"
                    >
                      {item.badge > 9 ? '9+' : item.badge}
                    </Badge>
                  )}
                </div>
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