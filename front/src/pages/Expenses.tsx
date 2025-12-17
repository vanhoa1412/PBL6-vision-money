import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Link, useNavigate } from "react-router-dom";
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit, 
  Receipt, 
  Tag, 
  FileText, 
  RefreshCw,
  Calendar
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import axiosClient from "@/lib/axios-client";

interface Expense {
  id: number;
  userId: number;
  categoryId?: number;
  storeName?: string;
  totalAmount: number;
  paymentMethod?: string;
  note?: string;
  expenseDate: string;
  createdAt?: string;
}

interface Category {
  id: number;
  name: string;
  icon?: string;
  colorHex?: string;
}

const Expenses = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  
  const { toast } = useToast();
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user?.id]);


  const loadData = async () => {
    try {
      setLoading(true);
      
      const [expRes, catRes] = await Promise.all([
        axiosClient.get(`/expenses`, { params: { userId: user.id } }),
        axiosClient.get(`/categories`, { params: { userId: user.id } }),
      ]);

      const sortedExpenses = (expRes.data as Expense[]).sort((a, b) => 
        new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime()
      );

      setExpenses(sortedExpenses);
      setCategories(catRes.data);
    } catch (error: any) {
      console.error("Load data error:", error);
      toast({
        title: "Lỗi tải dữ liệu",
        description: "Không thể lấy danh sách chi tiêu. Vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa khoản chi tiêu này không?")) return;

    try {
      setIsDeleting(id); 
      await axiosClient.delete(`/expenses/${id}`);
      
      toast({ 
        title: "Đã xóa thành công", 
        description: "Khoản chi tiêu đã được loại bỏ khỏi danh sách." 
      });
      
      setExpenses((prev) => prev.filter((e) => e.id !== id));
    } catch (error: any) {
      toast({
        title: "Lỗi xóa chi tiêu",
        description: error.response?.data?.message || "Có lỗi xảy ra khi xóa.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(null);
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
    return date.toLocaleDateString("vi-VN", { 
      weekday: 'short', 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    });
  };

  const getCategoryInfo = (categoryId?: number) => {
    if (!categoryId) return { name: "Chưa phân loại", icon: "📦", color: "#64748b" };
    const cat = categories.find((c) => c.id === categoryId);
    return cat 
      ? { name: cat.name, icon: cat.icon || "🏷️", color: cat.colorHex || "#3b82f6" }
      : { name: "Đã xóa", icon: "❓", color: "#94a3b8" };
  };

  
  const filteredExpenses = expenses.filter((expense) => {
    const term = searchTerm.toLowerCase();
    
    const matchesSearch =
      (expense.note?.toLowerCase() || "").includes(term) ||
      (expense.storeName?.toLowerCase() || "").includes(term);
    
    const matchesCategory =
      selectedCategory === "all" ||
      String(expense.categoryId) === selectedCategory;
      
    return matchesSearch && matchesCategory;
  });

  const totalDisplayAmount = filteredExpenses.reduce((sum, item) => sum + item.totalAmount, 0);

  return (
    <Layout>
      <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
        
        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Quản lý chi tiêu</h1>
            <p className="text-muted-foreground mt-1">
              Danh sách chi tiết các giao dịch của bạn
            </p>
          </div>

          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            {/* Các nút chức năng phụ */}
            <Button asChild variant="outline" size="sm" className="flex-1 md:flex-none">
              <Link to="/search">
                <Search className="mr-2 h-4 w-4" /> Tìm kiếm
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="flex-1 md:flex-none">
              <Link to="/fill">
                <FileText className="mr-2 h-4 w-4" /> Lọc & Điền
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="flex-1 md:flex-none">
              <Link to="/categories">
                <Tag className="mr-2 h-4 w-4" /> Danh mục
              </Link>
            </Button>
            
            {/* Nút Thêm mới chính */}
            <Button asChild className="gradient-primary text-white shadow-lg flex-1 md:flex-none min-w-[140px]">
              <Link to="/expenses/add">
                <Plus className="mr-2 h-4 w-4" /> Thêm mới
              </Link>
            </Button>
          </div>
        </div>

        {/* --- FILTER BAR --- */}
        <Card className="border shadow-sm">
          <CardContent className="p-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            
            {/* Search Input */}
            <div className="md:col-span-5 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm theo tên quán, ghi chú..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category Filter */}
            <div className="md:col-span-4">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Tất cả danh mục" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">📁 Tất cả danh mục</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={String(cat.id)}>
                      <span className="flex items-center gap-2">
                        <span>{cat.icon}</span> {cat.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Refresh Button & Summary */}
            <div className="md:col-span-3 flex justify-between md:justify-end items-center gap-2">
               <div className="text-right hidden md:block">
                  <span className="text-xs text-muted-foreground block">Tổng hiển thị</span>
                  <span className="font-bold text-primary">{formatCurrency(totalDisplayAmount)}</span>
               </div>
               <Button variant="ghost" size="icon" onClick={loadData} title="Làm mới dữ liệu">
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
               </Button>
            </div>
          </CardContent>
        </Card>

        {/* --- EXPENSE LIST --- */}
        <div className="space-y-3">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6 h-24 bg-muted/20" />
              </Card>
            ))
          ) : filteredExpenses.length === 0 ? (
            <Card className="border-dashed border-2 bg-muted/5">
              <CardContent className="p-12 text-center flex flex-col items-center justify-center">
                <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
                  <Receipt className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-1">Không tìm thấy chi tiêu nào</h3>
                <p className="text-muted-foreground mb-6 max-w-sm">
                  {searchTerm || selectedCategory !== 'all' 
                    ? "Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm của bạn." 
                    : "Bạn chưa ghi lại khoản chi tiêu nào. Hãy bắt đầu ngay!"}
                </p>
                <Button asChild className="gradient-primary text-white">
                  <Link to="/expenses/add">
                    <Plus className="mr-2 h-4 w-4" /> Thêm chi tiêu đầu tiên
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredExpenses.map((expense) => {
              const category = getCategoryInfo(expense.categoryId);
              
              return (
                <Card key={expense.id} className="group hover:shadow-md transition-all duration-200 border hover:border-primary/30">
                  <CardContent className="p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    
                    {/* Left Section: Icon & Info */}
                    <div className="flex items-start gap-4 flex-1">
                      {/* Icon Box */}
                      <div 
                        className="h-12 w-12 rounded-xl flex items-center justify-center text-2xl shrink-0 shadow-sm"
                        style={{ backgroundColor: `${category.color}20`, color: category.color }}
                      >
                        {category.icon}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-base text-foreground line-clamp-1">
                            {category.name}
                          </h3>
                          <Badge variant="secondary" className="text-xs font-normal bg-muted text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(expense.expenseDate)}
                          </Badge>
                        </div>
                        
                        <div className="text-sm text-muted-foreground flex flex-col">
                          {expense.storeName && (
                            <span className="font-medium text-foreground/80">
                              {expense.storeName}
                            </span>
                          )}
                          {expense.note && (
                            <span className="italic text-xs mt-0.5 line-clamp-1">
                              "{expense.note}"
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right Section: Amount & Actions */}
                    <div className="flex items-center justify-between w-full sm:w-auto gap-6 pl-16 sm:pl-0">
                      <div className="text-right">
                        <div className="text-lg font-bold text-primary">
                          {formatCurrency(expense.totalAmount)}
                        </div>
                        {expense.paymentMethod && (
                          <div className="text-xs text-muted-foreground uppercase tracking-wider">
                            {expense.paymentMethod === 'CREDIT_CARD' ? 'Thẻ tín dụng' : 
                             expense.paymentMethod === 'E_WALLET' ? 'Ví điện tử' :
                             expense.paymentMethod === 'BANK_TRANSFER' ? 'Chuyển khoản' :
                             expense.paymentMethod === 'CASH' ? 'Tiền mặt' : expense.paymentMethod}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 hover:text-blue-600 hover:bg-blue-50"
                          onClick={() => navigate(`/expenses/edit/${expense.id}`)}
                          title="Chỉnh sửa"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 hover:text-red-600 hover:bg-red-50"
                          onClick={() => handleDelete(expense.id)}
                          disabled={isDeleting === expense.id}
                          title="Xóa"
                        >
                          {isDeleting === expense.id ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
        
        {/* Footer Summary */}
        {!loading && filteredExpenses.length > 0 && (
           <div className="text-center text-sm text-muted-foreground pt-4 border-t">
              Hiển thị {filteredExpenses.length} trên tổng số {expenses.length} khoản chi tiêu
           </div>
        )}
      </div>
    </Layout>
  );
};

export default Expenses;