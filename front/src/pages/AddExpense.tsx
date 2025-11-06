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

const AddExpense = () => {
  const { toast } = useToast();
  const navigate = useNavigate();


  const [formData, setFormData] = useState({
    storeName: "",
    categoryId: "",
    totalAmount: "",
    expenseDate: new Date().toISOString().split("T")[0],
    paymentMethod: "OTHER",
    note: "",
  });

  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const API_BASE = "http://localhost:8080/api";


  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userId = user?.id;

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await fetch(`${API_BASE}/categories?userId=${userId}`);
        if (!res.ok) throw new Error("Không thể tải danh mục.");
        const data = await res.json();
        setCategories(data);
      } catch (error) {
        toast({
          title: "Lỗi tải danh mục",
          description: "Không thể tải danh mục chi tiêu.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    if (userId) loadCategories();
  }, [userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId) {
      toast({
        title: "Bạn chưa đăng nhập",
        description: "Vui lòng đăng nhập để thêm chi tiêu.",
        variant: "destructive",
      });
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId,
          categoryId: formData.categoryId ? parseInt(formData.categoryId) : null,
          storeName: formData.storeName,
          totalAmount: parseFloat(formData.totalAmount),
          paymentMethod: formData.paymentMethod,
          note: formData.note,
          expenseDate: formData.expenseDate,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        try {
          const json = JSON.parse(text);
          throw new Error(json?.message || json?.error || text || "Không thể thêm chi tiêu");
        } catch {
          throw new Error(text || "Không thể thêm chi tiêu");
        }
      }


      toast({
        title: "Thành công!",
        description: "Khoản chi tiêu đã được thêm.",
      });

      navigate("/expenses");
    } catch (error: any) {
      toast({
        title: "Lỗi thêm chi tiêu",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Thêm chi tiêu mới</h1>
          <p className="text-muted-foreground">
            Ghi lại khoản chi tiêu của bạn hôm nay
          </p>
        </div>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Thông tin chi tiêu</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="storeName">Tên cửa hàng / mô tả</Label>
                <Input
                  id="storeName"
                  value={formData.storeName}
                  onChange={(e) =>
                    setFormData({ ...formData, storeName: e.target.value })
                  }
                  placeholder="VD: Siêu thị Coopmart, quán cà phê..."
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Danh mục</Label>
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
                    {loading ? (
                      <p className="p-2 text-sm text-muted-foreground">
                        Đang tải danh mục...
                      </p>
                    ) : categories.length === 0 ? (
                      <p className="p-2 text-sm text-muted-foreground">
                        Chưa có danh mục nào
                      </p>
                    ) : (
                      categories.map((cat) => (
                        <SelectItem key={cat.id} value={String(cat.id)}>
                          {cat.icon ? `${cat.icon} ` : ""} {cat.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Ngày chi tiêu</Label>
                  <Input
                    type="date"
                    value={formData.expenseDate}
                    onChange={(e) =>
                      setFormData({ ...formData, expenseDate: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Số tiền</Label>
                  <Input
                    type="number"
                    step="1000"
                    min="0"
                    value={formData.totalAmount}
                    onChange={(e) =>
                      setFormData({ ...formData, totalAmount: e.target.value })
                    }
                    placeholder="VD: 200000"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Phương thức thanh toán</Label>
                <Select
                  value={formData.paymentMethod}
                  onValueChange={(value) =>
                    setFormData({ ...formData, paymentMethod: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">Tiền mặt</SelectItem>
                    <SelectItem value="CREDIT_CARD">Thẻ tín dụng</SelectItem>
                    <SelectItem value="BANK_TRANSFER">Chuyển khoản</SelectItem>
                    <SelectItem value="E_WALLET">Ví điện tử</SelectItem>
                    <SelectItem value="OTHER">Khác</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Ghi chú (tùy chọn)</Label>
                <Textarea
                  value={formData.note}
                  onChange={(e) =>
                    setFormData({ ...formData, note: e.target.value })
                  }
                  placeholder="VD: Mua đồ ăn sáng, cà phê sáng..."
                  rows={3}
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/expenses")}
                  className="flex-1"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  className="flex-1 gradient-primary text-white shadow-elegant"
                >
                  Thêm chi tiêu
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
