import React, { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tag, Plus, Trash2, Edit, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("🏷️");
  const [color, setColor] = useState("#4f46e5");
  const [editingId, setEditingId] = useState<number | null>(null); // <— thêm trạng thái edit
  const { toast } = useToast();

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userId = user?.id;

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const res = await fetch(`http://localhost:8080/api/categories?userId=${userId}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Không tải được danh mục");
      const data = await res.json();
      setCategories(data);
    } catch (err) {
      toast({ title: "Lỗi tải danh mục", description: String(err), variant: "destructive" });
    }
  };

  const handleAddOrUpdate = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!name.trim()) {
      toast({ title: "Lỗi", description: "Vui lòng nhập tên danh mục." });
      return;
    }

    try {
      const isEditing = editingId !== null;
      const url = isEditing
        ? `http://localhost:8080/api/categories/${editingId}`
        : "http://localhost:8080/api/categories";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          userId,
          name,
          colorHex: color,
          icon,
        }),
      });

      if (!res.ok) throw new Error(isEditing ? "Cập nhật thất bại" : "Tạo danh mục thất bại");

      toast({
        title: isEditing ? "Đã cập nhật!" : "Thành công!",
        description: isEditing ? "Danh mục đã được sửa." : "Đã thêm danh mục mới!",
      });

      setName("");
      setIcon("🏷️");
      setColor("#4f46e5");
      setEditingId(null);
      loadCategories();
    } catch (err) {
      toast({ title: "Lỗi", description: String(err), variant: "destructive" });
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
      const res = await fetch(`http://localhost:8080/api/categories/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Xóa danh mục thất bại");
      toast({ title: "Đã xóa", description: "Danh mục đã được xóa." });
      loadCategories();
    } catch (err) {
      toast({ title: "Lỗi", description: String(err), variant: "destructive" });
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Danh mục</h1>
          <div className="text-muted-foreground">Tổng: {categories.length}</div>
        </div>

        {/* Form thêm / sửa */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <form onSubmit={handleAddOrUpdate} className="flex gap-3 flex-wrap">
              <Input
                placeholder="Tên danh mục"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Input
                placeholder="Icon (emoji)"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                className="w-24"
              />
              <Input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-16"
              />

              {editingId ? (
                <>
                  <Button type="submit" className="flex items-center bg-green-600 hover:bg-green-700">
                    <Edit className="mr-2 h-4 w-4" /> Lưu
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    className="flex items-center"
                    onClick={handleCancelEdit}
                  >
                    <X className="mr-2 h-4 w-4" /> Hủy
                  </Button>
                </>
              ) : (
                <Button type="submit" className="flex items-center">
                  <Plus className="mr-2 h-4 w-4" /> Thêm
                </Button>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Danh sách danh mục */}
        <div className="grid gap-3">
          {categories.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <Tag className="mx-auto mb-3 h-6 w-6 text-muted-foreground" />
                <p className="text-muted-foreground">Chưa có danh mục nào.</p>
              </CardContent>
            </Card>
          ) : (
            categories.map((cat) => (
              <Card key={cat.id} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{cat.icon}</div>
                  <div>
                    <div className="font-medium">{cat.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {cat.colorHex} • ID: {cat.id}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(cat)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(cat.id)}>
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
