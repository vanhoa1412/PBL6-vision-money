import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, TrendingDown, Calendar, RefreshCw, BarChart3, PieChart, LineChart, Wallet, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import axiosClient from "@/lib/axios-client";

// Import Chart.js
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// --- Interfaces ---
interface CategoryStats {
  id: number;
  name: string;
  amount: number;
  percentage: number;
  icon?: string;
  color_hex?: string;
}

interface Statistics {
  averageDaily: number;
  maxExpense: number;
  minExpense: number;
  expenseCount: number;
}

interface ReportsData {
  totalExpenses: number;
  periodExpenses: number; // Backend trả về key này (tương đương monthlyExpenses cũ)
  categoryBreakdown: CategoryStats[];
  statistics?: Statistics;
  period?: {
    startDate: string;
    endDate: string;
    expenseCount?: number;
    days?: number;
  };
}

interface ChartData {
  type: string;
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
    tension?: number;
  }>;
}

const Reports = () => {
  // State quản lý dữ liệu
  const [stats, setStats] = useState<ReportsData>({
    totalExpenses: 0,
    periodExpenses: 0,
    categoryBreakdown: [],
  });
  
  const [chartData, setChartData] = useState<ChartData | null>(null);
  
  // State quản lý UI
  const [chartType, setChartType] = useState<string>("monthly");
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { toast } = useToast();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userId = user?.id;

  // Effect tải dữ liệu khi component mount hoặc user đổi
  useEffect(() => {
    if (userId) {
      fetchReportsData();
    } else {
      setLoading(false);
      setError("Vui lòng đăng nhập để xem báo cáo.");
    }
  }, [userId]);

  // Effect riêng cho Chart để không reload toàn bộ trang khi đổi loại biểu đồ
  useEffect(() => {
    if (userId) {
      fetchChartData();
    }
  }, [userId, chartType]);

  // --- API Calls ---

  const fetchReportsData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Dùng axiosClient tự động gắn Token
      const response = await axiosClient.get("/reports/summary", {
        params: { userId }
      });

      setStats(response.data);
    } catch (err: any) {
      console.error("Reports API error:", err);
      const msg = err.response?.data?.message || "Không thể tải dữ liệu báo cáo";
      setError(msg);
      toast({ title: "Lỗi", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchChartData = async () => {
    try {
      setChartLoading(true);
      
      const response = await axiosClient.get("/reports/charts", {
        params: { userId, chartType }
      });

      setChartData(response.data);
    } catch (err: any) {
      console.error("Chart API error:", err);
      toast({
        title: "Lỗi biểu đồ",
        description: "Không thể tải dữ liệu biểu đồ",
        variant: "destructive",
      });
    } finally {
      setChartLoading(false);
    }
  };

  const handleExport = async (format: "pdf" | "excel") => {
    if (!userId) return;

    try {
      toast({
        title: "Đang xử lý",
        description: `Đang tạo báo cáo ${format.toUpperCase()}...`,
      });

      const response = await axiosClient.get("/reports/export", {
        params: { userId, format }
      });

      toast({
        title: "Thông báo",
        description: response.data.message || `Đã gửi yêu cầu xuất ${format.toUpperCase()}`,
      });
    } catch (err: any) {
      toast({
        title: "Xuất báo cáo thất bại",
        description: err.response?.data?.message || "Lỗi không xác định",
        variant: "destructive",
      });
    }
  };

  const handleRefresh = () => {
    fetchReportsData();
    fetchChartData();
  };

  // --- Helper Functions ---

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(amount);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("vi-VN");
  };

  // --- Chart Rendering ---

  const renderChart = () => {
    if (chartLoading) {
      return (
        <div className="h-72 flex flex-col items-center justify-center text-muted-foreground animate-pulse">
          <RefreshCw className="h-8 w-8 animate-spin mb-2" />
          <p>Đang phân tích dữ liệu...</p>
        </div>
      );
    }

    if (!chartData || chartData.datasets[0].data.length === 0) {
      return (
        <div className="h-72 flex flex-col items-center justify-center text-muted-foreground bg-accent/10 rounded-lg border border-dashed">
          <BarChart3 className="h-10 w-10 mb-2 opacity-50" />
          <p>Chưa có dữ liệu biểu đồ cho kỳ này</p>
        </div>
      );
    }

    const commonOptions: ChartOptions<any> = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top' },
        tooltip: {
          callbacks: {
            label: (context: any) => {
              let label = context.dataset.label || '';
              if (label) label += ': ';
              label += formatCurrency(context.parsed.y !== undefined ? context.parsed.y : context.parsed);
              return label;
            }
          }
        }
      },
    };

    const lineBarOptions = {
        ...commonOptions,
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    callback: (value: any) => {
                        if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
                        if (value >= 1000) return (value / 1000).toFixed(0) + 'k';
                        return value;
                    }
                }
            }
        }
    };

    // Chuẩn hóa dữ liệu để tránh lỗi Chart.js
    const data = {
      labels: chartData.labels,
      datasets: chartData.datasets.map(dataset => ({
        ...dataset,
        // Đảm bảo data là số
        data: dataset.data.map(d => Number(d) || 0)
      }))
    };

    switch (chartData.type) {
      case 'line': return <Line data={data} options={lineBarOptions} />;
      case 'bar': return <Bar data={data} options={lineBarOptions} />;
      case 'doughnut': return <Doughnut data={data} options={commonOptions} />;
      default: return <div className="h-72 flex items-center justify-center">Loại biểu đồ không hỗ trợ</div>;
    }
  };

  // --- Render Error State ---
  if (error) {
    return (
      <Layout>
        <div className="max-w-6xl mx-auto p-6 text-center py-20">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mb-4">
            <RefreshCw className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Đã có lỗi xảy ra</h2>
          <p className="text-red-500 mb-6">{error}</p>
          <Button onClick={handleRefresh} className="gradient-primary text-white">
            Thử lại
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
        
        {/* --- Header & Actions --- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-1">Báo cáo tài chính</h1>
            <p className="text-muted-foreground text-sm">
              {stats.period ? (
                <>Kỳ báo cáo: <span className="font-medium text-foreground">{formatDate(stats.period.startDate)} - {formatDate(stats.period.endDate)}</span></>
              ) : "Đang tải dữ liệu..."}
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleRefresh} variant="outline" size="sm" className="gap-2">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> 
              <span className="hidden sm:inline">Làm mới</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport("excel")} className="gap-2">
              <Download className="h-4 w-4" /> Excel
            </Button>
            <Button size="sm" onClick={() => handleExport("pdf")} className="gradient-primary text-white gap-2 shadow-sm">
              <Download className="h-4 w-4" /> PDF
            </Button>
          </div>
        </div>

        {/* --- Summary Cards --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Tổng chi tiêu */}
          <Card className="hover:shadow-md transition-all border-l-4 border-l-primary">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Tổng chi tiêu (Lũy kế)</CardTitle>
              <Wallet className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{formatCurrency(stats.totalExpenses)}</div>
              <p className="text-xs text-muted-foreground mt-1">Toàn bộ thời gian</p>
            </CardContent>
          </Card>

          {/* Card 2: Chi tiêu kỳ này */}
          <Card className="hover:shadow-md transition-all border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Chi tiêu kỳ này</CardTitle>
              <Calendar className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{formatCurrency(stats.periodExpenses)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.period?.expenseCount || 0} giao dịch phát sinh
              </p>
            </CardContent>
          </Card>

          {/* Card 3: Trung bình ngày (Cải tiến mới) */}
          <Card className="hover:shadow-md transition-all border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Trung bình ngày</CardTitle>
              <TrendingDown className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(stats.statistics?.averageDaily || 0)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Trong kỳ báo cáo</p>
            </CardContent>
          </Card>

          {/* Card 4: Chi lớn nhất (Cải tiến mới) */}
          <Card className="hover:shadow-md transition-all border-l-4 border-l-orange-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Khoản chi lớn nhất</CardTitle>
              <ArrowUpRight className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {formatCurrency(stats.statistics?.maxExpense || 0)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">1 lần giao dịch</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* --- Chart Section --- */}
          <Card className="lg:col-span-2 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">Biểu đồ phân tích</CardTitle>
              <Select value={chartType} onValueChange={setChartType}>
                <SelectTrigger className="w-[160px] h-9">
                  <SelectValue placeholder="Loại biểu đồ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly"><div className="flex gap-2 items-center"><LineChart className="h-4 w-4"/> Theo tháng</div></SelectItem>
                  <SelectItem value="category"><div className="flex gap-2 items-center"><PieChart className="h-4 w-4"/> Theo danh mục</div></SelectItem>
                  <SelectItem value="daily"><div className="flex gap-2 items-center"><BarChart3 className="h-4 w-4"/> Theo ngày</div></SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              <div className="h-80 w-full mt-2">
                {renderChart()}
              </div>
            </CardContent>
          </Card>

          {/* --- Category Breakdown --- */}
          <Card className="shadow-sm flex flex-col h-full">
            <CardHeader>
              <CardTitle className="text-lg">Top chi tiêu</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto pr-2 custom-scrollbar">
              {stats.categoryBreakdown.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-sm">
                  <PieChart className="h-8 w-8 mb-2 opacity-50" />
                  Chưa có dữ liệu
                </div>
              ) : (
                <div className="space-y-5">
                  {stats.categoryBreakdown.map((cat, index) => (
                    <div key={cat.id || index} className="group">
                      <div className="flex justify-between items-center text-sm mb-1.5">
                        <span className="font-medium flex items-center gap-2">
                          <span className="text-lg">{cat.icon || "📁"}</span>
                          {cat.name}
                        </span>
                        <div className="text-right">
                          <div className="font-bold text-gray-900">{formatCurrency(cat.amount)}</div>
                        </div>
                      </div>
                      
                      {/* Progress Bar with Color */}
                      <div className="w-full bg-secondary/30 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-1000 ease-out relative"
                          style={{ 
                            width: `${cat.percentage}%`,
                            backgroundColor: cat.color_hex || '#3b82f6' 
                          }}
                        >
                            {/* Hiển thị % ngay trên thanh nếu đủ rộng */}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground text-right mt-1">
                        Chiếm {cat.percentage.toFixed(1)}% tổng chi
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Reports;