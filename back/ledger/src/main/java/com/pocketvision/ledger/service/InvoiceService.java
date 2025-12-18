package com.pocketvision.ledger.service;

import java.io.File;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.context.annotation.Lazy;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pocketvision.ledger.model.Expense;
import com.pocketvision.ledger.model.Invoice;
import com.pocketvision.ledger.model.InvoiceItem;
import com.pocketvision.ledger.model.Notification;
import com.pocketvision.ledger.repository.InvoiceRepository;

import lombok.Data;

@Service
public class InvoiceService {

    @Autowired
    private InvoiceRepository invoiceRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    @Lazy
    private ExpenseService expenseService;

    @Value("${application.ai.server-url}")
    private String aiServerUrl;

    // ==========================================
    // 1. CÁC CLASS DTO HỨNG JSON TỪ SERVER AI
    // ==========================================

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    static class AiWrapperResponse {
        private AiWrapperData data;
        private String status;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    static class AiWrapperData {
        @JsonProperty("extraction_result")
        private String extractionResult;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    static class InvoiceData {
        @JsonProperty("Tên người bán")
        private String sellerName;
        
        @JsonProperty("Địa chỉ")
        private String address;
        
        @JsonProperty("Ngày giao dịch")
        private String dateStr;
        
        @JsonProperty("Tổng tiền thanh toán")
        private Double totalAmount;
        
        @JsonProperty("Danh sách món")
        private List<InvoiceItemData> items;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    static class InvoiceItemData {
        @JsonProperty("Tên món")
        private String name;
        
        @JsonProperty("Đơn giá")
        private Double price;
        
        @JsonProperty("Số lượng")
        private Integer quantity;
    }

    // ==========================================
    // 2. LOGIC XỬ LÝ CHÍNH
    // ==========================================

    @Transactional
    public Invoice processAndSaveInvoice(Long userId, MultipartFile file) throws Exception {
        // Bước 1: Gọi Server AI
        String rawResponse = callAiServer(file);
        
        ObjectMapper mapper = new ObjectMapper();
        
        // Bước 2: Parse lớp vỏ
        AiWrapperResponse wrapper;
        try {
            wrapper = mapper.readValue(rawResponse, AiWrapperResponse.class);
        } catch (Exception e) {
            throw new Exception("Lỗi cấu trúc JSON từ Server AI: " + e.getMessage());
        }

        if (wrapper.getData() == null || wrapper.getData().getExtractionResult() == null) {
            throw new Exception("Server AI trả về thành công nhưng không có dữ liệu hóa đơn.");
        }

        // Bước 3: Làm sạch chuỗi JSON
        String jsonString = wrapper.getData().getExtractionResult();
        jsonString = jsonString.replace("```json", "")
                               .replace("```", "")
                               .trim();

        // Bước 4: Parse chi tiết hóa đơn
        InvoiceData aiData;
        try {
            aiData = mapper.readValue(jsonString, InvoiceData.class);
        } catch (Exception e) {
            throw new Exception("Lỗi đọc nội dung chi tiết hóa đơn: " + e.getMessage());
        }
        
        validateInvoiceQuality(aiData);

        // Bước 5: Map sang Entity
        Invoice invoice = new Invoice();
        invoice.setUserId(userId);
        
        String storeName = aiData.getSellerName() != null ? aiData.getSellerName() : "Hóa đơn chưa đặt tên";
        invoice.setStoreName(storeName);
        
        invoice.setTotalAmount(aiData.getTotalAmount() != null ? aiData.getTotalAmount() : 0.0);
        
        invoice.setNote("Địa chỉ: " + (aiData.getAddress() != null ? aiData.getAddress() : "N/A"));
        invoice.setImageUrl("upload/" + file.getOriginalFilename());

        invoice.setInvoiceDate(parseDate(aiData.getDateStr()));

        // Map items
        if (aiData.getItems() != null) {
            List<InvoiceItem> items = new ArrayList<>();
            for (InvoiceItemData aiItem : aiData.getItems()) {
                InvoiceItem item = new InvoiceItem();
                item.setItemName(aiItem.getName() != null ? aiItem.getName() : "Sản phẩm");
                
                double price = aiItem.getPrice() != null ? aiItem.getPrice() : 0.0;
                int quantity = aiItem.getQuantity() != null ? aiItem.getQuantity() : 1;
                
                item.setUnitPrice(price);
                item.setQuantity(quantity);
                item.setTotalPrice(price * quantity);
                item.setInvoice(invoice);
                items.add(item);
            }
            invoice.setItems(items);
        }

        // 6. Lưu DB
        Invoice savedInvoice = invoiceRepository.save(invoice);

        // 7. Gửi Thông báo
        try {
            notificationService.createNotification(
                userId,
                "Xử lý hóa đơn thành công", // Title
                "Đã trích xuất hóa đơn: " + storeName, // Message
                Notification.NotificationType.NEW_INVOICE,
                savedInvoice.getId()
            );
        } catch (Exception e) {
            System.err.println("Lỗi gửi thông báo: " + e.getMessage());
        }

        return savedInvoice;
    }
    

    private void validateInvoiceQuality(InvoiceData data) throws IllegalArgumentException {
        // Kiểm tra tên người bán
        boolean isNameInvalid = data.getSellerName() == null 
                || data.getSellerName().trim().isEmpty() 
                || data.getSellerName().equalsIgnoreCase("Không tên")
                || data.getSellerName().equalsIgnoreCase("N/A")
                || data.getSellerName().equalsIgnoreCase("Unknown");

        // Kiểm tra tổng tiền
        boolean isTotalInvalid = data.getTotalAmount() == null || data.getTotalAmount() <= 0;

        // Kiểm tra địa chỉ
        boolean isAddressInvalid = data.getAddress() == null 
                || data.getAddress().trim().isEmpty()
                || data.getAddress().equalsIgnoreCase("N/A");

        // Điều kiện từ chối:
        // 1. Nếu cả Tên và Tiền đều lỗi -> Ảnh quá mờ hoặc không phải hóa đơn
        if (isNameInvalid && isTotalInvalid) {
            throw new IllegalArgumentException("Ảnh không rõ nét hoặc thiếu thông tin quan trọng (Tên quán, Tổng tiền). Vui lòng tải lại ảnh.");
        }

        // 2. Nếu Tên lỗi VÀ Địa chỉ lỗi -> Không xác định được nơi mua
        if (isNameInvalid && isAddressInvalid) {
            throw new IllegalArgumentException("Không thể xác định tên quán và địa chỉ. Vui lòng tải lại ảnh rõ nét hơn.");
        }
    }
    // ==========================================
    // 3. LOGIC XÓA HÓA ĐƠN (MỚI THÊM)
    // ==========================================

    @Transactional
    public void deleteInvoice(Long id, Long userId) {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Hóa đơn không tồn tại"));
        if (!invoice.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Bạn không có quyền xóa hóa đơn này");
        }
        deleteLocalImageFile(invoice.getImageUrl());
        invoiceRepository.delete(invoice);
    }

    private void deleteLocalImageFile(String imageUrl) {
        if (imageUrl == null || imageUrl.isEmpty()) return;
        try {
            File file = new File(imageUrl);
            if (file.exists()) {
                if (file.delete()) {
                    System.out.println("Đã xóa file ảnh: " + imageUrl);
                } else {
                    System.err.println("Không thể xóa file ảnh (có thể đang được sử dụng): " + imageUrl);
                }
            }
        } catch (Exception e) {
            System.err.println("Lỗi ngoại lệ khi xóa file ảnh: " + e.getMessage());
        }
    }

    public List<Invoice> getAllInvoices(Long userId) {
        return invoiceRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    @Transactional
    public Invoice updateInvoice(Long id, Long userId, Invoice updatedInfo) {
        Invoice existing = invoiceRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Hóa đơn không tồn tại"));

        if (!existing.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Không có quyền chỉnh sửa");
        }

        if (updatedInfo.getStoreName() != null) existing.setStoreName(updatedInfo.getStoreName());
        if (updatedInfo.getTotalAmount() != null) existing.setTotalAmount(updatedInfo.getTotalAmount());
        if (updatedInfo.getNote() != null) existing.setNote(updatedInfo.getNote());
        
        if (updatedInfo.getCategoryId() != null) existing.setCategoryId(updatedInfo.getCategoryId());
        if (updatedInfo.getPaymentMethod() != null) existing.setPaymentMethod(updatedInfo.getPaymentMethod());

        return invoiceRepository.save(existing);
    }
    
    @Transactional
    public Expense convertToExpense(Long invoiceId, Long userId) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new IllegalArgumentException("Hóa đơn không tồn tại"));

        if (!invoice.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Không có quyền truy cập");
        }
        
        if (invoice.getCategoryId() == null) {
            throw new IllegalArgumentException("Vui lòng cập nhật Danh mục cho hóa đơn trước khi tạo chi tiêu.");
        }

        Expense expense = new Expense();
        expense.setUserId(userId);
        expense.setCategoryId(invoice.getCategoryId());
        expense.setStoreName(invoice.getStoreName());
        expense.setTotalAmount(invoice.getTotalAmount());
        expense.setExpenseDate(invoice.getInvoiceDate());
        expense.setNote(invoice.getNote());
        
        try {
            expense.setPaymentMethod(Expense.PaymentMethod.valueOf(invoice.getPaymentMethod().name()));
        } catch (Exception e) {
            expense.setPaymentMethod(Expense.PaymentMethod.CASH); 
        }

        return expenseService.createExpense(expense);
    }

    // ==========================================
    // 4. CÁC HÀM HỖ TRỢ KHÁC
    // ==========================================

    private String callAiServer(MultipartFile file) throws Exception {
        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        ByteArrayResource fileAsResource = new ByteArrayResource(file.getBytes()) {
            @Override
            public String getFilename() {
                return file.getOriginalFilename(); 
            }
        };

        HttpHeaders fileHeaders = new HttpHeaders();
        if (file.getContentType() != null) {
            fileHeaders.setContentType(MediaType.parseMediaType(file.getContentType()));
        }

        HttpEntity<ByteArrayResource> filePart = new HttpEntity<>(fileAsResource, fileHeaders);

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("image", filePart); 

        HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(aiServerUrl, requestEntity, String.class);
            return response.getBody();
        } catch (HttpClientErrorException e) {
            throw new Exception("Lỗi từ Server AI (" + e.getStatusCode() + "): " + e.getResponseBodyAsString());
        } catch (Exception e) {
            throw new Exception("Không thể kết nối Server AI: " + e.getMessage());
        }
    }

    private LocalDate parseDate(String dateStr) {
        if (dateStr == null || dateStr.isEmpty()) return LocalDate.now();
        try {
            String cleanDate = dateStr.trim().split(" ")[0]; 
            cleanDate = cleanDate.replace(".", "/").replace("-", "/"); 
            return LocalDate.parse(cleanDate, DateTimeFormatter.ofPattern("dd/MM/yyyy"));
        } catch (Exception e) {
            try {
                String cleanDate = dateStr.trim().split(" ")[0].replace(".", "/").replace("-", "/");
                return LocalDate.parse(cleanDate, DateTimeFormatter.ofPattern("yyyy/MM/dd"));
            } catch (Exception ex) {
                System.err.println("Không thể parse ngày: " + dateStr + " -> Dùng ngày hiện tại.");
                return LocalDate.now();
            }
        }
    }
}