import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Wallet, TrendingDown, CreditCard, PiggyBank, Plus } from "lucide-react";
import { storage } from "@/lib/storage";
import { useState, useEffect } from "react";

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalExpenses: 0,
    monthlyExpenses: 0,
    totalBudget: 0,
    budgetUsed: 0,
  });

  useEffect(() => {
    const invoices = storage.invoices.getAll();
    const budgets = storage.budgets.getAll();

    const now = new Date();
    const currentMonth = now.toISOString().slice(0, 7);

    const totalExpenses = invoices.reduce((sum, inv) => sum + inv.total_amount, 0);
    const monthlyExpenses = invoices
      .filter(inv => inv.invoice_date.startsWith(currentMonth))
      .reduce((sum, inv) => sum + inv.total_amount, 0);

    const totalBudget = budgets
      .filter(b => b.month_year === currentMonth)
      .reduce((sum, b) => sum + b.limit_amount, 0);

    const budgetUsed = budgets
      .filter(b => b.month_year === currentMonth)
      .reduce((sum, b) => sum + b.spent_amount, 0);

    setStats({ totalExpenses, monthlyExpenses, totalBudget, budgetUsed });
  }, []);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

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
          <Button asChild className="gradient-primary text-white shadow-elegant">
            <Link to="/expenses/add">
              <Plus className="mr-2 h-4 w-4" /> Thêm chi tiêu
            </Link>
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <Card className="border-2 hover:shadow-elegant transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Tổng chi tiêu
              </CardTitle>
              <TrendingDown className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {formatCurrency(stats.totalExpenses)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Tất cả các khoản chi</p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:shadow-elegant transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Chi tiêu tháng này
              </CardTitle>
              <CreditCard className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-secondary">
                {formatCurrency(stats.monthlyExpenses)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Tháng {new Date().getMonth() + 1}/{new Date().getFullYear()}
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:shadow-elegant transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Ngân sách tháng
              </CardTitle>
              <PiggyBank className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {formatCurrency(stats.totalBudget)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Đã dùng: {formatCurrency(stats.budgetUsed)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:shadow-elegant transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Còn lại
              </CardTitle>
              <Wallet className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-secondary">
                {formatCurrency(stats.totalBudget - stats.budgetUsed)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.totalBudget > 0
                  ? `${Math.round((stats.budgetUsed / stats.totalBudget) * 100)}% đã dùng`
                  : "Chưa đặt ngân sách"}
              </p>
            </CardContent>
          </Card>
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
