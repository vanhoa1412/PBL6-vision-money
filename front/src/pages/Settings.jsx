import { useState } from "react";
import axios from "axios";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Shield, Bell, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";

const Settings = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    budgetAlerts: true,
    expenseReminders: false,
  });
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const storedUser = JSON.parse(localStorage.getItem("user"));
  const userId = storedUser?.id;

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (!formData.currentPassword) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập mật khẩu hiện tại!",
        variant: "destructive",
      });
      return;
    }

    if (formData.newPassword.length < 6) {
      toast({
        title: "Lỗi",
        description: "Mật khẩu mới phải có ít nhất 6 ký tự!",
        variant: "destructive",
      });
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      toast({
        title: "Lỗi",
        description: "Mật khẩu mới không khớp!",
        variant: "destructive",
      });
      return;
    }

    try {
      setChangingPassword(true);
      await axios.put(`http://localhost:8080/api/users/${userId}/password`, {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });
      toast({
        title: "Đổi mật khẩu thành công!",
        description: "Mật khẩu đã được cập nhật.",
      });
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      console.error(err);
      const errorMessage = err.response?.data?.message || "Không thể đổi mật khẩu.";
      toast({
        title: "Thất bại",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSaveNotifications = async () => {
    try {
      setSaving(true);
      // Gọi API để lưu cài đặt thông báo
      await axios.put(`http://localhost:8080/api/users/${userId}/settings`, {
        notifications: notificationSettings,
      });
      toast({
        title: "✅ Đã lưu cài đặt!",
        description: "Cài đặt thông báo đã được cập nhật.",
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Lỗi",
        description: "Không thể lưu cài đặt.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Cài đặt</h1>
          <p className="text-muted-foreground">
            Quản lý cài đặt tài khoản và bảo mật
          </p>
        </div>

        <div className="space-y-6">
          {/* Đổi mật khẩu */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Đổi mật khẩu
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Mật khẩu hiện tại</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={formData.currentPassword}
                    onChange={(e) =>
                      setFormData({ ...formData, currentPassword: e.target.value })
                    }
                    placeholder="Nhập mật khẩu hiện tại"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Mật khẩu mới</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={formData.newPassword}
                    onChange={(e) =>
                      setFormData({ ...formData, newPassword: e.target.value })
                    }
                    placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        confirmPassword: e.target.value,
                      })
                    }
                    placeholder="Xác nhận mật khẩu mới"
                  />
                </div>
                <Button type="submit" variant="outline" disabled={changingPassword}>
                  {changingPassword && <Loader2 className="animate-spin h-4 w-4 mr-2" />}
                  Đổi mật khẩu
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Cài đặt thông báo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Cài đặt thông báo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="emailNotifications">Thông báo qua email</Label>
                    <p className="text-sm text-muted-foreground">
                      Nhận thông báo về hoạt động tài khoản qua email
                    </p>
                  </div>
                  <Switch
                    id="emailNotifications"
                    checked={notificationSettings.emailNotifications}
                    onCheckedChange={(checked) =>
                      setNotificationSettings(prev => ({
                        ...prev,
                        emailNotifications: checked
                      }))
                    }
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="budgetAlerts">Cảnh báo ngân sách</Label>
                    <p className="text-sm text-muted-foreground">
                      Nhận cảnh báo khi sắp vượt ngân sách
                    </p>
                  </div>
                  <Switch
                    id="budgetAlerts"
                    checked={notificationSettings.budgetAlerts}
                    onCheckedChange={(checked) =>
                      setNotificationSettings(prev => ({
                        ...prev,
                        budgetAlerts: checked
                      }))
                    }
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="expenseReminders">Nhắc nhở chi tiêu</Label>
                    <p className="text-sm text-muted-foreground">
                      Nhắc nhở ghi chép chi tiêu hàng ngày
                    </p>
                  </div>
                  <Switch
                    id="expenseReminders"
                    checked={notificationSettings.expenseReminders}
                    onCheckedChange={(checked) =>
                      setNotificationSettings(prev => ({
                        ...prev,
                        expenseReminders: checked
                      }))
                    }
                  />
                </div>

                <Button 
                  onClick={handleSaveNotifications} 
                  disabled={saving}
                  className="mt-4"
                >
                  {saving && <Loader2 className="animate-spin h-4 w-4 mr-2" />}
                  Lưu cài đặt thông báo
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Bảo mật */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Bảo mật
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Xác thực hai yếu tố (2FA)</p>
                    <p className="text-sm text-muted-foreground">
                      Tăng cường bảo mật cho tài khoản
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Bật 2FA
                  </Button>
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Thiết bị đăng nhập</p>
                    <p className="text-sm text-muted-foreground">
                      Quản lý các thiết bị đã đăng nhập
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Xem chi tiết
                  </Button>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Phiên đăng nhập hiện tại</p>
                    <p className="text-sm text-muted-foreground">
                      Đăng xuất khỏi tất cả các thiết bị
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Đăng xuất tất cả
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Khu vực nguy hiểm */}
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-red-600 flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Khu vực nguy hiểm
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Xóa tài khoản</p>
                    <p className="text-sm text-muted-foreground">
                      Xóa vĩnh viễn tài khoản và tất cả dữ liệu
                    </p>
                  </div>
                  <Button variant="destructive" size="sm">
                    Xóa tài khoản
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Settings;