import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Link, useNavigate } from "react-router-dom";
import { Upload, FileText, Trash2, Plus, Search, Eye, Calendar, Receipt, Pencil, Save, X, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import axiosClient from "@/lib/axios-client";

// --- Interfaces ---
interface Category {
  id: number;
  name: string;
}

interface InvoiceItem {
  id: number;
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface Invoice {
  id: number;
  storeName: string;
  invoiceDate: string;
  totalAmount: number;
  paymentMethod: string;
  categoryId?: number; // Quan trọng để map vào ngân sách
  imageUrl?: string;
  note?: string;
  items?: InvoiceItem[];
  createdAt?: string;
}

const Invoices = () => {
  // --- State ---
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [categories, setCategories] = useState<Category[]>([]); // Danh sách danh mục để chọn
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  // State cho Modal & Edit
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<Invoice>>({});

  const { toast } = useToast();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // --- Load Data ---
  useEffect(() => {
    if (user.id) {
      loadInvoices();
      loadCategories();
    }
  }, [user.id]);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredInvoices(invoices);
    } else {
      const lower = searchTerm.toLowerCase();
      setFilteredInvoices(invoices.filter(inv => 
        (inv.storeName?.toLowerCase() || "").includes(lower) ||
        (inv.note?.toLowerCase() || "").includes(lower)
      ));
    }
  }, [searchTerm, invoices]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get(`/invoices?userId=${user.id}`);
      setInvoices(res.data);
      setFilteredInvoices(res.data);
    } catch (error) {
      console.error(error);
      toast({ title: "Lỗi", description: "Không thể tải danh sách hóa đơn.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const res = await axiosClient.get(`/categories?userId=${user.id}`);
      setCategories(res.data);
    } catch (e) { console.error("Lỗi tải danh mục", e); }
  };

  // --- Actions ---

  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc muốn xóa hóa đơn này không?")) return;
    
    try {
      // Gọi API Delete với userId (để backend check quyền)
      await axiosClient.delete(`/invoices/${id}`, { params: { userId: user.id } });
      
      setInvoices(prev => prev.filter(inv => inv.id !== id));
      toast({ title: "Đã xóa", description: "Hóa đơn đã được xóa thành công." });
      
      if (selectedInvoice?.id === id) setSelectedInvoice(null);
    } catch (error: any) {
      toast({ title: "Lỗi", description: error.response?.data || "Không thể xóa hóa đơn.", variant: "destructive" });
    }
  };

  const handleEditClick = () => {
    if (selectedInvoice) {
        setEditFormData({ ...selectedInvoice });
        setIsEditing(true);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedInvoice || !user.id) return;
    try {
        // Gọi API PUT để cập nhật
        const res = await axiosClient.put(`/invoices/${selectedInvoice.id}`, editFormData, {
            params: { userId: user.id }
        });
        
        // Cập nhật State Local
        const updatedList = invoices.map(inv => inv.id === selectedInvoice.id ? res.data : inv);
        setInvoices(updatedList);
        setSelectedInvoice(res.data); // Update modal data
        setIsEditing(false);

        toast({ title: "Thành công", description: "Đã cập nhật thông tin hóa đơn." });
    } catch (e) {
        toast({ title: "Lỗi", description: "Không thể cập nhật hóa đơn.", variant: "destructive" });
    }
  };

  const handleAddAsExpense = async (invoice: Invoice) => {
    // 1. Kiểm tra xem đã chọn danh mục chưa
    if (!invoice.categoryId) {
        toast({
            title: "Thiếu thông tin",
            description: "Vui lòng bấm 'Chi tiết' -> 'Sửa' để chọn Danh mục trước.",
            variant: "destructive"
        });
        // Mở modal để user sửa ngay
        setSelectedInvoice(invoice);
        return;
    }

    if (!confirm(`Tạo khoản chi ${formatCurrency(invoice.totalAmount)} từ hóa đơn này? \n(Ngân sách sẽ được cập nhật)`)) {
        return;
    }

    try {
        // 2. Gọi API Convert
        await axiosClient.post(`/invoices/${invoice.id}/convert`, null, {
            params: { userId: user.id }
        });

        toast({
            title: "Thành công!",
            description: "Đã tạo chi tiêu và cập nhật ngân sách.",
            variant: "default", // Xanh lá (nếu cấu hình theme)
        });

    } catch (error: any) {
        console.error(error);
        toast({
            title: "Lỗi",
            description: error.response?.data || "Không thể tạo chi tiêu.",
            variant: "destructive"
        });
    }
  };

  // --- Helpers ---
  const formatCurrency = (val: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val);
  const formatDate = (str: string) => str ? new Date(str).toLocaleDateString("vi-VN") : "";
  const translateMethod = (m: string) => {
    const map: Record<string, string> = { CASH: "Tiền mặt", CREDIT_CARD: "Thẻ tín dụng", BANK_TRANSFER: "Chuyển khoản", E_WALLET: "Ví điện tử", OTHER: "Khác" };
    return map[m] || m;
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto p-4 md:p-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-1">Hóa đơn điện tử</h1>
            <p className="text-muted-foreground">Quản lý và số hóa biên lai của bạn</p>
          </div>
          <Button asChild className="gradient-primary text-white shadow-md">
            <Link to="/invoices/upload"><Upload className="mr-2 h-4 w-4" /> Tải hóa đơn mới</Link>
          </Button>
        </div>

        {/* Search */}
        <div className="mb-6 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
                placeholder="Tìm kiếm theo tên cửa hàng, ghi chú..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>

        {/* List Content */}
        {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{[1,2,3].map(i=><div key={i} className="h-48 bg-muted/20 animate-pulse rounded-xl border"/>)}</div>
        ) : filteredInvoices.length === 0 ? (
            // --- GIAO DIỆN KHI TRỐNG (Đã chỉnh sửa giống Budget) ---
            <Card className="border-dashed border-2">
                <CardContent className="p-12 text-center flex flex-col items-center">
                    <Receipt className="h-16 w-16 text-muted-foreground/50 mb-4" />
                    
                    <h3 className="text-lg font-semibold mb-2">Chưa có hóa đơn nào</h3>
                    
                    <p className="text-muted-foreground mb-6 max-w-sm">
                        Việc lưu trữ hóa đơn giúp bạn theo dõi chi tiêu chính xác và minh bạch hơn. Hãy bắt đầu ngay!
                    </p>
                    
                    <Button asChild className="gradient-primary text-white shadow-elegant">
                        <Link to="/invoices/upload">
                            <Upload className="mr-2 h-4 w-4" /> Tải hóa đơn đầu tiên
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredInvoices.map((invoice) => (
                <Card key={invoice.id} className="hover:shadow-lg transition-all duration-300 flex flex-col group border-t-4 border-t-primary/20">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <Receipt className="h-4 w-4 text-primary" /> {invoice.storeName}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                                <Calendar className="h-3 w-3" /> {formatDate(invoice.invoiceDate)}
                            </p>
                        </div>
                        <Badge variant="secondary" className="text-xs">{translateMethod(invoice.paymentMethod)}</Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="flex-1 space-y-3">
                    <div className="flex justify-between items-end">
                        <span className="text-sm text-muted-foreground">Tổng tiền</span>
                        <span className="text-xl font-bold text-primary">{formatCurrency(invoice.totalAmount)}</span>
                    </div>
                    
                    {/* Hiển thị Category nếu có */}
                    {invoice.categoryId ? (
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="font-normal">
                                {categories.find(c => c.id === invoice.categoryId)?.name || "Danh mục khác"}
                            </Badge>
                        </div>
                    ) : (
                        <p className="text-xs text-orange-500 italic">Chưa phân loại danh mục</p>
                    )}

                    {invoice.note && (
                        <div className="text-sm bg-muted/30 p-2 rounded flex items-start gap-2 line-clamp-1">
                            <MapPin className="h-3 w-3 mt-1 flex-shrink-0" /> {invoice.note}
                        </div>
                    )}
                  </CardContent>

                  <CardFooter className="bg-muted/10 p-3 flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => { setSelectedInvoice(invoice); setIsEditing(false); }}>
                        <Eye className="h-4 w-4 mr-2" /> Chi tiết
                    </Button>
                    <Button size="sm" className="flex-1 gradient-primary text-white" onClick={() => handleAddAsExpense(invoice)}>
                        <Plus className="h-4 w-4 mr-2" /> Tạo chi tiêu
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(invoice.id)}>
                        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
        )}

        {/* --- MODAL CHI TIẾT & CHỈNH SỬA --- */}
        <Dialog open={!!selectedInvoice} onOpenChange={(open) => !open && setSelectedInvoice(null)}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex justify-between items-center border-b pb-4">
                        {isEditing ? "Chỉnh sửa hóa đơn" : "Chi tiết hóa đơn"}
                        {!isEditing && (
                            <Button variant="ghost" size="sm" onClick={handleEditClick} className="text-primary hover:text-primary/80">
                                <Pencil className="h-4 w-4 mr-1"/> Sửa thông tin
                            </Button>
                        )}
                    </DialogTitle>
                </DialogHeader>

                {selectedInvoice && (
                    <div className="space-y-4 py-2">
                        {/* --- CHẾ ĐỘ CHỈNH SỬA (EDIT MODE) --- */}
                        {isEditing ? (
                            <div className="grid gap-4 animate-in fade-in zoom-in-95 duration-200">
                                <div>
                                    <Label>Tên cửa hàng</Label>
                                    <Input 
                                        value={editFormData.storeName || ""} 
                                        onChange={e => setEditFormData({...editFormData, storeName: e.target.value})}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Tổng tiền</Label>
                                        <Input 
                                            type="number"
                                            value={editFormData.totalAmount || 0} 
                                            onChange={e => setEditFormData({...editFormData, totalAmount: parseFloat(e.target.value)})}
                                        />
                                    </div>
                                    <div>
                                        <Label>Phương thức TT</Label>
                                        <Select 
                                            value={editFormData.paymentMethod} 
                                            onValueChange={(val) => setEditFormData({...editFormData, paymentMethod: val})}
                                        >
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="CASH">Tiền mặt</SelectItem>
                                                <SelectItem value="CREDIT_CARD">Thẻ tín dụng</SelectItem>
                                                <SelectItem value="BANK_TRANSFER">Chuyển khoản</SelectItem>
                                                <SelectItem value="E_WALLET">Ví điện tử</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-primary font-semibold">Danh mục (Để tính ngân sách)</Label>
                                    <Select 
                                        value={editFormData.categoryId?.toString()} 
                                        onValueChange={(val) => setEditFormData({...editFormData, categoryId: parseInt(val)})}
                                    >
                                        <SelectTrigger><SelectValue placeholder="Chọn danh mục..." /></SelectTrigger>
                                        <SelectContent>
                                            {categories.map(cat => (
                                                <SelectItem key={cat.id} value={cat.id.toString()}>
                                                    <div className="flex items-center gap-2">
                                                        <span>{cat.name}</span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Ghi chú / Địa chỉ</Label>
                                    <Input 
                                        value={editFormData.note || ""} 
                                        onChange={e => setEditFormData({...editFormData, note: e.target.value})}
                                    />
                                </div>
                            </div>
                        ) : (
                            // --- CHẾ ĐỘ XEM (VIEW MODE) ---
                            <div className="space-y-5 animate-in fade-in zoom-in-95 duration-200">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div><p className="text-muted-foreground">Cửa hàng</p><p className="font-semibold text-base">{selectedInvoice.storeName}</p></div>
                                    <div className="text-right"><p className="text-muted-foreground">Tổng tiền</p><p className="font-bold text-lg text-primary">{formatCurrency(selectedInvoice.totalAmount)}</p></div>
                                    
                                    <div><p className="text-muted-foreground">Phương thức</p><p>{translateMethod(selectedInvoice.paymentMethod)}</p></div>
                                    <div className="text-right"><p className="text-muted-foreground">Danh mục</p>
                                        <Badge variant="outline" className="mt-1">
                                            {categories.find(c => c.id === selectedInvoice.categoryId)?.name || "Chưa phân loại"}
                                        </Badge>
                                    </div>
                                </div>

                                {/* Bảng món hàng */}
                                <div>
                                    <h4 className="font-semibold mb-2 text-xs uppercase tracking-wide text-muted-foreground">Chi tiết món hàng</h4>
                                    <div className="border rounded-md overflow-hidden bg-muted/20">
                                        <table className="w-full text-sm">
                                            <thead className="bg-muted/50">
                                                <tr><th className="p-2 text-left">Món</th><th className="p-2 text-center">SL</th><th className="p-2 text-right">Tiền</th></tr>
                                            </thead>
                                            <tbody className="divide-y">
                                                {selectedInvoice.items?.map((item, idx) => (
                                                    <tr key={idx}>
                                                        <td className="p-2">{item.itemName}</td>
                                                        <td className="p-2 text-center">{item.quantity}</td>
                                                        <td className="p-2 text-right font-medium">{formatCurrency(item.totalPrice)}</td>
                                                    </tr>
                                                ))}
                                                {(!selectedInvoice.items?.length) && <tr><td colSpan={3} className="p-3 text-center text-muted-foreground">Không có chi tiết</td></tr>}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {selectedInvoice.imageUrl && (
                                    <div>
                                        <h4 className="font-semibold mb-2 text-xs uppercase tracking-wide text-muted-foreground">Ảnh gốc</h4>
                                        <div className="border rounded bg-gray-50 p-1">
                                            <img src={selectedInvoice.imageUrl} alt="Invoice" className="w-full object-contain max-h-48"/>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                <DialogFooter className="gap-2 sm:gap-0 mt-4">
                    {isEditing ? (
                        <div className="flex gap-2 w-full">
                            <Button variant="outline" className="flex-1" onClick={() => setIsEditing(false)}><X className="mr-2 h-4 w-4"/> Hủy</Button>
                            <Button className="flex-1 gradient-primary text-white" onClick={handleSaveEdit}><Save className="mr-2 h-4 w-4"/> Lưu</Button>
                        </div>
                    ) : (
                        <div className="flex gap-2 w-full">
                            <Button variant="outline" className="flex-1" onClick={() => setSelectedInvoice(null)}>Đóng</Button>
                            <Button className="flex-1 gradient-primary text-white" onClick={() => selectedInvoice && handleAddAsExpense(selectedInvoice)}>
                                <Plus className="mr-2 h-4 w-4"/> Tạo chi tiêu
                            </Button>
                        </div>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Invoices;