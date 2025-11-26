import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Plus, Trash2, Pencil } from "lucide-react";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Budgets = () => {
  const [budgets, setBudgets] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editBudgetId, setEditBudgetId] = useState<number | null>(null);
  const [currentMonth] = useState(new Date().toISOString().slice(0, 7));
  const { toast } = useToast();

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [formData, setFormData] = useState({
    categoryId: "",
    limitAmount: "",
  });

  // ✅ Thêm state để hiển thị lỗi vào DOM
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const api = axios.create({
    baseURL: "http://localhost:8080/api",
    withCredentials: true,
  });

  const loadData = async () => {
    try {
      if (!user?.id) return;
      const [budgetsRes, categoriesRes] = await Promise.all([
        api.get(`/budgets`, { params: { userId: user.id } }),
        api.get(`/categories`, { params: { userId: user.id } }),
      ]);

      const monthBudgets = budgetsRes.data.filter(
        (b: any) => b.monthYear === currentMonth
      );

      setBudgets(monthBudgets);
      setCategories(categoriesRes.data);
    } catch (error) {
      toast({
        title: "Lỗi tải dữ liệu",
        description: "Không thể tải ngân sách hoặc danh mục.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    setErrorMessage(""); // reset lỗi cũ

    const amount = parseFloat(formData.limitAmount);

    // ✅ Bỏ trống
    if (!formData.limitAmount.trim()) {
      setErrorMessage("Vui lòng nhập số tiền ngân sách");
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập số tiền ngân sách",
        variant: "destructive",
      });
      return;
    }

    // ✅ Bằng 0
    if (isNaN(amount) || amount === 0) {
      setErrorMessage("Ngân sách phải lớn hơn 0");
      toast({
        title: "Lỗi",
        description: "Ngân sách phải lớn hơn 0",
        variant: "destructive",
      });
      return;
    }

    // ✅ Số âm
    if (amount < 0) {
      setErrorMessage("Số tiền không hợp lệ");
      toast({
        title: "Lỗi",
        description: "Số tiền không hợp lệ",
        variant: "destructive",
      });
      return;
    }

    try {
      if (isEditing && editBudgetId) {
        await api.put(`/budgets/${editBudgetId}`, {
          userId: user.id,
          categoryId: Number(formData.categoryId),
          monthYear: currentMonth,
          limitAmount: parseFloat(formData.limitAmount),
        });
        toast({ title: "Đã cập nhật ngân sách" });
      } else {
        const existing = budgets.find(
          (b) => b.categoryId === Number(formData.categoryId)
        );
        if (existing) {
          setErrorMessage("Ngân sách cho danh mục này đã tồn tại.");
          toast({
            title: "Lỗi",
            description: "Ngân sách cho danh mục này đã tồn tại.",
            variant: "destructive",
          });
          return;
        }
        await api.post(`/budgets`, {
          userId: user.id,
          categoryId: Number(formData.categoryId),
          monthYear: currentMonth,
          limitAmount: parseFloat(formData.limitAmount),
          spentAmount: 0,
        });
        toast({ title: "Thêm ngân sách thành công" });
      }

      setFormData({ categoryId: "", limitAmount: "" });
      setIsDialogOpen(false);
      setIsEditing(false);
      loadData();
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description:
          error.response?.data?.message ||
          (typeof error.response?.data === "string"
            ? error.response.data
            : "Không thể lưu ngân sách"),
        variant: "destructive",
      });
    }
  };

  const handleEdit = (budget: any) => {
    setIsEditing(true);
    setEditBudgetId(budget.id);
    setFormData({
      categoryId: budget.categoryId.toString(),
      limitAmount: budget.limitAmount.toString(),
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Bạn có chắc muốn xóa ngân sách này?")) {
      try {
        await api.delete(`/budgets/${id}`);
        toast({ title: "Đã xóa ngân sách" });
        loadData();
      } catch {
        toast({
          title: "Lỗi",
          description: "Không thể xóa ngân sách.",
          variant: "destructive",
        });
      }
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount || 0);
  };

  const getCategoryName = (categoryId: number) => {
    const category = categories.find((c) => c.id === categoryId);
    return category ? `${category.icon || "💰"} ${category.name}` : "Không xác định";
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Quản lý ngân sách</h1>
            <p className="text-muted-foreground">
              Tháng {new Date().getMonth() + 1}/{new Date().getFullYear()}
            </p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-white shadow-elegant">
                <Plus className="mr-2 h-4 w-4" />
                {isEditing ? "Chỉnh sửa" : "Thêm ngân sách"}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {isEditing ? "Cập nhật ngân sách" : "Thêm ngân sách mới"}
                </DialogTitle>
                <DialogDescription>
                  Đặt giới hạn chi tiêu cho danh mục trong tháng này
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Danh mục</Label>
                  <Select
                    value={formData.categoryId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, categoryId: value })
                    }
                    required
                    disabled={isEditing}
                  >
                    <SelectTrigger id="categoryDropdown">
                        <SelectValue placeholder="Chọn danh mục" />
                      </SelectTrigger>

                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem
                            key={cat.id}
                            data-testid={`category-${cat.id}`}
                            value={cat.id.toString()} >
                            {cat.icon} {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>

                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="limitAmount">Giới hạn chi tiêu</Label>
                  <Input
                    id="limitAmount"
                    type="number"
                    step="10000"
                    value={formData.limitAmount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        limitAmount: e.target.value,
                      })
                    }
                    placeholder="0"
                    required
                  />
                  {/* ✅ Hiển thị lỗi để Selenium kiểm tra */}
                  {errorMessage && (
                    <p className="text-red-500 text-sm mt-2" id="error-message">
                      {errorMessage}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full gradient-primary text-white"
                >
                  {isEditing ? "Cập nhật" : "Thêm ngân sách"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-4">
          {budgets.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <PiggyBank className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  Chưa có ngân sách nào
                </h3>
                <p className="text-muted-foreground mb-4">
                  Hãy bắt đầu đặt giới hạn chi tiêu cho từng danh mục
                </p>
                <Button
                  onClick={() => {
                    setIsDialogOpen(true);
                    setIsEditing(false);
                  }}
                  className="gradient-primary text-white"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Thêm ngân sách đầu tiên
                </Button>
              </CardContent>
            </Card>
          ) : (
            budgets.map((budget) => {
              const percentage =
                (budget.spentAmount / budget.limitAmount) * 100 || 0;
              return (
                <Card
                  key={budget.id}
                  className="hover:shadow-elegant transition-all"
                >
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-xl">
                        {getCategoryName(budget.categoryId)}
                      </CardTitle>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(budget)}
                        >
                          <Pencil className="h-4 w-4 text-primary" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(budget.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Đã chi</span>
                        <span className="font-semibold">
                          {formatCurrency(budget.spentAmount)} /{" "}
                          {formatCurrency(budget.limitAmount)}
                        </span>
                      </div>
                      <Progress value={Math.min(percentage, 100)} className="h-2" />
                      <div className="flex justify-between text-sm">
                        <span
                          className={
                            percentage >= 100
                              ? "text-destructive font-medium"
                              : "text-muted-foreground"
                          }
                        >
                          {percentage.toFixed(0)}% đã sử dụng
                        </span>
                        <span className="text-primary font-medium">
                          Còn lại:{" "}
                          {formatCurrency(
                            Math.max(0, budget.limitAmount - budget.spentAmount)
                          )}
                        </span>
                      </div>
                    </div>

                    {percentage >= 100 && (
                      <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm">
                        ⚠️ Bạn đã vượt quá ngân sách cho danh mục này!
                      </div>
                    )}
                    {percentage >= 80 && percentage < 100 && (
                      <div className="bg-yellow-100 text-yellow-800 p-3 rounded-lg text-sm">
                        ⚡ Cảnh báo: Bạn đã sử dụng hơn 80% ngân sách!
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Budgets;

const PiggyBank = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);
