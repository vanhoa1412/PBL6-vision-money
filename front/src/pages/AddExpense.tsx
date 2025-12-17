import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Save, X } from "lucide-react";
import axiosClient from "@/lib/axios-client";

interface Category {
  id: number;
  name: string;
  icon?: string;
}

const AddExpense = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    storeName: "",
    categoryId: "",
    totalAmount: "",
    expenseDate: new Date().toISOString().split("T")[0],
    paymentMethod: "CASH",
    note: "",
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userId = user?.id;

  useEffect(() => {
    const loadCategories = async () => {
      if (!userId) return;
      
      try {
        setIsLoadingCategories(true);
        const res = await axiosClient.get(`/categories`, {
          params: { userId }
        });
        setCategories(res.data);
      } catch (error) {
        console.error("Lỗi tải danh mục:", error);
        toast({
          title: "Lỗi kết nối",
          description: "Không thể tải danh mục chi tiêu.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingCategories(false);
      }
    };

    if (userId) {
      loadCategories();
    } else {
      navigate("/login");
    }
  }, [userId, navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId) {
      toast({
        title: "Lỗi xác thực",
        description: "Vui lòng đăng nhập lại để thực hiện thao tác này.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.storeName.trim()) {
      toast({ title: "Thiếu thông tin", description: "Vui lòng nhập tên cửa hàng hoặc mô tả.", variant: "destructive" });
      return;
    }
    if (!formData.categoryId) {
      toast({ title: "Thiếu thông tin", description: "Vui lòng chọn một danh mục.", variant: "destructive" });
      return;
    }
    const amount = parseFloat(formData.totalAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: "Số tiền không hợp lệ", description: "Số tiền phải lớn hơn 0.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);

    try {
      await axiosClient.post(`/expenses`, {
        userId: userId,
        categoryId: parseInt(formData.categoryId),
        storeName: formData.storeName,
        totalAmount: amount,
        paymentMethod: formData.paymentMethod,
        note: formData.note,
        expenseDate: formData.expenseDate,
      });

      toast({
        title: "Thành công!",
        description: "Khoản chi tiêu đã được ghi lại.",
      });

      navigate("/expenses");

    } catch (error: any) {
      console.error("Lỗi thêm chi tiêu:", error);
      const errorMessage = error.response?.data || "Đã có lỗi xảy ra. Vui lòng thử lại.";
      
      toast({
        title: "Thêm thất bại",
        description: typeof errorMessage === 'string' ? errorMessage : "Lỗi server không xác định",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto p-4 md:p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2 text-foreground">Thêm chi tiêu mới</h1>
          <p className="text-muted-foreground">
            Ghi lại chi tiết khoản chi tiêu của bạn để theo dõi ngân sách hiệu quả hơn.
          </p>
        </div>

        <Card className="shadow-md border border-border">
          <CardHeader className="border-b bg-muted/20">
            <CardTitle>Thông tin chi tiêu</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Tên cửa hàng */}
              <div className="space-y-2">
                <Label htmlFor="storeName" className="text-sm font-medium">
                  Tên cửa hàng / Nội dung chi <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="storeName"
                  value={formData.storeName}
                  onChange={(e) =>
                    setFormData({ ...formData, storeName: e.target.value })
                  }
                  placeholder="VD: Siêu thị Coopmart, Cà phê Highland..."
                  className="bg-background"
                  required
                  disabled={isSubmitting}
                />
              </div>

              {/* Danh mục */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Danh mục <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.categoryId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, categoryId: value })
                  }
                  disabled={isSubmitting || isLoadingCategories}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder={isLoadingCategories ? "Đang tải danh mục..." : "Chọn danh mục chi tiêu"} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.length === 0 && !isLoadingCategories ? (
                      <div className="p-2 text-sm text-muted-foreground text-center">Chưa có danh mục nào</div>
                    ) : (
                      categories.map((cat) => (
                        <SelectItem key={cat.id} value={String(cat.id)}>
                          <span className="flex items-center gap-2">
                            <span>{cat.icon || "🏷️"}</span>
                            <span>{cat.name}</span>
                          </span>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Grid: Ngày & Số tiền */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Ngày chi tiêu <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="date"
                    value={formData.expenseDate}
                    onChange={(e) =>
                      setFormData({ ...formData, expenseDate: e.target.value })
                    }
                    className="bg-background"
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Số tiền (VNĐ) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="number"
                    step="1000"
                    min="0"
                    value={formData.totalAmount}
                    onChange={(e) =>
                      setFormData({ ...formData, totalAmount: e.target.value })
                    }
                    placeholder="VD: 50000"
                    className="bg-background"
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Phương thức thanh toán */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Phương thức thanh toán</Label>
                <Select
                  value={formData.paymentMethod}
                  onValueChange={(value) =>
                    setFormData({ ...formData, paymentMethod: value })
                  }
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue />
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
                <Label className="text-sm font-medium">Ghi chú (tùy chọn)</Label>
                <Textarea
                  value={formData.note}
                  onChange={(e) =>
                    setFormData({ ...formData, note: e.target.value })
                  }
                  placeholder="Ghi chú thêm về khoản chi này..."
                  rows={3}
                  className="bg-background resize-none"
                  disabled={isSubmitting}
                />
              </div>

              {/* Buttons Actions */}
              <div className="flex gap-4 pt-4 border-t mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/expenses")}
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  <X className="mr-2 h-4 w-4" /> Hủy
                </Button>
                <Button
                  type="submit"
                  className="flex-1 gradient-primary text-white shadow-elegant hover:shadow-lg transition-all"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang lưu...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" /> Lưu chi tiêu
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

export default AddExpense;