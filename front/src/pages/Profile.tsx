import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Loader2, Mail, Calendar, LogOut, Camera, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import axiosClient from "@/lib/axios-client";
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();
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
      
      // Cập nhật lại localStorage & Dispatch Event
      if (storedUser) {
          const updatedUserLocal = { 
              ...storedUser, 
              fullName: formData.fullName, 
              avatarUrl: formData.avatarUrl 
          };
          localStorage.setItem("user", JSON.stringify(updatedUserLocal));
          window.dispatchEvent(new Event("storage"));
      }
      
      setUser(res.data);
      toast({ title: "Cập nhật thành công!", description: "Thông tin cá nhân đã được lưu lại." });
    } catch (err: any) {
      toast({
        title: "Cập nhật thất bại",
        description: err.response?.data?.message || "Không thể lưu thay đổi.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    if (confirm("Bạn có chắc chắn muốn đăng xuất?")) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login"; // Force reload to clear states
    }
  };

  const getInitials = (name: string) => {
    return name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "U";
  };

  if (loading)
    return (
      <Layout>
        <div className="h-[60vh] flex flex-col justify-center items-center text-muted-foreground">
          <Loader2 className="animate-spin h-10 w-10 mb-4 text-primary" />
          <p>Đang tải hồ sơ...</p>
        </div>
      </Layout>
    );

  return (
    <Layout>
      <div className="max-w-5xl mx-auto p-4 md:p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Hồ sơ cá nhân</h1>
          <p className="text-muted-foreground">Quản lý thông tin tài khoản và cài đặt bảo mật</p>
        </div>

        <div className="grid lg:grid-cols-12 gap-6">
          
          {/* --- CỘT TRÁI: THẺ INFO & AVATAR --- */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="overflow-hidden shadow-md border-0">
                {/* Banner Gradient giả lập ảnh bìa */}
                <div className="h-24 bg-gradient-to-r from-blue-600 to-indigo-600 relative"></div>
                
                <CardContent className="pt-0 px-6 pb-6 relative text-center">
                    {/* Avatar đè lên Banner */}
                    <div className="relative inline-block -mt-12 mb-3">
                        <Avatar className="h-28 w-28 border-4 border-white shadow-lg">
                            <AvatarImage src={formData.avatarUrl} className="object-cover" />
                            <AvatarFallback className="text-2xl bg-gray-100 text-gray-600">
                                {getInitials(formData.fullName)}
                            </AvatarFallback>
                        </Avatar>
                        {/* Nút nhỏ chỉnh sửa avatar (Trang trí) */}
                        <div className="absolute bottom-0 right-0 bg-white p-1.5 rounded-full shadow border cursor-pointer hover:bg-gray-100 text-gray-600" title="Đổi ảnh">
                             <Camera className="h-4 w-4" />
                        </div>
                    </div>

                    <h2 className="text-xl font-bold text-gray-900">{formData.fullName}</h2>
                    <p className="text-sm text-muted-foreground mb-4">Thành viên</p>

                    <div className="space-y-3 text-sm text-left bg-muted/30 p-4 rounded-lg border">
                         <div className="flex items-center gap-3">
                            <Mail className="h-4 w-4 text-primary" />
                            <span className="truncate" title={formData.email}>{formData.email}</span>
                         </div>
                         <div className="flex items-center gap-3">
                            <Calendar className="h-4 w-4 text-primary" />
                            <span>Tham gia: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : '---'}</span>
                         </div>
                    </div>

                    <Button 
                        variant="destructive" 
                        className="w-full mt-6 shadow-sm" 
                        onClick={handleLogout}
                    >
                        <LogOut className="h-4 w-4 mr-2" /> Đăng xuất
                    </Button>
                </CardContent>
            </Card>
          </div>

          {/* --- CỘT PHẢI: FORM CHỈNH SỬA --- */}
          <div className="lg:col-span-8">
            <Card className="shadow-md border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Cập nhật thông tin
                </CardTitle>
                <CardDescription>
                    Thay đổi thông tin hiển thị của bạn trên hệ thống.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Họ và tên</Label>
                        <Input
                          id="fullName"
                          value={formData.fullName}
                          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                          placeholder="Nhập họ tên đầy đủ"
                          className="bg-background"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email đăng nhập</Label>
                        <Input 
                          id="email"
                          value={formData.email} 
                          disabled 
                          className="bg-muted text-muted-foreground cursor-not-allowed"
                        />
                      </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="avatarUrl">Ảnh đại diện (URL)</Label>
                    <div className="flex gap-2">
                        <Input
                            id="avatarUrl"
                            placeholder="https://example.com/anh-cua-ban.jpg"
                            value={formData.avatarUrl}
                            onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
                        />
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                        Bạn có thể dán đường dẫn ảnh từ Facebook, Google Photos hoặc các trang lưu trữ ảnh.
                    </p>
                  </div>

                  <div className="flex justify-end pt-2">
                      <Button type="submit" className="gradient-primary text-white min-w-[140px] shadow-lg" disabled={saving}>
                        {saving ? (
                            <><Loader2 className="animate-spin h-4 w-4 mr-2" /> Đang lưu...</>
                        ) : (
                            <><Save className="h-4 w-4 mr-2" /> Lưu thay đổi</>
                        )}
                      </Button>
                  </div>
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