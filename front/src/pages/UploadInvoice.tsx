import React, { useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Loader2, CheckCircle, AlertCircle, Image as ImageIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import axiosClient from "@/lib/axios-client";

const UploadInvoice = () => {
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Lấy thông tin user
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;

  // Xử lý sự kiện kéo thả
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
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleProcessFile(e.target.files[0]);
    }
  };

  const handleProcessFile = async (file: File) => {
    if (!user?.id) {
      toast({ 
        title: "Chưa đăng nhập", 
        description: "Vui lòng đăng nhập để sử dụng tính năng này.", 
        variant: "destructive" 
      });
      navigate("/login");
      return;
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Định dạng không hỗ trợ",
        description: "Vui lòng chỉ tải lên file ảnh (JPG, PNG) hoặc PDF.",
        variant: "destructive",
      });
      return;
    }

    // 3. Validate kích thước (Max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File quá lớn",
        description: "Vui lòng tải lên file nhỏ hơn 10MB.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // 4. Chuẩn bị FormData
      const formData = new FormData();
      formData.append("file", file);
      formData.append("userId", user.id);

      // 5. Gọi API Backend (Spring Boot)
      const response = await axiosClient.post("/invoices/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const invoiceData = response.data;

      // 6. Thông báo thành công
      toast({
        title: "✅ Phân tích thành công!",
        description: `Đã trích xuất hóa đơn từ "${invoiceData.storeName || 'Cửa hàng'}" với tổng tiền ${invoiceData.totalAmount?.toLocaleString()}đ`,
      });

      // 7. Chuyển hướng về danh sách hóa đơn để xem kết quả
      navigate("/invoices");

    } catch (error: any) {
      console.error("Upload error:", error);
      let errorMsg = "Không thể phân tích hóa đơn. Vui lòng thử lại.";
      
      if (error.response?.data) {
          if (typeof error.response.data === 'string') {
              errorMsg = error.response.data;
          } else if (error.response.data.message) {
              errorMsg = error.response.data.message;
          }
      }
      
      toast({
        title: "Lỗi xử lý",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Tải lên hóa đơn</h1>
          <p className="text-muted-foreground">
            Sử dụng AI để tự động đọc thông tin chi tiêu từ ảnh chụp hóa đơn của bạn.
          </p>
        </div>

        <Card className="shadow-md border-2 border-dashed border-gray-200">
          <CardHeader>
            <CardTitle className="text-xl text-center">Tải ảnh</CardTitle>
            <CardDescription className="text-center">
              Hệ thống sẽ tự động trích xuất Tên quán, Ngày giờ, Tổng tiền và Danh sách món ăn.
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {isUploading ? (
              <div className="flex flex-col items-center justify-center py-16 text-center animate-in fade-in zoom-in duration-300">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse"></div>
                  <Loader2 className="h-16 w-16 animate-spin text-primary relative z-10" />
                </div>
                <h3 className="text-xl font-semibold mt-6 mb-2">Đang phân tích hóa đơn...</h3>
                <p className="text-muted-foreground max-w-xs mx-auto">
                  AI đang đọc dữ liệu từ ảnh của bạn. Quá trình này có thể mất vài giây.
                </p>
              </div>
            ) : (
              // --- Giao diện Upload ---
              <div
                className={`
                  relative flex flex-col items-center justify-center py-12 px-4 transition-all duration-200 ease-in-out rounded-xl
                  ${dragActive ? "bg-primary/5 scale-[1.02]" : "bg-white"}
                `}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  accept=".jpg,.jpeg,.png"
                  onChange={handleChange}
                />
                
                <div className={`p-4 rounded-full bg-secondary/10 mb-4 ${dragActive ? 'animate-bounce' : ''}`}>
                  <Upload className="h-10 w-10 text-primary" />
                </div>
                
                <h3 className="text-lg font-semibold mb-2 text-gray-900">
                  Kéo thả file vào đây
                </h3>
                
                <p className="text-muted-foreground mb-6">
                  hoặc click vào nút bên dưới để chọn file
                </p>
                
                <Button
                  onClick={() => document.getElementById('file-upload')?.click()}
                  className="gradient-primary text-white shadow-lg hover:shadow-xl transition-all px-8"
                  size="lg"
                >
                  <ImageIcon className="mr-2 h-4 w-4" /> Chọn file từ máy tính
                </Button>
                
                <div className="mt-8 flex gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center"><CheckCircle className="h-3 w-3 mr-1 text-green-500"/> JPG, PNG</span>
                  <span className="flex items-center"><CheckCircle className="h-3 w-3 mr-1 text-green-500"/> Max 10MB</span>
                </div>
              </div>
            )}

            {/* --- Phần giải thích tính năng --- */}
            {!isUploading && (
              <div className="mt-8 bg-blue-50 border border-blue-100 p-4 rounded-lg flex gap-3 items-start">
                <div className="p-2 bg-blue-100 rounded-md">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-blue-900 text-sm mb-1">Cách hoạt động</h4>
                  <p className="text-sm text-blue-700/80 leading-relaxed">
                    Sau khi bạn tải ảnh lên, Server AI sẽ đọc toàn bộ nội dung. Dữ liệu sau khi trích xuất sẽ được lưu vào mục <strong>Hóa đơn</strong> và bạn có thể chuyển nó thành khoản <strong>Chi tiêu</strong> chỉ với 1 cú click chuột.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default UploadInvoice;