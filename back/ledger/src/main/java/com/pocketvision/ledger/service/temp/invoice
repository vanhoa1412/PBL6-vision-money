package com.pocketvision.ledger.service;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pocketvision.ledger.model.Invoice;
import com.pocketvision.ledger.model.InvoiceItem;
import com.pocketvision.ledger.repository.InvoiceRepository;
import lombok.Data;
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

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
public class InvoiceService {

    @Autowired
    private InvoiceRepository invoiceRepository;

    // Đã bỏ NotificationService

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
        System.out.println("Raw AI Response: " + rawResponse);

        ObjectMapper mapper = new ObjectMapper();
        
        // Bước 2: Parse lớp vỏ (Wrapper)
        AiWrapperResponse wrapper;
        try {
            wrapper = mapper.readValue(rawResponse, AiWrapperResponse.class);
        } catch (Exception e) {
            throw new Exception("Lỗi cấu trúc JSON từ Server AI: " + e.getMessage());
        }

        if (wrapper.getData() == null || wrapper.getData().getExtractionResult() == null) {
            throw new Exception("Server AI không trả về dữ liệu trích xuất");
        }

        // Bước 3: Làm sạch chuỗi JSON (Xóa Markdown code block)
        String jsonString = wrapper.getData().getExtractionResult();
        jsonString = jsonString.replace("```json", "")
                               .replace("```", "")
                               .trim();
        
        System.out.println("Cleaned JSON: " + jsonString);

        // Bước 4: Parse chuỗi JSON sạch thành Object InvoiceData
        InvoiceData aiData;
        try {
            aiData = mapper.readValue(jsonString, InvoiceData.class);
        } catch (Exception e) {
            throw new Exception("Lỗi parse nội dung hóa đơn: " + e.getMessage());
        }

        // Bước 5: Map sang Entity
        Invoice invoice = new Invoice();
        invoice.setUserId(userId);
        
        String storeName = aiData.getSellerName() != null ? aiData.getSellerName() : "Không tên";
        invoice.setStoreName(storeName);
        invoice.setTotalAmount(aiData.getTotalAmount() != null ? aiData.getTotalAmount() : 0.0);
        invoice.setNote("Địa chỉ: " + (aiData.getAddress() != null ? aiData.getAddress() : "N/A"));
        
        // Lưu tên file tạm
        invoice.setImageUrl("upload/" + file.getOriginalFilename());

        // Parse ngày tháng
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

        // 6. Lưu vào DB (Không còn gọi Notification nữa)
        return invoiceRepository.save(invoice);
    }
    
    // ==========================================
    // 3. CÁC HÀM HỖ TRỢ
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

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", fileAsResource); 

        HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(aiServerUrl, requestEntity, String.class);
            return response.getBody();
        } catch (HttpClientErrorException e) {
            throw new Exception("Lỗi từ Server AI (" + e.getStatusCode() + "): " + e.getStatusText());
        } catch (Exception e) {
            throw new Exception("Không thể kết nối Server AI: " + e.getMessage());
        }
    }

    private LocalDate parseDate(String dateStr) {
        if (dateStr == null || dateStr.isEmpty()) return LocalDate.now();
        try {
            // Xử lý chuỗi "13/08/2020" -> dd/MM/yyyy
            // Hoặc "16.01.2024 15.14" (như log của bạn)
            String cleanDate = dateStr.trim().split(" ")[0]; // Lấy phần ngày trước khoảng trắng
            
            // Nếu dùng dấu chấm (.), thay bằng dấu gạch chéo (/) để dễ parse
            cleanDate = cleanDate.replace(".", "/"); 
            
            return LocalDate.parse(cleanDate, DateTimeFormatter.ofPattern("dd/MM/yyyy"));
        } catch (Exception e) {
            System.err.println("Không thể parse ngày: " + dateStr + " -> Dùng ngày hiện tại.");
            return LocalDate.now();
        }
    }
    
    public List<Invoice> getAllInvoices(Long userId) {
        return invoiceRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }
    
    public void deleteInvoice(Long id) {
        invoiceRepository.deleteById(id);
    }
}