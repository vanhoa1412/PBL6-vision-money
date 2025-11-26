package com.pocketvision.ledger.controller;

import com.pocketvision.ledger.service.ReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
@CrossOrigin(origins = "http://localhost:8081", allowCredentials = "true")
public class ReportController {

    @Autowired
    private ReportService reportService;

    @GetMapping("/summary")
    public ResponseEntity<?> getReportSummary(
            @RequestParam Long userId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        
        try {
            if (userId == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "Thiếu userId"));
            }

            Map<String, Object> reportData = reportService.getReportSummary(userId, startDate, endDate);
            return ResponseEntity.ok(reportData);
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "message", "Lỗi khi tạo báo cáo: " + e.getMessage()
            ));
        }
    }

    @GetMapping("/charts")
    public ResponseEntity<?> getChartData(
            @RequestParam Long userId,
            @RequestParam String chartType,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        
        try {
            if (userId == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "Thiếu userId"));
            }

            Map<String, Object> chartData = reportService.getChartData(userId, chartType, startDate, endDate);
            return ResponseEntity.ok(chartData);
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "message", "Lỗi khi tạo biểu đồ: " + e.getMessage()
            ));
        }
    }

    @GetMapping("/advanced")
    public ResponseEntity<?> getAdvancedReport(
            @RequestParam Long userId,
            @RequestParam String reportType,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        
        try {
            if (userId == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "Thiếu userId"));
            }

            if (startDate == null || endDate == null) {
                endDate = LocalDate.now();
                startDate = endDate.minusDays(30);
            }

            Map<String, Object> reportData = reportService.getAdvancedReport(userId, reportType, startDate, endDate);
            return ResponseEntity.ok(reportData);
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "message", "Lỗi khi tạo báo cáo nâng cao: " + e.getMessage()
            ));
        }
    }

    @GetMapping("/export")
    public ResponseEntity<?> exportReport(
            @RequestParam Long userId,
            @RequestParam String format,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        
        try {
            if (userId == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "Thiếu userId"));
            }

            Map<String, Object> placeholderResponse = Map.of(
                "message", "Tính năng xuất báo cáo " + format.toUpperCase() + " đang được phát triển",
                "userId", userId,
                "format", format,
                "period", Map.of(
                    "startDate", startDate != null ? startDate.toString() : "auto",
                    "endDate", endDate != null ? endDate.toString() : "auto"
                )
            );

            return ResponseEntity.ok(placeholderResponse);
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "message", "Lỗi khi xuất báo cáo: " + e.getMessage()
            ));
        }
    }
}