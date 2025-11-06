import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Wallet, TrendingUp, Shield, Sparkles, BarChart3, Bell } from "lucide-react";

const Landing = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-background via-accent/20 to-background">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        
        <nav className="container mx-auto px-4 py-6 flex justify-between items-center relative z-10">
          <div className="flex items-center gap-2">
            <Wallet className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">Pocket Money</span>
          </div>
          <div className="flex gap-4">
            <Button variant="ghost" asChild>
              <Link to="/login">Đăng nhập</Link>
            </Button>
            <Button asChild className="gradient-primary text-white shadow-elegant">
              <Link to="/register">Đăng ký</Link>
            </Button>
          </div>
        </nav>

        <div className="container mx-auto px-4 py-20 text-center relative z-10">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in">
            Quản lý chi tiêu
            <br />
            <span
              style={{
                background: "linear-gradient(135deg, hsl(160 84% 39%), hsl(160 100% 45%))",
                WebkitBackgroundClip: "text", 
                color: "transparent", 
                fontWeight: "bold", 
              }}
            >
              Thông minh & Dễ dàng
            </span>

          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Theo dõi mọi khoản chi tiêu, lập ngân sách hiệu quả và đạt được mục tiêu tài chính của bạn với Pocket Money Ledger
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" asChild className="gradient-primary text-white shadow-elegant">
              <Link to="/register">Bắt đầu miễn phí</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/dashboard">Xem demo</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-20">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          Tính năng nổi bật
        </h2>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="border-2 hover:shadow-elegant transition-all">
            <CardContent className="p-6">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Theo dõi chi tiêu</h3>
              <p className="text-muted-foreground">
                Ghi lại mọi khoản chi tiêu một cách nhanh chóng và dễ dàng. Phân loại theo danh mục để quản lý tốt hơn.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:shadow-elegant transition-all">
            <CardContent className="p-6">
              <div className="h-12 w-12 rounded-lg bg-secondary/10 flex items-center justify-center mb-4">
                <BarChart3 className="h-6 w-6 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Báo cáo chi tiết</h3>
              <p className="text-muted-foreground">
                Xem biểu đồ trực quan về thói quen chi tiêu của bạn. Phân tích xu hướng theo thời gian.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:shadow-elegant transition-all">
            <CardContent className="p-6">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Wallet className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Quản lý ngân sách</h3>
              <p className="text-muted-foreground">
                Đặt giới hạn chi tiêu cho từng danh mục. Nhận thông báo khi gần vượt ngân sách.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:shadow-elegant transition-all">
            <CardContent className="p-6">
              <div className="h-12 w-12 rounded-lg bg-secondary/10 flex items-center justify-center mb-4">
                <Sparkles className="h-6 w-6 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Quản lý hóa đơn</h3>
              <p className="text-muted-foreground">
                Lưu trữ và quản lý hóa đơn điện tử. Tìm kiếm nhanh chóng khi cần thiết.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:shadow-elegant transition-all">
            <CardContent className="p-6">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Bảo mật tuyệt đối</h3>
              <p className="text-muted-foreground">
                Dữ liệu của bạn được mã hóa và bảo vệ với các tiêu chuẩn bảo mật cao nhất.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:shadow-elegant transition-all">
            <CardContent className="p-6">
              <div className="h-12 w-12 rounded-lg bg-secondary/10 flex items-center justify-center mb-4">
                <Bell className="h-6 w-6 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Thông báo thông minh</h3>
              <p className="text-muted-foreground">
                Nhận cảnh báo khi chi tiêu vượt mức hoặc đến hạn thanh toán hóa đơn.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-primary/10 via-accent to-secondary/10 py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Sẵn sàng kiểm soát tài chính?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Tham gia cùng hàng nghìn người dùng đã cải thiện thói quen chi tiêu của họ
          </p>
          <Button size="lg" asChild className="gradient-primary text-white shadow-elegant">
            <Link to="/register">Bắt đầu ngay hôm nay</Link>
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2025 Pocket Money Ledger. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
