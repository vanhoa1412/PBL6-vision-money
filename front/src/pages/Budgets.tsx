import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Plus, Trash2, Pencil, RefreshCw, AlertCircle } from "lucide-react"; // Thêm icon
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
// QUAN TRỌNG: Dùng axiosClient để tự động gắn Token
import axiosClient from "@/lib/axios-client";

const Budgets = () => {
  // State quản lý dữ liệu
  const [budgets, setBudgets] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  
  // State quản lý UI/Loading
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // State quản lý Edit/Form
  const [isEditing, setIsEditing] = useState(false);
  const [editBudgetId, setEditBudgetId] = useState<number | null>(null);
  const [currentMonth] = useState(new Date().toISOString().slice(0, 7)); // Định dạng yyyy-MM
  
  // State lỗi hiển thị trên form
  const [errorMessage, setErrorMessage] = useState("");
  
  const { toast } = useToast();
  
  // Form Data
  const [formData, setFormData] = useState({
    categoryId: "",
    limitAmount: "",
  });

  // Lấy User ID an toàn
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user?.id]);

  // Hàm tải dữ liệu từ Server
  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Gọi song song 2 API để tối ưu tốc độ
      const [budgetsRes, categoriesRes] = await Promise.all([
        // Gọi API lọc theo tháng (đã tối ưu ở backend)
        axiosClient.get(`/budgets/month`, { 
            params: { userId: user.id, monthYear: currentMonth } 
        }),
        axiosClient.get(`/categories`, { params: { userId: user.id } }),
      ]);

      setBudgets(budgetsRes.data);
      setCategories(categoriesRes.data);
    } catch (error: any) {
      console.error("Lỗi tải dữ liệu:", error);
      toast({
        title: "Không thể tải dữ liệu",
        description: "Vui lòng kiểm tra kết nối mạng hoặc thử lại sau.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Reset form khi đóng/mở dialog
  const resetForm = () => {
    setFormData({ categoryId: "", limitAmount: "" });
    setErrorMessage("");
    setIsEditing(false);
    setEditBudgetId(null);
  };

  // Hàm xử lý Submit (Thêm mới / Cập nhật)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    
    setErrorMessage(""); // Reset lỗi cũ
    setIsSubmitting(true);

    const amount = parseFloat(formData.limitAmount);
    const categoryId = Number(formData.categoryId);

    // --- VALIDATION PHÍA CLIENT ---
    
    // 1. Kiểm tra số tiền
    if (!formData.limitAmount || isNaN(amount) || amount <= 0) {
      setErrorMessage("Số tiền ngân sách phải lớn hơn 0");
      setIsSubmitting(false);
      return;
    }

    // 2. Kiểm tra danh mục
    if (!categoryId) {
      setErrorMessage("Vui lòng chọn một danh mục");
      setIsSubmitting(false);
      return;
    }

    // 3. Kiểm tra trùng lặp (nếu đang thêm mới)
    if (!isEditing) {
        const existing = budgets.find(b => b.categoryId === categoryId);
        if (existing) {
            setErrorMessage("Danh mục này đã có ngân sách trong tháng hiện tại. Vui lòng chọn sửa.");
            setIsSubmitting(false);
            return;
        }
    }

    try {
      const payload = {
        userId: user.id,
        categoryId: categoryId,
        monthYear: currentMonth,
        limitAmount: amount,
        spentAmount: 0 // Backend sẽ tự tính lại, nhưng gửi 0 cho đúng format
      };

      if (isEditing && editBudgetId) {
        // --- CẬP NHẬT ---
        await axiosClient.put(`/budgets/${editBudgetId}`, payload);
        toast({ title: "Cập nhật ngân sách thành công!" });
      } else {
        // --- THÊM MỚI ---
        await axiosClient.post(`/budgets`, payload);
        toast({ title: "Thêm ngân sách mới thành công!" });
      }

      // Thành công thì đóng dialog và load lại data
      setIsDialogOpen(false);
      resetForm();
      loadData();

    } catch (error: any) {
      console.error("Lỗi lưu ngân sách:", error);
      
      // Lấy message lỗi từ Backend trả về
      const msg = error.response?.data?.message || "Đã có lỗi xảy ra. Vui lòng thử lại.";
      setErrorMessage(msg);
      
      toast({
        title: "Thao tác thất bại",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Mở Dialog để sửa
  const handleEdit = (budget: any) => {
    resetForm(); // Reset trước khi set data mới
    setIsEditing(true);
    setEditBudgetId(budget.id);
    setFormData({
      categoryId: budget.categoryId.toString(),
      limitAmount: budget.limitAmount.toString(),
    });
    setIsDialogOpen(true);
  };

  // Xóa ngân sách
  const handleDelete = async (id: number) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa ngân sách này không?")) {
        return;
    }

    try {
      await axiosClient.delete(`/budgets/${id}`);
      toast({ title: "Đã xóa ngân sách", variant: "default" });
      
      // Load lại data hoặc lọc state để UI cập nhật nhanh hơn
      setBudgets(prev => prev.filter(b => b.id !== id));
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.response?.data?.message || "Không thể xóa ngân sách.",
        variant: "destructive",
      });
    }
  };

  // Helper: Format tiền tệ
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount || 0);
  };

  // Helper: Lấy tên danh mục từ ID
  const getCategoryName = (categoryId: number) => {
    const category = categories.find((c) => c.id === categoryId);
    return category ? `${category.icon || "💰"} ${category.name}` : "Danh mục đã xóa";
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        
        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2 text-foreground">Quản lý ngân sách</h1>
            <p className="text-muted-foreground">
              Tháng {new Date().getMonth() + 1}/{new Date().getFullYear()}
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={loadData} title="Làm mới dữ liệu">
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>

            <Dialog open={isDialogOpen} onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) resetForm(); // Reset khi đóng
            }}>
              <DialogTrigger asChild>
                <Button className="gradient-primary text-white shadow-elegant">
                  <Plus className="mr-2 h-4 w-4" />
                  Thêm ngân sách
                </Button>
              </DialogTrigger>
              
              {/* --- FORM DIALOG --- */}
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>
                    {isEditing ? "Cập nhật ngân sách" : "Thêm ngân sách mới"}
                  </DialogTitle>
                  <DialogDescription>
                    Đặt giới hạn chi tiêu cho danh mục trong tháng {new Date().getMonth() + 1}.
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                  {/* Chọn Danh Mục */}
                  <div className="space-y-2">
                    <Label htmlFor="category">Danh mục <span className="text-red-500">*</span></Label>
                    <Select
                      value={formData.categoryId}
                      onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                      disabled={isEditing} // Không cho sửa danh mục khi đang edit
                    >
                      <SelectTrigger id="categoryDropdown" className={isEditing ? "bg-muted" : ""}>
                          <SelectValue placeholder="Chọn danh mục chi tiêu" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.length === 0 && <div className="p-2 text-sm text-muted-foreground">Chưa có danh mục nào</div>}
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id.toString()}>
                            {cat.icon} {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Nhập Số Tiền */}
                  <div className="space-y-2">
                    <Label htmlFor="limitAmount">Hạn mức (VND) <span className="text-red-500">*</span></Label>
                    <Input
                      id="limitAmount"
                      type="number"
                      min="0"
                      step="1000"
                      value={formData.limitAmount}
                      onChange={(e) => setFormData({ ...formData, limitAmount: e.target.value })}
                      placeholder="Ví dụ: 5000000"
                      required
                    />
                  </div>
                  
                  {/* Hiển thị lỗi Inline */}
                  {errorMessage && (
                    <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 p-3 rounded-md border border-red-200">
                        <AlertCircle className="h-4 w-4" />
                        <span>{errorMessage}</span>
                    </div>
                  )}

                  <div className="flex justify-end gap-3 mt-4">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Hủy</Button>
                    <Button 
                        type="submit" 
                        className="gradient-primary text-white"
                        disabled={isSubmitting}
                    >
                      {isSubmitting ? "Đang lưu..." : (isEditing ? "Cập nhật" : "Thêm mới")}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* --- LIST NGÂN SÁCH --- */}
        <div className="space-y-4">
          {isLoading ? (
            // Skeleton Loading
            [1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                    <CardHeader className="h-20 bg-muted/50"></CardHeader>
                    <CardContent className="h-24 bg-muted/20"></CardContent>
                </Card>
            ))
          ) : budgets.length === 0 ? (
            // Empty State
            <Card className="border-dashed border-2">
              <CardContent className="p-12 text-center flex flex-col items-center">
                <PiggyBank className="h-16 w-16 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Chưa thiết lập ngân sách</h3>
                <p className="text-muted-foreground mb-6 max-w-sm">
                  Việc đặt ngân sách giúp bạn kiểm soát tài chính tốt hơn. Hãy bắt đầu ngay!
                </p>
                <Button onClick={() => { setIsDialogOpen(true); resetForm(); }} className="gradient-primary text-white">
                  <Plus className="mr-2 h-4 w-4" /> Tạo ngân sách đầu tiên
                </Button>
              </CardContent>
            </Card>
          ) : (
            // List Items
            budgets.map((budget) => {
              const percentage = (budget.spentAmount / budget.limitAmount) * 100 || 0;
              const remaining = budget.limitAmount - budget.spentAmount;
              
              // Màu sắc cảnh báo
              let statusColor = "bg-primary";
              if (percentage >= 100) statusColor = "bg-destructive";
              else if (percentage >= 80) statusColor = "bg-yellow-500";

              return (
                <Card key={budget.id} className="hover:shadow-elegant transition-all duration-300">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl flex items-center gap-2">
                            {getCategoryName(budget.categoryId)}
                        </CardTitle>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => handleEdit(budget)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(budget.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Thông tin số tiền */}
                    <div className="flex justify-between items-end text-sm">
                      <div>
                        <span className="text-muted-foreground block mb-1">Đã chi tiêu</span>
                        <span className={`font-bold text-lg ${percentage >= 100 ? 'text-destructive' : 'text-foreground'}`}>
                            {formatCurrency(budget.spentAmount)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-muted-foreground block mb-1">Hạn mức</span>
                        <span className="font-semibold">{formatCurrency(budget.limitAmount)}</span>
                      </div>
                    </div>

                    {/* Thanh Progress */}
                    <div className="relative pt-1">
                        <Progress 
                            value={Math.min(percentage, 100)} 
                            className="h-3" 
                            // indicatorClassName={statusColor} // Custom color cho thanh progress
                        />
                    </div>

                    {/* Trạng thái chi tiết */}
                    <div className="flex justify-between text-sm pt-1">
                      <span className={`${percentage >= 100 ? "text-destructive font-bold" : "text-muted-foreground"}`}>
                        {percentage.toFixed(1)}% đã sử dụng
                      </span>
                      <span className={`font-medium ${remaining < 0 ? 'text-destructive' : 'text-green-600'}`}>
                        {remaining >= 0 ? 'Còn lại: ' : 'Vượt mức: '}
                        {formatCurrency(Math.abs(remaining))}
                      </span>
                    </div>

                    {/* Cảnh báo text */}
                    {percentage >= 100 && (
                      <div className="bg-destructive/10 text-destructive p-2.5 rounded-md text-sm flex items-center gap-2 mt-2 animate-pulse">
                        <AlertCircle className="h-4 w-4" />
                        Bạn đã chi tiêu vượt quá ngân sách!
                      </div>
                    )}
                    {percentage >= 80 && percentage < 100 && (
                      <div className="bg-yellow-50 text-yellow-700 p-2.5 rounded-md text-sm flex items-center gap-2 mt-2">
                         <AlertCircle className="h-4 w-4" />
                         Cảnh báo: Bạn sắp hết ngân sách cho mục này.
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

// Icon component (nếu chưa có trong lucide-react hoặc muốn custom)
const PiggyBank = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);