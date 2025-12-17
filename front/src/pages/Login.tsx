import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link, useNavigate } from "react-router-dom";
import { Wallet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
// Import service thay vì gọi fetch trực tiếp
import { authService } from "@/services/auth.service"; 

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 1. Gọi API qua Service
      const response = await authService.login({ email, password });
      
      // 2. Lấy dữ liệu từ response (Axios trả về data trong field .data)
      // Cấu trúc trả về từ Backend: { accessToken: "...", user: { ... } }
      const { accessToken, user } = response.data;

      if (!accessToken || !user) {
        throw new Error("Dữ liệu phản hồi từ server không hợp lệ");
      }

      // 3. Chuẩn bị dữ liệu để lưu
      // Quan trọng: Gộp accessToken vào object user để axios-client interceptor lấy được
      const dataToSave = {
        ...user,
        accessToken: accessToken 
      };

      // 4. Lưu vào LocalStorage
      localStorage.setItem("user", JSON.stringify(dataToSave));
      
      // Lưu thêm userId nếu logic cũ của bạn cần dùng riêng lẻ (tùy chọn)
      localStorage.setItem("userId", user.id);

      toast({
        title: "Đăng nhập thành công!",
        description: `Chào mừng ${user.fullName} quay trở lại.`,
      });

      // 5. Chuyển hướng
      navigate("/dashboard");

    } catch (error: any) {
      console.error("Login error:", error);
      
      // Xử lý thông báo lỗi từ Backend (nếu có)
      // error.response.data thường chứa message lỗi từ Spring Boot
      const errorMessage = error.response?.data || "Email hoặc mật khẩu không đúng.";
      
      toast({
        title: "Đăng nhập thất bại!",
        description: typeof errorMessage === 'string' ? errorMessage : "Vui lòng thử lại sau.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-accent/20 to-background p-4">
      <Card className="w-full max-w-md shadow-elegant">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center">
              <Wallet className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl">Đăng nhập</CardTitle>
          <CardDescription>
            Nhập email và mật khẩu để truy cập tài khoản
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="text-sm text-right">
              <Link
                to="/forgot-password"
                className="text-primary hover:underline"
              >
                Quên mật khẩu?
              </Link>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full gradient-primary text-white shadow-elegant"
              disabled={isLoading}
            >
              {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Chưa có tài khoản?{" "}
              <Link
                to="/register"
                className="text-primary hover:underline font-medium"
              >
                Đăng ký ngay
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Login;