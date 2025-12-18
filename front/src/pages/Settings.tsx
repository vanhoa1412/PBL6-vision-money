import React, { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Shield, Bell, Loader2, LogOut, Smartphone, AlertTriangle, Save, Palette } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useTheme } from "@/hooks/use-theme";
import axiosClient from "@/lib/axios-client";
import { useNavigate } from "react-router-dom";

// Định nghĩa kiểu dữ liệu
interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface NotificationSettings {
  emailNotifications: boolean;
  budgetAlerts: boolean;
  expenseReminders: boolean;
}

const Settings = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  
  // --- STATE ---
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
  
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Lấy User ID
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : {};
  const userId = user?.id;

  // --- 1. LOAD SETTINGS KHI VÀO TRANG ---
  useEffect(() => {
    if (userId) {
        fetchSettings();
    }
  }, [userId]);

  const fetchSettings = async () => {
    try {
        setIsLoadingSettings(true);
        // Gọi API lấy cài đặt của user (Nếu backend chưa có API này, đoạn này sẽ catch lỗi và dùng default)
        const res = await axiosClient.get(`/users/${userId}/settings`);
        if (res.data) {
            setNotificationSettings({
                emailNotifications: res.data.emailNotifications ?? true,
                budgetAlerts: res.data.budgetAlerts ?? true,
                expenseReminders: res.data.expenseReminders ?? false,
            });
        }
    } catch (error) {
        console.log("Dùng cài đặt mặc định hoặc API chưa sẵn sàng");
    } finally {
        setIsLoadingSettings(false);
    }
  };

  // --- 2. XỬ LÝ ĐỔI MẬT KHẨU ---
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.currentPassword) {
      toast({ title: "Thiếu thông tin", description: "Vui lòng nhập mật khẩu hiện tại.", variant: "destructive" });
      return;
    }
    if (formData.newPassword.length < 6) {
      toast({ title: "Mật khẩu yếu", description: "Mật khẩu mới phải có ít nhất 6 ký tự.", variant: "destructive" });
      return;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      toast({ title: "Không khớp", description: "Mật khẩu xác nhận không trùng khớp.", variant: "destructive" });
      return;
    }

    try {
      setIsChangingPassword(true);
      await axiosClient.put(`/users/${userId}/password`, {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });

      toast({
        title: "Thành công!",
        description: "Mật khẩu của bạn đã được cập nhật.",
      });
      
      // Reset form
      setFormData({ currentPassword: "", newPassword: "", confirmPassword: "" });

    } catch (err: any) {
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

  // --- 3. LƯU CÀI ĐẶT THÔNG BÁO ---
  const handleSaveNotifications = async () => {
    try {
      setIsSavingNotifications(true);
      
      await axiosClient.put(`/users/${userId}/settings`, notificationSettings);
      
      toast({
        title: "Đã lưu cài đặt!",
        description: "Cấu hình thông báo đã được cập nhật.",
      });
    } catch (err: any) {
      toast({
        title: "Lỗi",
        description: "Không thể lưu cài đặt lúc này.",
        variant: "destructive",
      });
    } finally {
      setIsSavingNotifications(false);
    }
  };

  const handleLogout = () => {
    if(confirm("Đăng xuất khỏi thiết bị này?")) {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        navigate("/login");
    }
  };

  const handleDeleteAccount = () => {
    // Logic giả lập - cần backend hỗ trợ
    const confirmStep1 = confirm("CẢNH BÁO: Bạn có chắc chắn muốn xóa tài khoản?");
    if (confirmStep1) {
        const confirmStep2 = confirm("Hành động này sẽ XÓA VĨNH VIỄN toàn bộ dữ liệu chi tiêu. Không thể khôi phục! Bạn vẫn muốn tiếp tục?");
        if(confirmStep2) {
            toast({ title: "Yêu cầu đã gửi", description: "Hệ thống đang xử lý yêu cầu xóa tài khoản." });
            // await axiosClient.delete(`/users/${userId}`);
        }
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Cài đặt</h1>
          <p className="text-muted-foreground">Quản lý bảo mật, tùy chọn thông báo và tài khoản.</p>
        </div>

        <div className="grid gap-6">
          
          {/* --- CARD 1: BẢO MẬT --- */}
          <Card className="shadow-sm border-t-4 border-t-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Lock className="h-5 w-5 text-primary" /> Bảo mật
              </CardTitle>
              <CardDescription>Cập nhật mật khẩu để bảo vệ tài khoản của bạn</CardDescription>
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
                  {isChangingPassword ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4"/>}
                  {isChangingPassword ? "Đang xử lý..." : "Cập nhật mật khẩu"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* --- CARD 2: THÔNG BÁO --- */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Bell className="h-5 w-5 text-primary" /> Thông báo
              </CardTitle>
              <CardDescription>Tuỳ chỉnh cách ứng dụng gửi thông tin cho bạn</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingSettings ? (
                  <div className="py-8 text-center text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin mx-auto mb-2"/>Đang tải cấu hình...</div>
              ) : (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                        <Label className="text-base">Thông báo qua Email</Label>
                        <p className="text-sm text-muted-foreground">Nhận báo cáo tuần và tin tức quan trọng.</p>
                        </div>
                        <Switch
                        checked={notificationSettings.emailNotifications}
                        onCheckedChange={(c) => setNotificationSettings(p => ({ ...p, emailNotifications: c }))}
                        />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                        <Label className="text-base">Cảnh báo ngân sách</Label>
                        <p className="text-sm text-muted-foreground">Thông báo ngay khi chi tiêu vượt 80% hạn mức.</p>
                        </div>
                        <Switch
                        checked={notificationSettings.budgetAlerts}
                        onCheckedChange={(c) => setNotificationSettings(p => ({ ...p, budgetAlerts: c }))}
                        />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                        <Label className="text-base">Nhắc nhở hằng ngày</Label>
                        <p className="text-sm text-muted-foreground">Nhắc ghi chép chi tiêu vào 20:00 mỗi ngày.</p>
                        </div>
                        <Switch
                        checked={notificationSettings.expenseReminders}
                        onCheckedChange={(c) => setNotificationSettings(p => ({ ...p, expenseReminders: c }))}
                        />
                    </div>

                    <div className="pt-2">
                        <Button onClick={handleSaveNotifications} disabled={isSavingNotifications} variant="outline" className="w-full sm:w-auto">
                        {isSavingNotifications && <Loader2 className="h-4 w-4 animate-spin mr-2"/>}
                        Lưu cấu hình thông báo
                        </Button>
                    </div>
                  </div>
              )}
            </CardContent>
          </Card>

          {/* --- CARD 3: GIAO DIỆN --- */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Palette className="h-5 w-5 text-primary" /> Giao diện
              </CardTitle>
              <CardDescription>Chọn chủ đề màu sắc cho ứng dụng</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-base">Chủ đề</Label>
                  <p className="text-sm text-muted-foreground">Chọn giữa chế độ sáng, tối hoặc theo máy tính</p>
                </div>
                <RadioGroup value={theme} onValueChange={(value) => setTheme(value as "light" | "dark" | "system")}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="light" id="light" />
                    <Label htmlFor="light" className="font-normal cursor-pointer">
                      Sáng (Trắng)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="dark" id="dark" />
                    <Label htmlFor="dark" className="font-normal cursor-pointer">
                      Tối (Đen)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="system" id="system" />
                    <Label htmlFor="system" className="font-normal cursor-pointer">
                      Theo máy tính
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>

          {/* --- CARD 4: VÙNG NGUY HIỂM --- */}
          <Card className="border-red-200 bg-red-50/30 shadow-sm dark:bg-red-950/20 dark:border-red-900">
            <CardHeader>
              <CardTitle className="text-red-600 dark:text-red-400 flex items-center gap-2 text-xl">
                <Shield className="h-5 w-5" /> Vùng nguy hiểm
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="flex items-center justify-between bg-white dark:bg-gray-900 p-4 rounded-lg border border-red-100 dark:border-red-900">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">Đăng xuất thiết bị</p>
                    <p className="text-sm text-muted-foreground">Kết thúc phiên làm việc hiện tại.</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-2" /> Đăng xuất
                  </Button>
               </div>

               <div className="flex items-center justify-between bg-white dark:bg-gray-900 p-4 rounded-lg border border-red-100 dark:border-red-900">
                  <div>
                    <p className="font-medium text-red-700 dark:text-red-400">Xóa tài khoản vĩnh viễn</p>
                    <p className="text-sm text-red-600/70 dark:text-red-400/70">Dữ liệu không thể khôi phục sau khi xóa.</p>
                  </div>
                  <Button variant="destructive" size="sm" onClick={handleDeleteAccount}>
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