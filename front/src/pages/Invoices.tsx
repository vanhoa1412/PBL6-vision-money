import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link, useNavigate } from "react-router-dom";
import { Upload, FileText, Trash2, Plus } from "lucide-react";
import { storage, Invoice } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";

const Invoices = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = () => {
    setInvoices(storage.invoices.getAll().sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ));
  };

  const handleDelete = (id: string) => {
    if (confirm("Bạn có chắc muốn xóa hóa đơn này?")) {
      storage.invoices.delete(id);
      loadInvoices();
      toast({
        title: "Đã xóa",
        description: "Hóa đơn đã được xóa thành công.",
      });
    }
  };

  const handleAddAsExpense = (invoice: Invoice) => {
    navigate("/expenses/add", { state: { fromInvoice: invoice } });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Quản lý hóa đơn</h1>
            <p className="text-muted-foreground">
              Tổng cộng: {invoices.length} hóa đơn
            </p>
          </div>
          <Button asChild className="gradient-primary text-white shadow-elegant">
            <Link to="/invoices/upload">
              <Upload className="mr-2 h-4 w-4" />
              Upload hóa đơn
            </Link>
          </Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {invoices.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="p-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Chưa có hóa đơn nào</h3>
                <p className="text-muted-foreground mb-4">
                  Bắt đầu upload hóa đơn của bạn
                </p>
                <Button asChild className="gradient-primary text-white">
                  <Link to="/invoices/upload">
                    <Upload className="mr-2 h-4 w-4" />
                    Upload hóa đơn đầu tiên
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            invoices.map(invoice => (
              <Card key={invoice.id} className="hover:shadow-elegant transition-all group">
                <CardContent className="p-4">
                  <div className="aspect-[3/4] bg-gradient-to-br from-accent to-accent/50 rounded-lg mb-3 flex items-center justify-center relative overflow-hidden">
                    <FileText className="h-16 w-16 text-primary opacity-50" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                      <div className="flex gap-2 w-full">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleAddAsExpense(invoice)}
                          className="flex-1 gradient-primary text-white"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Chi tiêu
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(invoice.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <h3 className="font-semibold mb-2 truncate">
                    {invoice.store_name || "Hóa đơn"}
                  </h3>
                  
                  <div className="space-y-1 text-sm text-muted-foreground mb-3">
                    <p>📅 {formatDate(invoice.invoice_date)}</p>
                    <p className="text-primary font-semibold">
                      {formatCurrency(invoice.total_amount)}
                    </p>
                  </div>
                  
                  <Badge variant="outline" className="text-xs">
                    {invoice.payment_method.replace('_', ' ')}
                  </Badge>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Invoices;
