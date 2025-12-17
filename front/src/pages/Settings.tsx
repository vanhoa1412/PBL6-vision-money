import React, { useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Shield, Bell, Loader2, LogOut, Smartphone, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import axiosClient from "@/lib/axios-client";
import { useNavigate } from "react-router-dom";

// Định nghĩa kiểu dữ liệu cho Form đổi mật khẩu
interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// Định nghĩa kiểu dữ liệu cho Cài đặt thông báo
interface NotificationSettings {
  emailNotifications: boolean;
  budgetAlerts: boolean;
  expenseReminders: boolean;
}

const Settings = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // State
  const [formData, setFormData] = useState<PasswordFormData>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    budgetAlerts: true,
    expenseReminders: false,
  });
  
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Lấy user từ localStorage
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : {};
  const userId = user?.id;

  // --- XỬ LÝ ĐỔI MẬT KHẨU ---
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    if (!formData.currentPassword) {
      toast({ title: "Lỗi", description: "Vui lòng nhập mật khẩu hiện tại.", variant: "destructive" });
      return;
    }
    if (formData.newPassword.length < 6) {
      toast({ title: "Lỗi", description: "Mật khẩu mới phải có ít nhất 6 ký tự.", variant: "destructive" });
      return;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      toast({ title: "Lỗi", description: "Mật khẩu xác nhận không khớp.", variant: "destructive" });
      return;
    }

    try {
      setIsChangingPassword(true);
      
      // Gọi API đổi mật khẩu
      await axiosClient.put(`/users/${userId}/password`, {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });

      toast({
        title: "Thành công!",
        description: "Mật khẩu của bạn đã được cập nhật.",
      });
      
      // Reset form
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

    } catch (err: any) {
      console.error(err);
      const errorMessage = err.response?.data?.message || "Mật khẩu hiện tại không đúng.";
      toast({
        title: "Đổi mật khẩu thất bại",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  // --- XỬ LÝ LƯU CÀI ĐẶT THÔNG BÁO ---
  const handleSaveNotifications = async () => {
    try {
      setIsSavingNotifications(true);
      
      await axiosClient.put(`/users/${userId}/settings`, {
        notifications: notificationSettings,
      });
      
      toast({
        title: "Đã lưu cài đặt!",
        description: "Cấu hình thông báo của bạn đã được cập nhật.",
      });
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Lỗi",
        description: "Không thể lưu cài đặt lúc này.",
        variant: "destructive",
      });
    } finally {
      setIsSavingNotifications(false);
    }
  };

  // --- ĐĂNG XUẤT ---
  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    toast({ title: "Đã đăng xuất thành công" });
    navigate("/login");
  };

  // --- XÓA TÀI KHOẢN (Placeholder) ---
  const handleDeleteAccount = () => {
    if (window.confirm("CẢNH BÁO: Hành động này không thể hoàn tác. Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản và toàn bộ dữ liệu?")) {
        // Gọi API xóa ở đây (nếu có)
        // await axiosClient.delete(`/users/${userId}`);
        toast({ title: "Chức năng đang phát triển", description: "Vui lòng liên hệ admin để xóa tài khoản." });
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-8">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Cài đặt hệ thống</h1>
          <p className="text-muted-foreground">
            Quản lý bảo mật, thông báo và tài khoản của bạn.
          </p>
        </div>

        <div className="grid gap-6">
          
          {/* 1. Đổi mật khẩu */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Lock className="h-5 w-5 text-primary" />
                Bảo mật
              </CardTitle>
              <CardDescription>Cập nhật mật khẩu để bảo vệ tài khoản</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Mật khẩu hiện tại</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={formData.currentPassword}
                    onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                    placeholder="••••••••"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                    <Label htmlFor="newPassword">Mật khẩu mới</Label>
                    <Input
                        id="newPassword"
                        type="password"
                        value={formData.newPassword}
                        onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                        placeholder="Tối thiểu 6 ký tự"
                    />
                    </div>
                    <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
                    <Input
                        id="confirmPassword"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        placeholder="Nhập lại mật khẩu mới"
                    />
                    </div>
                </div>
                
                <Button type="submit" className="gradient-primary text-white" disabled={isChangingPassword}>
                  {isChangingPassword ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang cập nhật...
                    </>
                  ) : (
                    "Đổi mật khẩu"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* 2. Cài đặt thông báo */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Bell className="h-5 w-5 text-primary" />
                Thông báo
              </CardTitle>
              <CardDescription>Tuỳ chỉnh cách bạn nhận thông tin từ ứng dụng</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Thông báo qua Email</Label>
                    <p className="text-sm text-muted-foreground">
                      Nhận báo cáo tuần và các tin tức quan trọng qua email đăng ký.
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.emailNotifications}
                    onCheckedChange={(checked) =>
                      setNotificationSettings(prev => ({ ...prev, emailNotifications: checked }))
                    }
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Cảnh báo ngân sách</Label>
                    <p className="text-sm text-muted-foreground">
                      Thông báo ngay lập tức khi bạn chi tiêu vượt quá 80% hạn mức.
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.budgetAlerts}
                    onCheckedChange={(checked) =>
                      setNotificationSettings(prev => ({ ...prev, budgetAlerts: checked }))
                    }
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Nhắc nhở hằng ngày</Label>
                    <p className="text-sm text-muted-foreground">
                      Nhắc bạn ghi chép chi tiêu vào 20:00 mỗi ngày.
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.expenseReminders}
                    onCheckedChange={(checked) =>
                      setNotificationSettings(prev => ({ ...prev, expenseReminders: checked }))
                    }
                  />
                </div>

                <div className="pt-2">
                    <Button onClick={handleSaveNotifications} disabled={isSavingNotifications} variant="outline">
                    {isSavingNotifications ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : null}
                    Lưu cấu hình thông báo
                    </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 3. Phiên đăng nhập */}
          <Card className="shadow-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                    <Smartphone className="h-5 w-5 text-primary" />
                    Phiên đăng nhập
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between">
                    <div>
                    <p className="font-medium">Đăng xuất khỏi thiết bị này</p>
                    <p className="text-sm text-muted-foreground">
                        Bạn sẽ cần đăng nhập lại để tiếp tục sử dụng.
                    </p>
                    </div>
                    <Button variant="outline" onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-2" /> Đăng xuất
                    </Button>
                </div>
            </CardContent>
          </Card>

          {/* 4. Vùng nguy hiểm */}
          <Card className="border-red-100 bg-red-50/10 shadow-sm">
            <CardHeader>
              <CardTitle className="text-red-600 flex items-center gap-2 text-xl">
                <Shield className="h-5 w-5" />
                Vùng nguy hiểm
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-red-900">Xóa tài khoản vĩnh viễn</p>
                  <p className="text-sm text-red-700/80">
                    Hành động này sẽ xóa toàn bộ dữ liệu chi tiêu và không thể khôi phục.
                  </p>
                </div>
                <Button variant="destructive" onClick={handleDeleteAccount}>
                  <AlertTriangle className="h-4 w-4 mr-2" /> Xóa tài khoản
                </Button>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </Layout>
  );
};

export default Settings;