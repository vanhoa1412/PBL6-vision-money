import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useParams } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import axiosClient from "@/lib/axios-client";
import { RefreshCw, Save, X } from "lucide-react";

const EditExpense = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { id } = useParams(); 

  const [formData, setFormData] = useState({
    storeName: "",
    categoryId: "",
    totalAmount: "",
    expenseDate: "",
    paymentMethod: "CASH",
    note: "",
  });

  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    if (!user.id) {
      navigate("/login");
      return;
    }

    if (id) {
      loadData();
    }
  }, [user.id, id]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [categoriesRes, expenseRes] = await Promise.all([
        axiosClient.get(`/categories`, { params: { userId: user.id } }),
        axiosClient.get(`/expenses/${id}`),
      ]);

      setCategories(categoriesRes.data);

      const e = expenseRes.data;
      setFormData({
        storeName: e.storeName || "",
        categoryId: e.categoryId ? String(e.categoryId) : "",
        totalAmount: e.totalAmount ? String(e.totalAmount) : "",
        expenseDate: e.expenseDate || new Date().toISOString().split("T")[0],
        paymentMethod: e.paymentMethod || "CASH",
        note: e.note || "",
      });

    } catch (error: any) {
      console.error("Lỗi tải dữ liệu:", error);
      toast({
        title: "Không tìm thấy chi tiêu",
        description: "Khoản chi tiêu này có thể đã bị xóa.",
        variant: "destructive",
      });
      navigate("/expenses");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user.id) return;

    const amount = parseFloat(formData.totalAmount);
    if (isNaN(amount) || amount <= 0) {
        toast({
            title: "Lỗi dữ liệu",
            description: "Số tiền phải lớn hơn 0.",
            variant: "destructive",
        });
        return;
    }
    if (!formData.categoryId) {
        toast({
            title: "Lỗi dữ liệu",
            description: "Vui lòng chọn danh mục.",
            variant: "destructive",
        });
        return;
    }

    try {
      setIsSubmitting(true);

      await axiosClient.put(`/expenses/${id}`, {
        userId: user.id,
        categoryId: Number(formData.categoryId),
        storeName: formData.storeName,
        totalAmount: amount,
        paymentMethod: formData.paymentMethod,
        note: formData.note,
        expenseDate: formData.expenseDate,
      });

      toast({
        title: "Cập nhật thành công!",
        description: "Thông tin chi tiêu đã được lưu lại.",
      });
      
      navigate("/expenses");

    } catch (error: any) {
      console.error("Lỗi cập nhật:", error);
      const msg = error.response?.data?.message || error.response?.data || "Có lỗi xảy ra khi cập nhật.";
      
      toast({
        title: "Lỗi cập nhật",
        description: typeof msg === "string" ? msg : "Vui lòng thử lại sau.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading)
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
            <RefreshCw className="h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground">Đang tải dữ liệu...</p>
        </div>
      </Layout>
    );

  return (
    <Layout>
      <div className="max-w-2xl mx-auto p-4 md:p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Chỉnh sửa chi tiêu</h1>
          <p className="text-muted-foreground">
            Cập nhật thông tin chi tiêu ID: #{id}
          </p>
        </div>

        <Card className="shadow-md border-2">
          <CardHeader>
            <CardTitle>Thông tin chi tiết</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Tên cửa hàng */}
              <div className="space-y-2">
                <Label htmlFor="storeName">Tên cửa hàng / Nội dung <span className="text-red-500">*</span></Label>
                <Input
                  id="storeName"
                  value={formData.storeName}
                  onChange={(e) =>
                    setFormData({ ...formData, storeName: e.target.value })
                  }
                  placeholder="VD: Siêu thị, Tiền nhà..."
                  required
                />
              </div>

              {/* Danh mục */}
              <div className="space-y-2">
                <Label>Danh mục <span className="text-red-500">*</span></Label>
                <Select
                  value={formData.categoryId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, categoryId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn danh mục" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={String(cat.id)}>
                        {cat.icon} {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Ngày và Tiền */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Ngày chi tiêu <span className="text-red-500">*</span></Label>
                  <Input
                    type="date"
                    value={formData.expenseDate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        expenseDate: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Số tiền (VNĐ) <span className="text-red-500">*</span></Label>
                  <Input
                    type="number"
                    min="0"
                    step="1000"
                    value={formData.totalAmount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        totalAmount: e.target.value,
                      })
                    }
                    required
                  />
                </div>
              </div>

              {/* Phương thức thanh toán */}
              <div className="space-y-2">
                <Label>Phương thức thanh toán</Label>
                <Select
                  value={formData.paymentMethod}
                  onValueChange={(value) =>
                    setFormData({ ...formData, paymentMethod: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn phương thức" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">💵 Tiền mặt</SelectItem>
                    <SelectItem value="CREDIT_CARD">💳 Thẻ tín dụng</SelectItem>
                    <SelectItem value="BANK_TRANSFER">🏦 Chuyển khoản</SelectItem>
                    <SelectItem value="E_WALLET">📱 Ví điện tử</SelectItem>
                    <SelectItem value="OTHER">⚪ Khác</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Ghi chú */}
              <div className="space-y-2">
                <Label htmlFor="note">Ghi chú (tùy chọn)</Label>
                <Textarea
                  id="note"
                  value={formData.note}
                  onChange={(e) =>
                    setFormData({ ...formData, note: e.target.value })
                  }
                  placeholder="Thêm ghi chú chi tiết..."
                  rows={3}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/expenses")}
                  className="flex-1 flex items-center gap-2"
                  disabled={isSubmitting}
                >
                  <X className="h-4 w-4" /> Hủy bỏ
                </Button>
                <Button 
                    type="submit" 
                    className="flex-1 gradient-primary text-white flex items-center gap-2"
                    disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                        <RefreshCw className="h-4 w-4 animate-spin" /> Đang lưu...
                    </>
                  ) : (
                    <>
                        <Save className="h-4 w-4" /> Lưu thay đổi
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default EditExpense;