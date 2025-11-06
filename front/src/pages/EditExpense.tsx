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

const EditExpense = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { id } = useParams(); // lấy id từ URL

  const [formData, setFormData] = useState({
    store_name: "",
    category_id: "",
    total_amount: "",
    expense_date: "",
    payment_method: "CASH",
    note: "",
  });

  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const API_BASE = "http://localhost:8080/api";

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (!user.id) {
      toast({
        title: "Bạn chưa đăng nhập",
        description: "Vui lòng đăng nhập để chỉnh sửa chi tiêu.",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    loadExpense(user.id);
    loadCategories(user.id);
  }, []);

  const loadCategories = async (userId: number) => {
    try {
      const res = await fetch(`${API_BASE}/categories?userId=${userId}`);
      const data = await res.json();
      setCategories(data);
    } catch {
      toast({
        title: "Lỗi tải danh mục",
        variant: "destructive",
      });
    }
  };

  const loadExpense = async (userId: number) => {
    try {
      const res = await fetch(`${API_BASE}/expenses/${id}`);
      if (!res.ok) throw new Error("Không tìm thấy chi tiêu");
      const e = await res.json();

      setFormData({
        store_name: e.storeName || "",
        category_id: e.categoryId ? String(e.categoryId) : "",
        total_amount: e.totalAmount ? String(e.totalAmount) : "",
        expense_date: e.expenseDate || "",
        payment_method: e.paymentMethod || "CASH",
        note: e.note || "",
    });

    } catch (error: any) {
      toast({
        title: "Lỗi tải chi tiêu",
        description: error.message,
        variant: "destructive",
      });
      navigate("/expenses");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (!user.id) return;

    try {
      const res = await fetch(`${API_BASE}/expenses/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            userId: user.id,
            categoryId: formData.category_id ? parseInt(formData.category_id) : null,
            storeName: formData.store_name,
            totalAmount: parseFloat(formData.total_amount),
            paymentMethod: formData.payment_method,
            note: formData.note,
            expenseDate: formData.expense_date,
            }),
        });


      if (!res.ok) {
        const text = await res.text();
        try {
          const json = JSON.parse(text);
          throw new Error(json?.message || json?.error || text || "Không thể cập nhật chi tiêu");
        } catch {
          throw new Error(text || "Không thể cập nhật chi tiêu");
        }
      }


      toast({
        title: "Cập nhật thành công!",
        description: "Chi tiêu đã được lưu lại.",
      });
      navigate("/expenses");
    } catch (error: any) {
      toast({
        title: "Lỗi cập nhật",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading)
    return (
      <Layout>
        <p className="text-center text-muted-foreground">Đang tải dữ liệu...</p>
      </Layout>
    );

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Chỉnh sửa chi tiêu</h1>
          <p className="text-muted-foreground">
            Cập nhật thông tin chi tiêu đã chọn
          </p>
        </div>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Thông tin chi tiêu</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <Label>Tên cửa hàng / mô tả</Label>
                <Input
                  value={formData.store_name}
                  onChange={(e) =>
                    setFormData({ ...formData, store_name: e.target.value })
                  }
                />
              </div>

              <div>
                <Label>Danh mục</Label>
                <Select
                  value={formData.category_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, category_id: value })
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Ngày chi tiêu</Label>
                  <Input
                    type="date"
                    value={formData.expense_date}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        expense_date: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Số tiền</Label>
                  <Input
                    type="number"
                    value={formData.total_amount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        total_amount: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div>
                <Label>Ghi chú</Label>
                <Textarea
                  value={formData.note}
                  onChange={(e) =>
                    setFormData({ ...formData, note: e.target.value })
                  }
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
                <Button type="submit" className="flex-1 gradient-primary">
                  Lưu thay đổi
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
