import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import axiosClient from "@/lib/axios-client";

// Định nghĩa kiểu dữ liệu User
interface UserProfile {
  id: number;
  fullName: string;
  email: string;
  avatarUrl?: string;
  createdAt?: string;
}

const Profile = () => {
  const { toast } = useToast();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    avatarUrl: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Lấy userId từ localStorage
  const storedUserStr = localStorage.getItem("user");
  const storedUser = storedUserStr ? JSON.parse(storedUserStr) : null;
  const userId = storedUser?.id;

  useEffect(() => {
    if (userId) {
      fetchUser();
    } else {
        setLoading(false);
    }
  }, [userId]);

  const fetchUser = async () => {
    try {
      // Dùng axiosClient gọi API
      const res = await axiosClient.get(`/users/${userId}`);
      const userData = res.data;
      
      setUser(userData);
      setFormData({
        fullName: userData.fullName || "",
        email: userData.email || "",
        avatarUrl: userData.avatarUrl || "",
      });
    } catch (err: any) {
      console.error("Lỗi tải profile:", err);
      toast({
        title: "Lỗi tải thông tin",
        description: "Không thể kết nối đến server.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fullName.trim()) {
      toast({
        title: "Lỗi",
        description: "Họ tên không được để trống!",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      
      // Gọi API cập nhật
      const res = await axiosClient.put(`/users/${userId}`, {
        fullName: formData.fullName,
        avatarUrl: formData.avatarUrl,
      });
      
      // Cập nhật lại localStorage để các component khác (như Header) nhận diện thay đổi
      if (storedUser) {
          const updatedUserLocal = { 
              ...storedUser, 
              fullName: formData.fullName, 
              avatarUrl: formData.avatarUrl 
          };
          localStorage.setItem("user", JSON.stringify(updatedUserLocal));
          
          // Dispatch event để báo hiệu cho các component khác (nếu cần)
          window.dispatchEvent(new Event("storage"));
      }
      
      // Cập nhật state nội bộ
      setUser(res.data);

      toast({
        title: "Cập nhật thành công!",
        description: "Thông tin cá nhân đã được lưu lại.",
      });
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Cập nhật thất bại",
        description: err.response?.data?.message || "Không thể lưu thay đổi.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";
  };

  if (loading)
    return (
      <Layout>
        <div className="p-20 text-center text-muted-foreground flex flex-col items-center">
          <Loader2 className="animate-spin h-8 w-8 mb-2" />
          Đang tải thông tin...
        </div>
      </Layout>
    );

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Hồ sơ cá nhân</h1>
          <p className="text-muted-foreground">
            Quản lý thông tin hiển thị của bạn
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Avatar Card */}
          <Card className="lg:col-span-1 shadow-sm">
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-32 w-32 mb-4 border-4 border-white shadow-lg">
                  <AvatarImage src={formData.avatarUrl} className="object-cover" />
                  <AvatarFallback className="text-3xl bg-gradient-to-br from-primary to-blue-600 text-white">
                    {getInitials(formData.fullName)}
                  </AvatarFallback>
                </Avatar>
                <h3 className="font-semibold text-xl mb-1">{formData.fullName}</h3>
                <p className="text-sm text-muted-foreground mb-4 break-all">{formData.email}</p>
                <div className="text-xs bg-secondary/20 text-secondary-foreground px-3 py-1 rounded-full">
                  Thành viên từ {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : '---'}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Form Card */}
          <div className="lg:col-span-2">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="h-5 w-5 text-primary" />
                  Thông tin chi tiết
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateProfile} className="space-y-5">
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
                      className="bg-muted text-muted-foreground cursor-not-allowed"
                    />
                    <p className="text-xs text-muted-foreground">Email không thể thay đổi.</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="avatarUrl">Đường dẫn ảnh đại diện (URL)</Label>
                    <Input
                      id="avatarUrl"
                      placeholder="https://example.com/my-photo.jpg"
                      value={formData.avatarUrl}
                      onChange={(e) =>
                        setFormData({ ...formData, avatarUrl: e.target.value })
                      }
                    />
                  </div>

                  <Button type="submit" className="w-full gradient-primary text-white" disabled={saving}>
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