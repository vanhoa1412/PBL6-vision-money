import { useEffect, useState } from "react";
import axios from "axios";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, Mail, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Profile = () => {
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    avatarUrl: "",
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
  }, [userId, toast]);

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
      
      // Cập nhật thông tin user trong localStorage
      const updatedUser = { ...storedUser, fullName: formData.fullName, avatarUrl: formData.avatarUrl };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      
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
        <div className="p-10 text-center text-gray-500">
          <Loader2 className="animate-spin h-8 w-8 mx-auto mb-2" />
          Đang tải thông tin...
        </div>
      </Layout>
    );

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Thông tin cá nhân</h1>
          <p className="text-muted-foreground">
            Quản lý thông tin tài khoản và hồ sơ cá nhân
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
                <div className="text-xs text-muted-foreground">
                  Thành viên từ {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : '---'}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Content */}
          <div className="lg:col-span-2">
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
                    <Label htmlFor="fullName">Họ và tên</Label>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) =>
                        setFormData({ ...formData, fullName: e.target.value })
                      }
                      placeholder="Nhập họ và tên của bạn"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email"
                      value={formData.email} 
                      disabled 
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="avatarUrl">Link ảnh đại diện</Label>
                    <Input
                      id="avatarUrl"
                      placeholder="https://example.com/avatar.jpg"
                      value={formData.avatarUrl}
                      onChange={(e) =>
                        setFormData({ ...formData, avatarUrl: e.target.value })
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Nhập URL ảnh đại diện từ bên ngoài
                    </p>
                  </div>

                  <Button type="submit" className="w-full" disabled={saving}>
                    {saving && <Loader2 className="animate-spin h-4 w-4 mr-2" />}
                    Lưu thay đổi
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;