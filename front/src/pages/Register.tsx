import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useNavigate } from "react-router-dom";
import { Wallet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
// Import service mới
import { authService } from "@/services/auth.service";

const Register = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation cơ bản
    if (password !== confirmPassword) {
      toast({
        title: "Lỗi",
        description: "Mật khẩu xác nhận không khớp!",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // 1. Gọi API đăng ký
      const response = await authService.register({ fullName, email, password });

      // 2. Lấy dữ liệu (Backend trả về AuthResponse gồm accessToken + user)
      const { accessToken, user } = response.data;

      // 3. Tự động đăng nhập luôn (Lưu token vào storage)
      if (accessToken && user) {
        const dataToSave = {
          ...user,
          accessToken: accessToken
        };
        localStorage.setItem("user", JSON.stringify(dataToSave));
        localStorage.setItem("userId", user.id); // Lưu riêng nếu cần
      }

      toast({
        title: "Đăng ký thành công!",
        description: "Tài khoản của bạn đã được tạo và tự động đăng nhập.",
      });
      
      // 4. Chuyển hướng vào Dashboard ngay lập tức
      navigate("/dashboard");

    } catch (error: any) {
      console.error("Register error:", error);
      
      // Xử lý lỗi trả về từ Backend (ví dụ: Email đã tồn tại)
      const errorMessage = error.response?.data || "Đăng ký thất bại. Vui lòng thử lại.";

      toast({
        title: "Đăng ký thất bại!",
        description: typeof errorMessage === 'string' ? errorMessage : "Có lỗi xảy ra",
        variant: "destructive"
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
          <CardTitle className="text-2xl">Tạo tài khoản</CardTitle>
          <CardDescription>
            Điền thông tin để bắt đầu quản lý chi tiêu
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleRegister}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Họ và tên</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Nguyễn Văn A"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
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
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full gradient-primary text-white shadow-elegant"
              disabled={isLoading}
            >
              {isLoading ? "Đang tạo tài khoản..." : "Đăng ký"}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Đã có tài khoản?{" "}
              <Link to="/login" className="text-primary hover:underline font-medium">
                Đăng nhập
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Register;