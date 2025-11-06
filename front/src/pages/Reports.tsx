import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, TrendingDown, Calendar } from "lucide-react";
import { storage } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";

interface CategoryStats {
  name: string;
  amount: number;
  percentage: number;
}

const Reports = () => {
  const [stats, setStats] = useState({
    totalExpenses: 0,
    monthlyExpenses: 0,
    categoryBreakdown: [] as CategoryStats[],
  });

  const { toast } = useToast();

  useEffect(() => {
    calculateStats();
  }, []);

  const calculateStats = () => {
    const invoices = storage.invoices.getAll?.() || [];
    const categories = storage.categories.getAll?.() || [];

    const now = new Date();
    const currentMonth = now.toISOString().slice(0, 7);

    const totalExpenses = invoices.reduce(
      (sum, inv) => sum + (inv.total_amount || 0),
      0
    );
    const monthlyInvoices = invoices.filter((inv) =>
      inv.invoice_date?.startsWith(currentMonth)
    );
    const monthlyExpenses = monthlyInvoices.reduce(
      (sum, inv) => sum + (inv.total_amount || 0),
      0
    );

    const categoryTotals = new Map<string, number>();
    monthlyInvoices.forEach((inv) => {
      if (inv.category_id) {
        const current = categoryTotals.get(inv.category_id) || 0;
        categoryTotals.set(inv.category_id, current + inv.total_amount);
      }
    });

    const breakdown = Array.from(categoryTotals.entries())
      .map(([catId, amount]) => {
        const cat = categories.find((c: any) => c.id === catId);
        return {
          name: cat ? `${cat.icon || ""} ${cat.name}` : "Khác",
          amount,
          percentage: monthlyExpenses
            ? (amount / monthlyExpenses) * 100
            : 0,
        };
      })
      .sort((a, b) => b.amount - a.amount);

    setStats({
      totalExpenses,
      monthlyExpenses,
      categoryBreakdown: breakdown,
    });
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);

  const handleExport = (format: "pdf" | "excel") => {
    toast({
      title: "Đang xuất báo cáo",
      description: `Đang tạo tệp ${format.toUpperCase()}...`,
    });

    // 🚧 Placeholder cho export
    setTimeout(() => {
      toast({
        title: "Chức năng đang phát triển",
        description: `Tính năng xuất ${format.toUpperCase()} sẽ sớm có.`,
      });
    }, 1500);
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Báo cáo chi tiêu</h1>
            <p className="text-muted-foreground">
              Theo dõi và phân tích thói quen chi tiêu của bạn
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleExport("excel")}>
              <Download className="mr-2 h-4 w-4" />
              Excel
            </Button>
            <Button
              onClick={() => handleExport("pdf")}
              className="bg-primary text-white hover:bg-primary/90"
            >
              <Download className="mr-2 h-4 w-4" />
              PDF
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="border-2">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Tổng chi tiêu
              </CardTitle>
              <TrendingDown className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary mb-1">
                {formatCurrency(stats.totalExpenses)}
              </div>
              <p className="text-xs text-muted-foreground">
                Tất cả các khoản chi
              </p>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Chi tiêu tháng này
              </CardTitle>
              <Calendar className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-secondary mb-1">
                {formatCurrency(stats.monthlyExpenses)}
              </div>
              <p className="text-xs text-muted-foreground">
                Tháng {new Date().getMonth() + 1}/{new Date().getFullYear()}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Phân bổ chi tiêu theo danh mục</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.categoryBreakdown.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  Chưa có dữ liệu chi tiêu trong tháng này
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {stats.categoryBreakdown.map((cat, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{cat.name}</span>
                      <div className="text-right">
                        <span className="font-semibold text-primary">
                          {formatCurrency(cat.amount)}
                        </span>
                        <span className="text-sm text-muted-foreground ml-2">
                          ({cat.percentage.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-accent rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${cat.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chart Placeholder */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Biểu đồ chi tiêu theo thời gian</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-accent/30 rounded-lg flex items-center justify-center">
              <p className="text-muted-foreground">
                📊 Biểu đồ chi tiết sẽ hiển thị tại đây
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Reports;
