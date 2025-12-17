import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Wallet, TrendingDown, CreditCard, PiggyBank, Plus, RefreshCw, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
// QUAN TRỌNG: Import axiosClient thay vì axios thường để tự động gửi Token
import axiosClient from "@/lib/axios-client"; 

// --- Component phụ: Skeleton Loading (Giữ nguyên như cũ) ---
const StatCardSkeleton = () => (
  <Card className="border-2">
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
      <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
    </CardHeader>
    <CardContent>
      <div className="h-8 w-24 bg-gray-200 rounded animate-pulse mb-2" />
      <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
    </CardContent>
  </Card>
);

// --- Component phụ: Thẻ thống kê (Giữ nguyên UI đẹp) ---
interface StatCardProps {
  title: string;
  value: number;
  description: string;
  icon: React.ReactNode;
  valueColor?: string;
}

const StatCard = ({ title, value, description, icon, valueColor = "text-primary" }: StatCardProps) => (
  <Card className="border-2 hover:shadow-elegant transition-all duration-200 hover:-translate-y-1">
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">
        {title}
      </CardTitle>
      <div className="p-2 bg-accent/20 rounded-full">
        {icon}
      </div>
    </CardHeader>
    <CardContent>
      <div className={`text-2xl font-bold ${valueColor}`}>
        {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value)}
      </div>
      <p className="text-xs text-muted-foreground mt-1">{description}</p>
    </CardContent>
  </Card>
);

// --- Component chính: Dashboard ---
const Dashboard = () => {
  // State quản lý dữ liệu
  const [stats, setStats] = useState({
    totalExpenses: 0,
    monthlyExpenses: 0,
    totalBudget: 0,
    budgetUsed: 0,
  });

  // State quản lý trạng thái UI
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Lấy User ID an toàn từ LocalStorage
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  const userId = user?.id;

  // Hàm làm mới dữ liệu
  const refreshData = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  useEffect(() => {
    // Nếu chưa đăng nhập, axiosClient sẽ tự redirect, ở đây chỉ cần return để không lỗi
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const currentMonth = new Date().toISOString().slice(0, 7); // Format: yyyy-MM

        // GỌI API SONG SONG (Parallel) để tối ưu tốc độ
        // axiosClient tự động thêm Header "Authorization: Bearer ..."
        const [expensesRes, budgetsRes] = await Promise.all([
          axiosClient.get(`/expenses`, { params: { userId } }),
          axiosClient.get(`/budgets/month`, { params: { userId, monthYear: currentMonth } })
        ]);

        const expenses = expensesRes.data || [];
        const budgets = budgetsRes.data || [];

        // 1. Tính tổng chi tiêu (Toàn bộ thời gian)
        const totalExpenses = expenses.reduce((sum: number, item: any) => sum + (item.totalAmount || 0), 0);

        // 2. Tính chi tiêu tháng này
        const monthlyExpenses = expenses
          .filter((item: any) => item.expenseDate && item.expenseDate.startsWith(currentMonth))
          .reduce((sum: number, item: any) => sum + (item.totalAmount || 0), 0);

        // 3. Tính tổng ngân sách tháng này
        const totalBudget = budgets.reduce((sum: number, item: any) => sum + (item.limitAmount || 0), 0);

        // 4. Tính ngân sách đã dùng (Dựa trên dữ liệu backend trả về trong budget)
        const budgetUsed = budgets.reduce((sum: number, item: any) => sum + (item.spentAmount || 0), 0);

        setStats({ totalExpenses, monthlyExpenses, totalBudget, budgetUsed });

      } catch (err: any) {
        console.error("Dashboard Error:", err);
        // Xử lý thông báo lỗi thân thiện
        if (err.response?.status === 403) {
           setError("Phiên đăng nhập hết hạn. Vui lòng tải lại trang.");
        } else if (err.code === "ERR_NETWORK") {
           setError("Không thể kết nối đến server. Vui lòng kiểm tra mạng.");
        } else {
           setError("Có lỗi xảy ra khi tải dữ liệu.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId, refreshTrigger]);

  // --- Trường hợp 1: Đang tải (Hiển thị Skeleton) ---
  if (loading) {
    return (
      <Layout>
        <div className="max-w-6xl mx-auto p-6">
          <div className="mb-8 flex justify-between items-center">
            <div>
              <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-4 w-80 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {[...Array(4)].map((_, i) => <StatCardSkeleton key={i} />)}
          </div>
           <div className="grid md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
               <Card key={i} className="border-2 h-40 bg-gray-50 animate-pulse" />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  // --- Trường hợp 2: Có lỗi ---
  if (error) {
    return (
      <Layout>
        <div className="max-w-6xl mx-auto p-6 h-[80vh] flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="bg-red-100 p-4 rounded-full w-fit mx-auto">
                <AlertCircle className="h-12 w-12 text-red-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Đã xảy ra lỗi</h3>
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={refreshData} className="gradient-primary text-white shadow-lg">
              <RefreshCw className="mr-2 h-4 w-4" /> Thử lại
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  // --- Tính toán hiển thị ---
  const currentMonthNum = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const remainingBudget = stats.totalBudget - stats.budgetUsed;
  
  // Tính % ngân sách đã dùng
  const budgetUsagePercentage = stats.totalBudget > 0 
    ? Math.round((stats.budgetUsed / stats.totalBudget) * 100) 
    : 0;

  // Xác định màu sắc cho số dư
  let remainingColor = "text-green-600";
  if (remainingBudget < 0) remainingColor = "text-red-600"; // Vượt ngân sách
  else if (budgetUsagePercentage > 80) remainingColor = "text-yellow-600"; // Sắp hết

  return (
    <Layout>
      <div className="max-w-6xl mx-auto p-6 space-y-8 animate-in fade-in duration-500">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
              Tổng quan chi tiêu
            </h1>
            <p className="text-muted-foreground mt-1">
              Số liệu tài chính tháng {currentMonthNum}/{currentYear} của bạn
            </p>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <Button 
              onClick={refreshData} 
              variant="outline" 
              className="flex-1 md:flex-none border-2 hover:bg-accent"
            >
              <RefreshCw className="mr-2 h-4 w-4" /> Làm mới
            </Button>
            <Button asChild className="flex-1 md:flex-none gradient-primary text-white shadow-elegant hover:opacity-90 transition-opacity">
              <Link to="/expenses/add">
                <Plus className="mr-2 h-4 w-4" /> Thêm chi tiêu
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Grid Section */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Tổng chi tiêu"
            value={stats.totalExpenses}
            description="Tích lũy từ trước đến nay"
            icon={<TrendingDown className="h-5 w-5 text-primary" />}
          />

          <StatCard
            title="Chi tiêu tháng này"
            value={stats.monthlyExpenses}
            description={`Tháng ${currentMonthNum}`}
            icon={<CreditCard className="h-5 w-5 text-purple-500" />}
            valueColor="text-purple-600"
          />

          <StatCard
            title="Ngân sách tháng"
            value={stats.totalBudget}
            description={`Đã dùng: ${new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(stats.budgetUsed)}`}
            icon={<PiggyBank className="h-5 w-5 text-blue-500" />}
            valueColor="text-blue-600"
          />

          <StatCard
            title="Ngân sách còn lại"
            value={remainingBudget}
            description={stats.totalBudget > 0 ? `${budgetUsagePercentage}% đã sử dụng` : "Chưa thiết lập ngân sách"}
            icon={<Wallet className="h-5 w-5 text-green-500" />}
            valueColor={remainingColor}
          />
        </div>

        {/* Quick Actions Section */}
        <div>
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Truy cập nhanh</h2>
          <div className="grid md:grid-cols-3 gap-6">
            
            {/* Card 1: Thêm chi tiêu */}
            <Card className="border-2 hover:border-primary/50 transition-all duration-300 group cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 group-hover:text-primary transition-colors">
                   <Plus className="h-5 w-5" /> Thêm giao dịch
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Ghi lại ngay khoản chi tiêu mới để theo dõi dòng tiền chính xác nhất.
                </p>
                <Button asChild className="w-full gradient-primary text-white group-hover:shadow-md transition-all">
                  <Link to="/expenses/add">Thêm mới ngay</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Card 2: Quản lý ngân sách */}
            <Card className="border-2 hover:border-blue-400 transition-all duration-300 group cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 group-hover:text-blue-600 transition-colors">
                   <PiggyBank className="h-5 w-5" /> Quản lý ngân sách
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Đặt giới hạn chi tiêu cho từng danh mục để tránh vung tay quá trán.
                </p>
                <Button asChild className="w-full" variant="outline">
                  <Link to="/budgets">Xem ngân sách</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Card 3: Báo cáo */}
            <Card className="border-2 hover:border-purple-400 transition-all duration-300 group cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 group-hover:text-purple-600 transition-colors">
                   <TrendingDown className="h-5 w-5" /> Báo cáo chi tiết
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Xem biểu đồ trực quan về thói quen chi tiêu của bạn qua các tháng.
                </p>
                <Button asChild className="w-full" variant="outline">
                  <Link to="/reports">Xem biểu đồ</Link>
                </Button>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;