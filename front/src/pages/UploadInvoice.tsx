import { useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const UploadInvoice = () => {
  const [dragActive, setDragActive] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (files: FileList) => {
    // In a real app, this would upload to a server and process OCR
    toast({
      title: "Tính năng đang phát triển",
      description: "Tính năng upload và OCR hóa đơn sẽ được bổ sung trong phiên bản tới.",
    });
    
    setTimeout(() => {
      navigate("/invoices");
    }, 2000);
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Upload hóa đơn</h1>
          <p className="text-muted-foreground">
            Tải lên hóa đơn dạng PDF, JPG hoặc PNG
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Chọn file hóa đơn</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-all ${
                dragActive
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                id="file-upload"
                className="hidden"
                onChange={handleChange}
                accept=".pdf,.jpg,.jpeg,.png"
                multiple
              />
              
              <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              
              <h3 className="text-lg font-semibold mb-2">
                Kéo thả file vào đây
              </h3>
              
              <p className="text-muted-foreground mb-4">
                hoặc
              </p>
              
              <Button
                onClick={() => document.getElementById('file-upload')?.click()}
                className="gradient-primary text-white shadow-elegant"
              >
                Chọn file từ máy tính
              </Button>
              
              <p className="text-sm text-muted-foreground mt-4">
                Hỗ trợ: PDF, JPG, PNG (Tối đa 10MB)
              </p>
            </div>

            <div className="mt-6 bg-accent/50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Tính năng OCR tự động
              </h4>
              <p className="text-sm text-muted-foreground">
                Hệ thống sẽ tự động đọc và trích xuất thông tin từ hóa đơn như:
                tên cửa hàng, ngày tháng, tổng tiền, các món hàng... giúp bạn tiết kiệm thời gian nhập liệu.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default UploadInvoice;
