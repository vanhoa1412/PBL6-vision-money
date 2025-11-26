import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Wallet, TrendingDown, CreditCard, PiggyBank, Plus, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import axios from "axios";

// Skeleton component for loading state
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

// Stat Card component
interface StatCardProps {
  title: string;
  value: number;
  description: string;
  icon: React.ReactNode;
  valueColor?: string;
}

const StatCard = ({ title, value, description, icon, valueColor = "text-primary" }: StatCardProps) => (
  <Card className="border-2 hover:shadow-elegant transition-all">
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">
        {title}
      </CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className={`text-2xl font-bold ${valueColor}`}>
        {formatCurrency(value)}
      </div>
      <p className="text-xs text-muted-foreground mt-1">{description}</p>
    </CardContent>
  </Card>
);

// Format currency utility
const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

const Dashboard = () => {
  const userId = Number(localStorage.getItem("userId"));
  const [stats, setStats] = useState({
    totalExpenses: 0,
    monthlyExpenses: 0,
    totalBudget: 0,
    budgetUsed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const refreshData = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  useEffect(() => {
    if (!userId) {
      setError("Không tìm thấy ID người dùng");
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const currentMonth = new Date().toISOString().slice(0, 7);

        const [expensesRes, budgetsRes] = await Promise.all([
          axios.get(`http://localhost:8080/api/expenses?userId=${userId}`),
          axios.get(`http://localhost:8080/api/budgets?userId=${userId}`)
        ]);

        const expenses = expensesRes.data;
        const budgets = budgetsRes.data;

        const totalExpenses = expenses.reduce((s: number, e: any) => s + e.totalAmount, 0);

        const monthlyExpenses = expenses
          .filter((e: any) => e.expenseDate.startsWith(currentMonth))
          .reduce((s: number, e: any) => s + e.totalAmount, 0);

        const totalBudget = budgets
          .filter((b: any) => b.monthYear === currentMonth)
          .reduce((s: number, b: any) => s + b.limitAmount, 0);

        const budgetUsed = budgets
          .filter((b: any) => b.monthYear === currentMonth)
          .reduce((s: number, b: any) => s + b.spentAmount, 0);

        setStats({ totalExpenses, monthlyExpenses, totalBudget, budgetUsed });
      } catch (err) {
        console.error("Dashboard API error:", err);
        setError("Không thể tải dữ liệu dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId, refreshTrigger]);

  // Loading state
  if (loading) {
    return (
      <Layout>
        <div className="max-w-6xl mx-auto p-6">
          {/* Header skeleton */}
          <div className="mb-8 flex justify-between items-center">
            <div>
              <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-4 w-80 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
          </div>

          {/* Stats grid skeleton */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {[...Array(4)].map((_, i) => (
              <StatCardSkeleton key={i} />
            ))}
          </div>

          {/* Quick actions skeleton */}
          <div className="grid md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="border-2">
                <CardHeader>
                  <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
                </CardHeader>
                <CardContent>
                  <div className="h-4 w-48 bg-gray-200 rounded animate-pulse mb-4" />
                  <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  // Error state
  if (error) {
    return (
      <Layout>
        <div className="max-w-6xl mx-auto p-6">
          <div className="text-center py-12">
            <div className="text-red-500 text-lg mb-4">{error}</div>
            <Button onClick={refreshData} className="gradient-primary text-white">
              <RefreshCw className="mr-2 h-4 w-4" />
              Thử lại
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const remainingBudget = stats.totalBudget - stats.budgetUsed;
  const budgetUsagePercentage = stats.totalBudget > 0 
    ? Math.round((stats.budgetUsed / stats.totalBudget) * 100)
    : 0;

  return (
    <Layout>
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">Tổng quan chi tiêu</h1>
            <p className="text-muted-foreground">
              Xem tổng quan về tài chính của bạn trong tháng này
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={refreshData} 
              variant="outline" 
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Làm mới
            </Button>
            <Button asChild className="gradient-primary text-white shadow-elegant">
              <Link to="/expenses/add">
                <Plus className="mr-2 h-4 w-4" /> Thêm chi tiêu
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <StatCard
            title="Tổng chi tiêu"
            value={stats.totalExpenses}
            description="Tất cả các khoản chi"
            icon={<TrendingDown className="h-4 w-4 text-primary" />}
            valueColor="text-primary"
          />

          <StatCard
            title="Chi tiêu tháng này"
            value={stats.monthlyExpenses}
            description={`Tháng ${currentMonth}/${currentYear}`}
            icon={<CreditCard className="h-4 w-4 text-secondary" />}
            valueColor="text-secondary"
          />

          <StatCard
            title="Ngân sách tháng"
            value={stats.totalBudget}
            description={`Đã dùng: ${formatCurrency(stats.budgetUsed)}`}
            icon={<PiggyBank className="h-4 w-4 text-primary" />}
            valueColor="text-primary"
          />

          <StatCard
            title="Còn lại"
            value={remainingBudget}
            description={
              stats.totalBudget > 0
                ? `${budgetUsagePercentage}% đã dùng`
                : "Chưa đặt ngân sách"
            }
            icon={<Wallet className="h-4 w-4 text-secondary" />}
            valueColor={remainingBudget < 0 ? "text-red-500" : "text-secondary"}
          />
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="border-2 hover:shadow-elegant transition-all">
            <CardHeader>
              <CardTitle>Thêm chi tiêu</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Ghi lại khoản chi tiêu mới của bạn
              </p>
              <Button asChild className="w-full gradient-primary text-white">
                <Link to="/expenses/add">
                  <Plus className="mr-2 h-4 w-4" />
                  Thêm chi tiêu
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-2 hover:shadow-elegant transition-all">
            <CardHeader>
              <CardTitle>Quản lý ngân sách</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Đặt giới hạn chi tiêu cho từng danh mục
              </p>
              <Button asChild className="w-full" variant="outline">
                <Link to="/budgets">Xem ngân sách</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-2 hover:shadow-elegant transition-all">
            <CardHeader>
              <CardTitle>Hóa đơn</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Quản lý và lưu trữ hóa đơn của bạn
              </p>
              <Button asChild className="w-full" variant="outline">
                <Link to="/invoices">Xem hóa đơn</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;