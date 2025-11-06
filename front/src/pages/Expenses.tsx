import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Search, Trash2, Edit, Receipt, Tag, FileText } from "lucide-react"; // 🟢 Thêm FileText
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Expense {
  id: number;
  userId: number;
  categoryId?: number;
  storeName?: string;
  totalAmount: number;
  note?: string;
  expenseDate: string;
  createdAt?: string;
}

interface Category {
  id: number;
  name: string;
  icon?: string;
}

const Expenses = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  const API_BASE = "http://localhost:8080/api";

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      navigate("/login");
      toast({
        title: "Cần đăng nhập",
        description: "Vui lòng đăng nhập để xem chi tiêu.",
        variant: "destructive",
      });
      return;
    }

    const user = JSON.parse(storedUser);
    loadData(user.id);
  }, []);

  const loadData = async (userId: number) => {
    try {
      setLoading(true);
      const [expRes, catRes] = await Promise.all([
        fetch(`${API_BASE}/expenses?userId=${userId}`),
        fetch(`${API_BASE}/categories?userId=${userId}`),
      ]);

      if (!expRes.ok || !catRes.ok) throw new Error("Lỗi tải dữ liệu từ server");

      const expenseData = await expRes.json();
      const categoryData = await catRes.json();

      const normalizedExpenses = expenseData.map((e: any) => ({
        id: e.id,
        userId: e.userId,
        categoryId: e.categoryId,
        storeName: e.storeName,
        totalAmount: e.totalAmount,
        note: e.note,
        expenseDate: e.expenseDate,
        createdAt: e.createdAt,
      }));

      setExpenses(normalizedExpenses);
      setCategories(categoryData);
    } catch (error: any) {
      toast({
        title: "Lỗi tải dữ liệu",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc muốn xóa khoản chi tiêu này?")) return;
    try {
      const res = await fetch(`${API_BASE}/expenses/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Xóa thất bại");
      toast({ title: "Đã xóa", description: "Khoản chi tiêu đã được xóa." });
      const user = JSON.parse(localStorage.getItem("user")!);
      loadData(user.id);
    } catch (error: any) {
      toast({
        title: "Lỗi xóa chi tiêu",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      minimumFractionDigits: 0,
    }).format(amount || 0);

  const formatDate = (dateString: string) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "—";
    return date.toLocaleDateString("vi-VN");
  };

  const getCategoryName = (categoryId?: number) => {
    if (!categoryId) return "Chưa phân loại";
    const cat = categories.find((c) => c.id === categoryId);
    return cat ? `${cat.icon || ""} ${cat.name}` : "Chưa phân loại";
  };

  const filteredExpenses = expenses.filter((expense) => {
    const matchesSearch =
      expense.note?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false;
    const matchesCategory =
      selectedCategory === "all" ||
      String(expense.categoryId) === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Quản lý chi tiêu</h1>
            <p className="text-muted-foreground">
              Tổng cộng: {filteredExpenses.length} khoản chi
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Nút Search */}
            <Button
              asChild
              variant="outline"
              className="flex items-center gap-2"
            >
              <Link to="/search">
                <Search className="h-4 w-4" />
                Tìm kiếm
              </Link>
            </Button>

            {/* Nút Fill */}
            <Button
              asChild
              variant="outline"
              className="flex items-center gap-2"
            >
              <Link to="/fill">
                <FileText className="h-4 w-4" />
                Nhập nhanh
              </Link>
            </Button>

            {/* Nút Danh mục */}
            <Button asChild variant="outline">
              <Link to="/categories" className="flex items-center">
                <Tag className="mr-2 h-4 w-4" />
                Danh mục
              </Link>
            </Button>

            {/* Nút Thêm chi tiêu */}
            <Button asChild className="gradient-primary text-white shadow-elegant">
              <Link to="/expenses/add">
                <Plus className="mr-2 h-4 w-4" />
                Thêm chi tiêu
              </Link>
            </Button>
          </div>
        </div>

        {/* Bộ lọc */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm theo ghi chú..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Lọc theo danh mục" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả danh mục</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={String(cat.id)}>
                      {cat.icon} {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Danh sách chi tiêu */}
        {loading ? (
          <p className="text-center text-muted-foreground">Đang tải dữ liệu...</p>
        ) : filteredExpenses.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Chưa có chi tiêu nào</h3>
              <p className="text-muted-foreground mb-4">
                Bắt đầu ghi lại các khoản chi tiêu của bạn
              </p>
              <Button asChild className="gradient-primary text-white">
                <Link to="/expenses/add">
                  <Plus className="mr-2 h-4 w-4" />
                  Thêm chi tiêu đầu tiên
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredExpenses.map((expense) => (
            <Card key={expense.id} className="hover:shadow-elegant transition-all mb-3">
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg">
                        {getCategoryName(expense.categoryId)}
                      </h3>
                      <Badge variant="outline">
                        {formatDate(expense.expenseDate)}
                      </Badge>
                    </div>
                    {expense.note && (
                      <p className="text-sm text-muted-foreground">
                        🏪 {expense.storeName || "Không rõ"} — 📝 {expense.note}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <p className="text-2xl font-bold text-primary">
                      {formatCurrency(expense.totalAmount)}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/expenses/edit/${expense.id}`)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(expense.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </Layout>
  );
};

export default Expenses;
