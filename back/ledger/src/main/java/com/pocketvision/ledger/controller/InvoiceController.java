package com.pocketvision.ledger.controller;

import com.pocketvision.ledger.model.Expense; // Import Expense
import com.pocketvision.ledger.model.Invoice;
import com.pocketvision.ledger.service.InvoiceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/invoices")
public class InvoiceController {

    @Autowired
    private InvoiceService invoiceService;

    // 1. API tải ảnh lên và phân tích
    @PostMapping(value = "/upload", consumes = "multipart/form-data")
    public ResponseEntity<?> uploadAndAnalyze(
            @RequestParam("file") MultipartFile file,
            @RequestParam("userId") Long userId) {
        try {
            Invoice savedInvoice = invoiceService.processAndSaveInvoice(userId, file);
            return ResponseEntity.ok(savedInvoice);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Lỗi xử lý hóa đơn: " + e.getMessage());
        }
    }

    // 2. API lấy danh sách hóa đơn
    @GetMapping
    public ResponseEntity<List<Invoice>> getInvoices(@RequestParam Long userId) {
        return ResponseEntity.ok(invoiceService.getAllInvoices(userId));
    }

    // 3. API xóa hóa đơn
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteInvoice(@PathVariable Long id, @RequestParam Long userId) {
        try {
            invoiceService.deleteInvoice(id, userId);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Lỗi server: " + e.getMessage());
        }
    }

    // 4. API cập nhật hóa đơn (Sửa thông tin, category, payment method)
    @PutMapping("/{id}")
    public ResponseEntity<?> updateInvoice(
            @PathVariable Long id, 
            @RequestParam Long userId,
            @RequestBody Invoice updatedInvoice) {
        try {
            Invoice result = invoiceService.updateInvoice(id, userId, updatedInvoice);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Lỗi server: " + e.getMessage());
        }
    }

    // 5. API chuyển đổi Hóa đơn thành Chi tiêu (Cập nhật ngân sách)
    @PostMapping("/{id}/convert")
    public ResponseEntity<?> convertToExpense(@PathVariable Long id, @RequestParam Long userId) {
        try {
            // Thay 'var' bằng 'Expense' để tường minh và tránh lỗi
            Expense expense = invoiceService.convertToExpense(id, userId);
            return ResponseEntity.ok(expense);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Lỗi server: " + e.getMessage());
        }
    }
}