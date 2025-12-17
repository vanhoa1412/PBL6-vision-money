import React, { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2, X, FileText } from "lucide-react";
import axiosClient from "@/lib/axios-client";
import { useToast } from "@/hooks/use-toast";

// --- Định nghĩa kiểu dữ liệu (TypeScript) ---
interface Expense {
  id: number;
  storeName: string;
  categoryId: number;
  totalAmount: number;
  expenseDate: string;
  note: string;
}

interface Category {
  id: number;
  name: string;
  icon?: string;
}

export default function SearchExpenses() {
  // State
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  
  const { toast } = useToast();
  
  // Lấy user từ localStorage an toàn
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : {};

  // 1. Tải danh mục ngay khi vào trang (để ánh xạ ID -> Tên)
  useEffect(() => {
    if (user.id) {
      axiosClient.get(`/categories`, { params: { userId: user.id } })
        .then(res => setCategories(res.data))
        .catch(err => console.error("Lỗi tải danh mục:", err));
    }
  }, [user.id]);

  // 2. Hàm tìm kiếm chính
  const handleSearch = async () => {
    if (!keyword.trim()) {
      setMessage("⚠️ Vui lòng nhập từ khóa tìm kiếm.");
      setResults([]);
      return;
    }

    if (!user.id) {
      toast({ title: "Lỗi", description: "Phiên đăng nhập hết hạn.", variant: "destructive" });
      return;
    }

    try {
      setIsLoading(true);
      setMessage("");
      setResults([]);

      // Gọi API search qua axiosClient
      const res = await axiosClient.get("/expenses/search", {
        params: { 
          userId: user.id, 
          keyword: keyword 
        },
      });

      setResults(res.data);
      setMessage(`✅ Tìm thấy ${res.data.length} kết quả phù hợp.`);
    } catch (err: any) {
      // Xử lý lỗi 404 (Không tìm thấy) riêng biệt
      if (err.response?.status === 404) {
        setMessage("❌ Không tìm thấy kết quả nào khớp với từ khóa.");
      } else {
        console.error(err);
        setMessage("⚠️ Đã có lỗi xảy ra khi tìm kiếm.");
        toast({ title: "Lỗi server", description: "Không thể kết nối đến hệ thống.", variant: "destructive" });
      }
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Xử lý khi ấn Enter trong ô input
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  // Xóa từ khóa tìm kiếm
  const clearSearch = () => {
    setKeyword("");
    setResults([]);
    setMessage("");
  };

  // Helper: Lấy tên danh mục từ ID
  const getCategoryName = (id: number) => {
    const cat = categories.find(c => c.id === id);
    return cat ? `${cat.icon || ""} ${cat.name}` : "Khác";
  };

  // Helper: Format tiền tệ
  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

  // Helper: Format ngày
  const formatDate = (dateStr: string) => 
    new Date(dateStr).toLocaleDateString("vi-VN");

  return (
    <Layout>
      <div className="p-4 md:p-6 max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <Search className="h-8 w-8" /> Tìm kiếm chi tiêu
        </h1>

        <Card className="shadow-md border border-gray-200 rounded-xl mb-8">
          <CardHeader className="pb-2 border-b bg-gray-50/50">
            <CardTitle className="text-lg text-gray-700">Nhập thông tin</CardTitle>
          </CardHeader>

          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Nhập tên quán, món ăn, ghi chú hoặc số tiền..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="pl-10 pr-10 h-11"
                  autoFocus
                />
                {keyword && (
                  <button 
                    onClick={clearSearch}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Xóa từ khóa"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
              
              <Button
                className="flex items-center gap-2 px-6 h-11 gradient-primary text-white shadow-md hover:shadow-lg transition-all"
                onClick={handleSearch}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                {isLoading ? "Đang tìm..." : "Tìm kiếm"}
              </Button>
            </div>

            {/* Thông báo kết quả */}
            {message && (
              <div className={`p-3 rounded-lg text-sm font-medium flex items-center gap-2 mb-4 ${
                message.startsWith("✅") ? "bg-green-50 text-green-700 border border-green-200" : 
                message.startsWith("⚠️") ? "bg-yellow-50 text-yellow-700 border border-yellow-200" :
                "bg-red-50 text-red-700 border border-red-200"
              }`}>
                {message}
              </div>
            )}

            {/* Bảng kết quả */}
            {results.length > 0 && (
              <div className="overflow-x-auto border rounded-lg shadow-sm">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-600 font-medium border-b">
                    <tr>
                      <th className="px-6 py-4">Ngày</th>
                      <th className="px-6 py-4">Cửa hàng / Nội dung</th>
                      <th className="px-6 py-4">Danh mục</th>
                      <th className="px-6 py-4 text-right">Số tiền</th>
                      <th className="px-6 py-4">Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {results.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-gray-600 font-medium">
                          {formatDate(item.expenseDate)}
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-900">
                          {item.storeName || "—"}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {getCategoryName(item.categoryId)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-primary">
                          {formatCurrency(item.totalAmount)}
                        </td>
                        <td className="px-6 py-4 text-gray-500 max-w-[200px] truncate" title={item.note}>
                          {item.note || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* Gợi ý khi chưa tìm kiếm */}
            {!isLoading && results.length === 0 && !message && (
              <div className="text-center py-12 text-muted-foreground flex flex-col items-center">
                <FileText className="h-12 w-12 mb-3 text-gray-300" />
                <p>Nhập từ khóa để tìm lại các khoản chi tiêu cũ của bạn.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}