import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, TrendingDown, Calendar, RefreshCw, BarChart3, PieChart, LineChart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";

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

interface CategoryStats {
  id: number;
  name: string;
  amount: number;
  percentage: number;
  icon?: string;
  color_hex?: string;
}

interface ReportsData {
  totalExpenses: number;
  monthlyExpenses: number;
  categoryBreakdown: CategoryStats[];
  period?: {
    startDate: string;
    endDate: string;
    expenseCount?: number;
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
  }>;
  period?: {
    startDate: string;
    endDate: string;
  };
}

const Reports = () => {
  const [stats, setStats] = useState<ReportsData>({
    totalExpenses: 0,
    monthlyExpenses: 0,
    categoryBreakdown: [],
  });
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [chartType, setChartType] = useState<string>("monthly");
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const userId = Number(localStorage.getItem("userId"));

  useEffect(() => {
    if (userId) {
      fetchReportsData();
      fetchChartData();
    }
  }, [userId, chartType]);

  const fetchReportsData = async () => {
    if (!userId) {
      setError("Không tìm thấy ID người dùng");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(
        `http://localhost:8080/api/reports/summary?userId=${userId}`
      );

      const reportData = response.data;
      
      setStats({
        totalExpenses: reportData.totalExpenses || 0,
        monthlyExpenses: reportData.monthlyExpenses || 0,
        categoryBreakdown: reportData.categoryBreakdown || [],
        period: reportData.period
      });

    } catch (err: any) {
      console.error("Reports API error:", err);
      const errorMessage = err.response?.data?.message || "Không thể tải dữ liệu báo cáo";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchChartData = async () => {
    if (!userId) return;

    try {
      setChartLoading(true);
      
      const response = await axios.get(
        `http://localhost:8080/api/reports/charts?userId=${userId}&chartType=${chartType}`
      );

      const data = response.data;
      setChartData(data);

    } catch (err: any) {
      console.error("Chart API error:", err);
      toast({
        title: "Lỗi",
        description: "Không thể tải dữ liệu biểu đồ",
        variant: "destructive",
      });
    } finally {
      setChartLoading(false);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);

  const handleExport = async (format: "pdf" | "excel") => {
    if (!userId) {
      toast({
        title: "Lỗi",
        description: "Vui lòng đăng nhập để xuất báo cáo",
        variant: "destructive",
      });
      return;
    }

    try {
      toast({
        title: "Đang xuất báo cáo",
        description: `Đang tạo tệp ${format.toUpperCase()}...`,
      });

      const response = await axios.get(
        `http://localhost:8080/api/reports/export?userId=${userId}&format=${format}`
      );

      const responseData = response.data;
      toast({
        title: "Thông báo",
        description: responseData.message || `Đã gửi yêu cầu xuất ${format.toUpperCase()}`,
      });

    } catch (err: any) {
      console.error("Export error:", err);
      const errorMessage = err.response?.data?.message || `Tính năng xuất ${format.toUpperCase()} sẽ sớm có.`;
      
      toast({
        title: "Thông báo",
        description: errorMessage,
      });
    }
  };

  const handleRefresh = () => {
    fetchReportsData();
    fetchChartData();
  };

  const handleChartTypeChange = (type: string) => {
    setChartType(type);
  };

  const renderChart = () => {
    if (chartLoading) {
      return (
        <div className="h-64 flex items-center justify-center">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
            <p className="text-muted-foreground">Đang tải biểu đồ...</p>
          </div>
        </div>
      );
    }

    if (!chartData) {
      return (
        <div className="h-64 flex items-center justify-center">
          <p className="text-muted-foreground">Không có dữ liệu biểu đồ</p>
        </div>
      );
    }

    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top' as const,
        },
        tooltip: {
          callbacks: {
            label: function(context: any) {
              let label = context.dataset.label || '';
              if (label) {
                label += ': ';
              }
              label += formatCurrency(context.parsed.y || context.parsed);
              return label;
            }
          }
        }
      },
      scales: chartData.type !== 'doughnut' ? {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value: any) {
              return formatCurrency(value);
            }
          }
        }
      } : undefined,
    };

    const data = {
      labels: chartData.labels,
      datasets: chartData.datasets.map(dataset => ({
        ...dataset,
        data: dataset.data.map(item => typeof item === 'number' ? item : 0)
      }))
    };

    switch (chartData.type) {
      case 'line':
        return <Line data={data} options={chartOptions} />;
      case 'bar':
        return <Bar data={data} options={chartOptions} />;
      case 'doughnut':
        return <Doughnut data={data} options={chartOptions} />;
      default:
        return <div>Loại biểu đồ không được hỗ trợ</div>;
    }
  };

  

  // Error state
  if (error) {
    return (
      <Layout>
        <div className="max-w-6xl mx-auto p-6">
          <div className="text-center py-12">
            <div className="text-red-500 text-lg mb-4">{error}</div>
            <Button onClick={handleRefresh} className="gradient-primary text-white">
              <RefreshCw className="mr-2 h-4 w-4" />
              Thử lại
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto p-6">
        {/* Header (giữ nguyên) */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Báo cáo chi tiêu</h1>
            <p className="text-muted-foreground">
              Theo dõi và phân tích thói quen chi tiêu của bạn
              {stats.period && (
                <span className="text-sm block mt-1">
                  Kỳ: {new Date(stats.period.startDate).toLocaleDateString('vi-VN')} - {new Date(stats.period.endDate).toLocaleDateString('vi-VN')}
                  {stats.period.expenseCount && ` • ${stats.period.expenseCount} giao dịch`}
                </span>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={handleRefresh} 
              variant="outline" 
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Làm mới
            </Button>
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

        {/* Summary Cards (giữ nguyên) */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="border-2 hover:shadow-elegant transition-all">
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
                Tất cả các khoản chi từ trước đến nay
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:shadow-elegant transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Chi tiêu trong kỳ
              </CardTitle>
              <Calendar className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-secondary mb-1">
                {formatCurrency(stats.monthlyExpenses)}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.period ? "Kỳ báo cáo hiện tại" : "Tháng hiện tại"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Biểu đồ thực tế */}
        <Card className="border-2 hover:shadow-elegant transition-all mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Biểu đồ chi tiêu</CardTitle>
              <Select value={chartType} onValueChange={handleChartTypeChange}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Chọn loại biểu đồ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">
                    <div className="flex items-center gap-2">
                      <LineChart className="h-4 w-4" />
                      Theo tháng
                    </div>
                  </SelectItem>
                  <SelectItem value="category">
                    <div className="flex items-center gap-2">
                      <PieChart className="h-4 w-4" />
                      Theo danh mục
                    </div>
                  </SelectItem>
                  <SelectItem value="daily">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      Theo ngày
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {renderChart()}
            </div>
          </CardContent>
        </Card>

        {/* Category Breakdown (giữ nguyên) */}
        <Card className="border-2 hover:shadow-elegant transition-all">
          <CardHeader>
            <CardTitle>Phân bổ chi tiêu theo danh mục</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.categoryBreakdown.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  Chưa có dữ liệu chi tiêu trong kỳ này
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {stats.categoryBreakdown.map((cat, index) => (
                  <div key={cat.id || index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium flex items-center gap-2">
                        {cat.icon && <span>{cat.icon}</span>}
                        {cat.name}
                      </span>
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
                        style={{ 
                          width: `${cat.percentage}%`,
                          backgroundColor: cat.color_hex || undefined 
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Reports;