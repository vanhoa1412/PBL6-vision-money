import { useEffect, useState } from "react";
import axios from "axios";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, Mail, Lock, Shield, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

const Profile = () => {
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    avatarUrl: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const storedUser = JSON.parse(localStorage.getItem("user"));
  const userId = storedUser?.id;


  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get(`http://localhost:8080/api/users/${userId}`);
        setUser(res.data);
        setFormData({
          fullName: res.data.fullName || "",
          email: res.data.email || "",
          avatarUrl: res.data.avatarUrl || "",
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } catch (err) {
        console.error(err);
        toast({
          title: "Lỗi tải thông tin",
          description: "Không thể tải thông tin người dùng.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  // --- Cập nhật thông tin cá nhân ---
  const handleUpdateProfile = async (e) => {
    e.preventDefault();

    if (!formData.fullName.trim()) {
      toast({
        title: "Lỗi",
        description: "Tên không được để trống!",
        variant: "destructive",
      });
      return;
    }
    if (/\d/.test(formData.fullName)) {
      toast({
        title: "Lỗi",
        description: "Tên không hợp lệ (không được chứa số)!",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      await axios.put(`http://localhost:8080/api/users/${userId}`, {
        fullName: formData.fullName,
        avatarUrl: formData.avatarUrl,
      });
      toast({
        title: "✅ Cập nhật thành công!",
        description: "Thông tin cá nhân đã được lưu lại.",
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Cập nhật thất bại",
        description: "Không thể lưu thay đổi.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // --- Đổi mật khẩu ---
  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (formData.newPassword !== formData.confirmPassword) {
      toast({
        title: "Lỗi",
        description: "Mật khẩu mới không khớp!",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      await axios.put(`http://localhost:8080/api/users/${userId}/password`, {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });
      toast({
        title: "Đổi mật khẩu thành công!",
        description: "Mật khẩu đã được cập nhật.",
      });
      setFormData({
        ...formData,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Thất bại",
        description: "Không thể đổi mật khẩu.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name) => {
    return name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading)
    return (
      <Layout>
        <div className="p-10 text-center text-gray-500">Đang tải thông tin...</div>
      </Layout>
    );

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Thông tin cá nhân</h1>
          <p className="text-muted-foreground">
            Quản lý thông tin tài khoản và bảo mật
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Avatar & Basic Info */}
          <Card className="lg:col-span-1">
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-24 w-24 mb-4">
                  {formData.avatarUrl ? (
                    <img
                      src={formData.avatarUrl}
                      alt="Avatar"
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    <AvatarFallback className="text-2xl bg-gradient-to-br from-primary to-primary-glow text-white">
                      {getInitials(formData.fullName || "U")}
                    </AvatarFallback>
                  )}
                </Avatar>
                <h3 className="font-semibold text-lg mb-1">{formData.fullName}</h3>
                <p className="text-sm text-muted-foreground mb-4">{formData.email}</p>
              </div>
            </CardContent>
          </Card>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Thông tin cá nhân */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Thông tin cá nhân
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Họ và tên</Label>
                    <Input
                      value={formData.fullName}
                      onChange={(e) =>
                        setFormData({ ...formData, fullName: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input value={formData.email} disabled />
                  </div>

                  <div className="space-y-2">
                    <Label>Link ảnh đại diện</Label>
                    <Input
                      placeholder="https://..."
                      value={formData.avatarUrl}
                      onChange={(e) =>
                        setFormData({ ...formData, avatarUrl: e.target.value })
                      }
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={saving}>
                    {saving && <Loader2 className="animate-spin h-4 w-4 mr-2" />}
                    Lưu thay đổi
                  </Button>
                </form>
              </CardContent>
            </Card>

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
                    <Label>Mật khẩu hiện tại</Label>
                    <Input
                      type="password"
                      value={formData.currentPassword}
                      onChange={(e) =>
                        setFormData({ ...formData, currentPassword: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Mật khẩu mới</Label>
                    <Input
                      type="password"
                      value={formData.newPassword}
                      onChange={(e) =>
                        setFormData({ ...formData, newPassword: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Xác nhận mật khẩu mới</Label>
                    <Input
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          confirmPassword: e.target.value,
                        })
                      }
                    />
                  </div>
                  <Button type="submit" variant="outline" disabled={saving}>
                    {saving && <Loader2 className="animate-spin h-4 w-4 mr-2" />}
                    Đổi mật khẩu
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Security */}
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
                    <Button variant="outline">
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
                    <Button variant="outline">
                      Xem chi tiết
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
