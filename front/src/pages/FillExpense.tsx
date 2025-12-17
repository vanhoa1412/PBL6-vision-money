import React, { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, X, Loader2 } from "lucide-react";
import axiosClient from "@/lib/axios-client";
import { useToast } from "@/hooks/use-toast";

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

export default function FillExpense() {
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    minAmount: "",
    maxAmount: "",
    category: "", 
  });

  const [results, setResults] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const { toast } = useToast();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    if (user.id) {
      axiosClient.get(`/categories?userId=${user.id}`)
        .then(res => setCategories(res.data))
        .catch(err => console.error("Lỗi tải danh mục:", err));
    }
  }, [user.id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleClear = () => {
    setFilters({
      startDate: "",
      endDate: "",
      minAmount: "",
      maxAmount: "",
      category: "",
    });
    setResults([]);
    setMessage("");
  };

  const handleFilter = async () => {
    if (
      filters.minAmount &&
      filters.maxAmount &&
      parseFloat(filters.minAmount) > parseFloat(filters.maxAmount)
    ) {
      setResults([]);
      setMessage("⚠️ Khoảng tiền không hợp lệ (Số tiền 'Từ' phải nhỏ hơn 'Đến').");
      return;
    }

    if (!user.id) {
      toast({ title: "Lỗi", description: "Vui lòng đăng nhập lại", variant: "destructive" });
      return;
    }

    try {
      setIsLoading(true);
      setMessage("");
      setResults([]);

      const res = await axiosClient.get("/expenses/fill", {
        params: {
          userId: user.id,
          startDate: filters.startDate || null,
          endDate: filters.endDate || null,
          minAmount: filters.minAmount || null,
          maxAmount: filters.maxAmount || null,
        },
      });

      let data = res.data;

      if (filters.category.trim()) {
        const keyword = filters.category.toLowerCase();
        data = data.filter((item: Expense) => {
          const catName = getCategoryName(item.categoryId).toLowerCase();
          return catName.includes(keyword);
        });
      }

      if (data.length === 0) {
        setMessage("❌ Không tìm thấy dữ liệu phù hợp với điều kiện lọc.");
      } else {
        setResults(data);
        setMessage(`✅ Tìm thấy ${data.length} khoản chi phù hợp.`);
      }
    } catch (err) {
      console.error(err);
      setMessage("⚠️ Đã có lỗi xảy ra khi lọc dữ liệu.");
      toast({ title: "Lỗi kết nối", description: "Không thể lấy dữ liệu từ server", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryName = (id: number) => {
    const cat = categories.find(c => c.id === id);
    return cat ? `${cat.icon || ""} ${cat.name}` : "Khác";
  };

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

  const formatDate = (dateStr: string) => 
    new Date(dateStr).toLocaleDateString("vi-VN");

  return (
    <Layout>
      <div className="p-4 md:p-6 max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <Filter className="h-8 w-8" /> Lọc dữ liệu chi tiêu
        </h1>

        <Card className="shadow-md border border-gray-200 rounded-xl mb-8">
          <CardHeader className="pb-2 border-b bg-gray-50/50">
            <CardTitle className="text-lg text-gray-700">Điều kiện lọc</CardTitle>
          </CardHeader>

          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              {/* Cột 1: Thời gian */}
              <div className="space-y-4">
                <div>
                  <label className="block mb-1.5 text-sm font-medium text-gray-700">Từ ngày</label>
                  <Input
                    type="date"
                    name="startDate"
                    value={filters.startDate}
                    onChange={handleChange}
                    className="bg-white"
                  />
                </div>
                <div>
                  <label className="block mb-1.5 text-sm font-medium text-gray-700">Đến ngày</label>
                  <Input
                    type="date"
                    name="endDate"
                    value={filters.endDate}
                    onChange={handleChange}
                    className="bg-white"
                  />
                </div>
              </div>

              {/* Cột 2: Số tiền */}
              <div className="space-y-4">
                <div>
                  <label className="block mb-1.5 text-sm font-medium text-gray-700">Số tiền từ (VNĐ)</label>
                  <Input
                    type="number"
                    name="minAmount"
                    placeholder="VD: 50000"
                    value={filters.minAmount}
                    onChange={handleChange}
                    className="bg-white"
                  />
                </div>
                <div>
                  <label className="block mb-1.5 text-sm font-medium text-gray-700">Đến số tiền (VNĐ)</label>
                  <Input
                    type="number"
                    name="maxAmount"
                    placeholder="VD: 500000"
                    value={filters.maxAmount}
                    onChange={handleChange}
                    className="bg-white"
                  />
                </div>
              </div>

              {/* Cột 3: Danh mục & Actions */}
              <div className="flex flex-col justify-between">
                <div>
                  <label className="block mb-1.5 text-sm font-medium text-gray-700">Tên danh mục</label>
                  <Input
                    type="text"
                    name="category"
                    placeholder="VD: Ăn uống, Xăng xe..."
                    value={filters.category}
                    onChange={handleChange}
                    className="bg-white"
                  />
                </div>
                
                <div className="flex gap-3 mt-4 md:mt-0">
                  <Button
                    variant="outline"
                    className="flex-1 border-dashed"
                    onClick={handleClear}
                    disabled={isLoading}
                  >
                    <X className="w-4 h-4 mr-2" /> Xóa bộ lọc
                  </Button>
                  <Button
                    className="flex-1 gradient-primary text-white shadow-md hover:shadow-lg transition-all"
                    onClick={handleFilter}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4 mr-2" />
                    )}
                    {isLoading ? "Đang lọc..." : "Lọc dữ liệu"}
                  </Button>
                </div>
              </div>
            </div>

            {/* Thông báo kết quả */}
            {message && (
              <div className={`p-3 rounded-lg text-sm font-medium flex items-center gap-2 ${
                message.startsWith("✅") ? "bg-green-50 text-green-700 border border-green-200" : 
                message.startsWith("⚠️") ? "bg-yellow-50 text-yellow-700 border border-yellow-200" :
                "bg-red-50 text-red-700 border border-red-200"
              }`}>
                {message}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bảng kết quả */}
        {results.length > 0 && (
          <Card className="shadow-lg border-0 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            <CardHeader className="bg-primary/5 py-4 border-b">
              <CardTitle className="text-base text-primary font-semibold">Kết quả tìm kiếm</CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
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
          </Card>
        )}
      </div>
    </Layout>
  );
}