package com.pocketvision.ledger.controller;

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

    // API tải ảnh lên và phân tích
    @PostMapping(value = "/upload", consumes = "multipart/form-data")
    public ResponseEntity<?> uploadAndAnalyze(
            @RequestParam("file") MultipartFile file,
            @RequestParam("userId") Long userId) {
        try {
            Invoice savedInvoice = invoiceService.processAndSaveInvoice(userId, file);
            return ResponseEntity.ok(savedInvoice);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Lỗi xử lý hóa đơn: " + e.getMessage());
        }
    }

    // API lấy danh sách hóa đơn
    @GetMapping
    public ResponseEntity<List<Invoice>> getInvoices(@RequestParam Long userId) {
        return ResponseEntity.ok(invoiceService.getAllInvoices(userId));
    }
}