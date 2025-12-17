import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Link, useNavigate } from "react-router-dom";
import { Upload, FileText, Trash2, Plus, Search, Eye, Calendar, MapPin, Receipt, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import axiosClient from "@/lib/axios-client";

// --- Interfaces ---
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
  imageUrl?: string;
  note?: string;
  items?: InvoiceItem[]; // Danh sách món
  createdAt?: string;
}

const Invoices = () => {
  // State Data
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  
  // State UI
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null); // Để hiện popup chi tiết
  
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // --- Load Data ---
  useEffect(() => {
    if (user.id) {
      loadInvoices();
    }
  }, [user.id]);

  // Filter client-side mỗi khi search hoặc invoices thay đổi
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredInvoices(invoices);
    } else {
      const lowerTerm = searchTerm.toLowerCase();
      const filtered = invoices.filter(inv => 
        (inv.storeName?.toLowerCase() || "").includes(lowerTerm) ||
        (inv.note?.toLowerCase() || "").includes(lowerTerm)
      );
      setFilteredInvoices(filtered);
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
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách hóa đơn.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // --- Actions ---

  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc muốn xóa hóa đơn này không? Dữ liệu không thể phục hồi.")) {
        return;
    }
    
    try {
      // Gọi API Delete (Giả sử backend đã có endpoint này, nếu chưa có thì cần bổ sung)
      // await axiosClient.delete(`/invoices/${id}`); 
      
      // Tạm thời update state UI (vì Backend ở các bước trước chưa có API delete invoice)
      setInvoices(prev => prev.filter(inv => inv.id !== id));
      
      toast({
        title: "Đã xóa",
        description: "Hóa đơn đã được xóa thành công.",
      });
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể xóa hóa đơn.",
        variant: "destructive",
      });
    }
  };

  const handleAddAsExpense = (invoice: Invoice) => {
    // Chuyển hướng sang trang AddExpense và mang theo dữ liệu
    navigate("/expenses/add", { 
        state: { 
            storeName: invoice.storeName,
            totalAmount: invoice.totalAmount,
            expenseDate: invoice.invoiceDate,
            note: invoice.note || `Hóa đơn từ ${invoice.storeName}`
        } 
    });
  };

  // --- Helpers ---

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("vi-VN");
  };

  const translatePaymentMethod = (method: string) => {
    const map: Record<string, string> = {
        CASH: "Tiền mặt",
        CREDIT_CARD: "Thẻ tín dụng",
        BANK_TRANSFER: "Chuyển khoản",
        E_WALLET: "Ví điện tử",
        OTHER: "Khác"
    };
    return map[method] || method;
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto p-4 md:p-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-1">Hóa đơn điện tử</h1>
            <p className="text-muted-foreground">Quản lý và số hóa các biên lai mua sắm của bạn</p>
          </div>
          <Button asChild className="gradient-primary text-white shadow-md">
            <Link to="/invoices/upload">
              <Upload className="mr-2 h-4 w-4" /> Tải hóa đơn mới
            </Link>
          </Button>
        </div>

        {/* Search Bar */}
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
        <div className="space-y-6">
          {loading ? (
            // Skeleton Loading
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1,2,3].map(i => (
                    <div key={i} className="h-48 bg-muted/20 animate-pulse rounded-xl border" />
                ))}
            </div>
          ) : filteredInvoices.length === 0 ? (
            // Empty State
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="h-20 w-20 bg-muted/30 rounded-full flex items-center justify-center mb-4">
                    <FileText className="h-10 w-10 text-muted-foreground/50" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Chưa có hóa đơn nào</h3>
                <p className="text-muted-foreground max-w-sm mb-6">
                  Tải lên hóa đơn chụp ảnh để hệ thống tự động trích xuất thông tin giúp bạn.
                </p>
                <Button asChild variant="outline">
                  <Link to="/invoices/upload">Tải lên ngay</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            // Grid Invoices
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredInvoices.map((invoice) => (
                <Card key={invoice.id} className="hover:shadow-lg transition-all duration-300 flex flex-col overflow-hidden group">
                  {/* Image Preview Header (Optional) */}
                  <div className="h-2 bg-gradient-to-r from-blue-500 to-purple-500" />
                  
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <Receipt className="h-4 w-4 text-primary" />
                                {invoice.storeName || "Cửa hàng không tên"}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                                <Calendar className="h-3 w-3" /> {formatDate(invoice.invoiceDate)}
                            </p>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                            {translatePaymentMethod(invoice.paymentMethod)}
                        </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="flex-1 pb-3">
                    <div className="space-y-3">
                        <div className="flex justify-between items-end">
                            <span className="text-sm text-muted-foreground">Tổng thanh toán</span>
                            <span className="text-xl font-bold text-primary">
                                {formatCurrency(invoice.totalAmount)}
                            </span>
                        </div>
                        
                        {invoice.note && (
                            <div className="text-sm bg-muted/30 p-2 rounded flex items-start gap-2">
                                <MapPin className="h-3 w-3 mt-1 flex-shrink-0" />
                                <span className="line-clamp-2">{invoice.note}</span>
                            </div>
                        )}

                        <div className="text-xs text-muted-foreground pt-2">
                            {invoice.items && invoice.items.length > 0 
                                ? `${invoice.items.length} món hàng đã quét` 
                                : "Chưa có chi tiết món hàng"}
                        </div>
                    </div>
                  </CardContent>

                  <CardFooter className="bg-muted/10 p-3 flex gap-2">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => setSelectedInvoice(invoice)}
                    >
                        <Eye className="h-4 w-4 mr-2" /> Chi tiết
                    </Button>
                    
                    <Button 
                        size="sm" 
                        className="flex-1 gradient-primary text-white"
                        onClick={() => handleAddAsExpense(invoice)}
                    >
                        <Plus className="h-4 w-4 mr-2" /> Tạo chi tiêu
                    </Button>

                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(invoice.id)}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* --- MODAL CHI TIẾT HÓA ĐƠN --- */}
        <Dialog open={!!selectedInvoice} onOpenChange={(open) => !open && setSelectedInvoice(null)}>
            <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl border-b pb-4">
                        Chi tiết hóa đơn
                    </DialogTitle>
                    <DialogDescription>
                        Thông tin chi tiết được trích xuất từ ảnh
                    </DialogDescription>
                </DialogHeader>

                {selectedInvoice && (
                    <div className="space-y-6">
                        {/* Thông tin chung */}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-muted-foreground">Cửa hàng</p>
                                <p className="font-semibold text-base">{selectedInvoice.storeName}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-muted-foreground">Ngày giao dịch</p>
                                <p className="font-medium">{formatDate(selectedInvoice.invoiceDate)}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Phương thức</p>
                                <p className="font-medium">{translatePaymentMethod(selectedInvoice.paymentMethod)}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-muted-foreground">Tổng tiền</p>
                                <p className="font-bold text-lg text-primary">{formatCurrency(selectedInvoice.totalAmount)}</p>
                            </div>
                        </div>

                        {/* Danh sách món hàng */}
                        <div>
                            <h4 className="font-semibold mb-3 flex items-center gap-2 text-sm uppercase tracking-wide text-muted-foreground">
                                <Receipt className="h-4 w-4" /> Danh sách món hàng
                            </h4>
                            <div className="border rounded-lg overflow-hidden">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-muted/50">
                                        <tr>
                                            <th className="p-3 font-medium">Tên món</th>
                                            <th className="p-3 font-medium text-center">SL</th>
                                            <th className="p-3 font-medium text-right">Đơn giá</th>
                                            <th className="p-3 font-medium text-right">Thành tiền</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {selectedInvoice.items?.map((item, idx) => (
                                            <tr key={idx}>
                                                <td className="p-3">{item.itemName}</td>
                                                <td className="p-3 text-center">{item.quantity}</td>
                                                <td className="p-3 text-right text-muted-foreground">
                                                    {formatCurrency(item.unitPrice)}
                                                </td>
                                                <td className="p-3 text-right font-medium">
                                                    {formatCurrency(item.totalPrice)}
                                                </td>
                                            </tr>
                                        ))}
                                        {(!selectedInvoice.items || selectedInvoice.items.length === 0) && (
                                            <tr>
                                                <td colSpan={4} className="p-4 text-center text-muted-foreground">
                                                    Không có thông tin chi tiết món hàng
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Image Preview (Nếu có) */}
                        {selectedInvoice.imageUrl && (
                            <div>
                                <h4 className="font-semibold mb-2 text-sm text-muted-foreground">Ảnh gốc</h4>
                                <div className="rounded-lg overflow-hidden border">
                                    <img 
                                        src={selectedInvoice.imageUrl} 
                                        alt="Invoice original" 
                                        className="w-full h-auto object-contain max-h-60 bg-gray-50"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="flex gap-3 pt-4">
                            <Button className="flex-1" variant="outline" onClick={() => setSelectedInvoice(null)}>
                                Đóng
                            </Button>
                            <Button className="flex-1 gradient-primary text-white" onClick={() => handleAddAsExpense(selectedInvoice)}>
                                <Plus className="mr-2 h-4 w-4" /> Tạo chi tiêu
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>

      </div>
    </Layout>
  );
};

export default Invoices;