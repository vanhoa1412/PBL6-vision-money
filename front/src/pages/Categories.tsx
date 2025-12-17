import React, { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tag, Plus, Trash2, Edit, X, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
// QUAN TRỌNG: Import axiosClient để tự động xử lý Token
import axiosClient from "@/lib/axios-client";

interface Category {
  id: number;
  userId: number;
  name: string;
  colorHex?: string;
  icon?: string;
  createdAt?: string;
}

const Categories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  
  // State form
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("🏷️");
  const [color, setColor] = useState("#4f46e5");
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // State loading
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { toast } = useToast();

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userId = user?.id;

  useEffect(() => {
    if (userId) {
      loadCategories();
    }
  }, [userId]);

  const loadCategories = async () => {
    try {
      setIsLoading(true);
      // Sử dụng axiosClient (không cần http://localhost:8080)
      const res = await axiosClient.get(`/categories`, {
        params: { userId }
      });
      setCategories(res.data);
    } catch (err: any) {
      console.error(err);
      toast({ 
        title: "Lỗi tải danh mục", 
        description: "Không thể kết nối đến server.", 
        variant: "destructive" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddOrUpdate = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!name.trim()) {
      toast({ title: "Lỗi", description: "Vui lòng nhập tên danh mục.", variant: "destructive" });
      return;
    }

    try {
      setIsSubmitting(true);
      const isEditing = editingId !== null;
      
      const payload = {
        userId,
        name,
        colorHex: color,
        icon,
      };

      if (isEditing) {
        // Gọi API PUT
        await axiosClient.put(`/categories/${editingId}`, payload);
        toast({ title: "Đã cập nhật danh mục!" });
      } else {
        // Gọi API POST
        await axiosClient.post(`/categories`, payload);
        toast({ title: "Đã thêm danh mục mới!" });
      }

      // Reset form
      handleCancelEdit();
      // Reload lại list
      loadCategories();

    } catch (err: any) {
      const msg = err.response?.data || "Có lỗi xảy ra.";
      toast({ title: "Lỗi", description: msg, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (cat: Category) => {
    setEditingId(cat.id);
    setName(cat.name);
    setIcon(cat.icon || "🏷️");
    setColor(cat.colorHex || "#4f46e5");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setName("");
    setIcon("🏷️");
    setColor("#4f46e5");
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc muốn xóa danh mục này?")) return;
    try {
      await axiosClient.delete(`/categories/${id}`);
      toast({ title: "Đã xóa", description: "Danh mục đã được xóa." });
      
      // Cập nhật UI ngay lập tức không cần gọi lại API
      setCategories(prev => prev.filter(c => c.id !== id));
    } catch (err: any) {
      toast({ title: "Lỗi", description: "Không thể xóa danh mục này (có thể đang được sử dụng).", variant: "destructive" });
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Quản lý danh mục</h1>
            <p className="text-muted-foreground">Tạo và quản lý các loại chi tiêu của bạn</p>
          </div>
          <Button variant="outline" size="icon" onClick={loadCategories} title="Làm mới">
             <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Form thêm / sửa */}
        <Card className="mb-8 border-2 shadow-sm">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">{editingId ? "Chỉnh sửa danh mục" : "Thêm danh mục mới"}</h3>
            <form onSubmit={handleAddOrUpdate} className="flex gap-4 flex-wrap items-end">
              <div className="flex-1 min-w-[200px]">
                <Input
                  placeholder="Tên danh mục (Ví dụ: Ăn uống)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              <div className="w-24">
                <Input
                  placeholder="Icon"
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  className="text-center"
                  disabled={isSubmitting}
                />
              </div>
              <div className="w-20">
                <Input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-10 p-1 cursor-pointer"
                  disabled={isSubmitting}
                />
              </div>

              {editingId ? (
                <div className="flex gap-2">
                  <Button type="submit" className="bg-green-600 hover:bg-green-700" disabled={isSubmitting}>
                    <Edit className="mr-2 h-4 w-4" /> Lưu
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleCancelEdit}
                    disabled={isSubmitting}
                  >
                    <X className="mr-2 h-4 w-4" /> Hủy
                  </Button>
                </div>
              ) : (
                <Button type="submit" className="gradient-primary text-white" disabled={isSubmitting}>
                  <Plus className="mr-2 h-4 w-4" /> Thêm
                </Button>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Danh sách danh mục */}
        <div className="grid gap-3">
          {isLoading && categories.length === 0 ? (
             <p className="text-center text-muted-foreground">Đang tải dữ liệu...</p>
          ) : categories.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center">
                <Tag className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" />
                <p className="text-muted-foreground">Chưa có danh mục nào. Hãy tạo mới ngay!</p>
              </CardContent>
            </Card>
          ) : (
            categories.map((cat) => (
              <Card key={cat.id} className="flex items-center justify-between p-4 hover:shadow-md transition-all">
                <div className="flex items-center gap-4">
                  <div 
                    className="h-12 w-12 rounded-full flex items-center justify-center text-2xl bg-opacity-10"
                    style={{ backgroundColor: `${cat.colorHex}20` }}
                  >
                    {cat.icon || "🏷️"}
                  </div>
                  <div>
                    <div className="font-bold text-lg" style={{ color: cat.colorHex }}>{cat.name}</div>
                    <div className="text-xs text-muted-foreground">
                      ID: {cat.id} • Màu: {cat.colorHex}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(cat)}>
                    <Edit className="h-4 w-4 text-primary" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(cat.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Categories;