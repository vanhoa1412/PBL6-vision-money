package com.pocketvision.ledger.controller;

import com.pocketvision.ledger.model.Budget;
import com.pocketvision.ledger.service.BudgetService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/budgets")
@CrossOrigin(origins = "http://localhost:8081", allowCredentials = "true")
public class BudgetController {

    @Autowired
    private BudgetService budgetService;

    @GetMapping
    public ResponseEntity<?> getBudgetsByUser(@RequestParam Long userId) {
        try {
            if (userId == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "Thiếu thông tin userId"));
            }
            
            List<Budget> budgets = budgetService.getAllBudgets(userId);
            return ResponseEntity.ok(budgets);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Lỗi khi lấy danh sách ngân sách: " + e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getBudgetById(@PathVariable Long id) {
        try {
            if (id == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "Thiếu thông tin budget ID"));
            }
            
            Optional<Budget> budget = budgetService.getBudget(id);
            if (budget.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "Không tìm thấy ngân sách với ID: " + id));
            }
            return ResponseEntity.ok(budget.get());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Lỗi khi lấy thông tin ngân sách: " + e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<?> createBudget(@RequestBody Budget budget) {
        try {
            if (budget.getUserId() == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "Thiếu thông tin userId"));
            }
            if (budget.getCategoryId() == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "Vui lòng chọn danh mục"));
            }
            if (budget.getMonthYear() == null || budget.getMonthYear().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Thiếu thông tin tháng/năm"));
            }
            if (budget.getLimitAmount() == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "Vui lòng nhập số tiền ngân sách"));
            }

            if (!isValidMonthYear(budget.getMonthYear())) {
                return ResponseEntity.badRequest().body(Map.of("message", "Định dạng tháng/năm không hợp lệ. Sử dụng format: yyyy-MM"));
            }

            Budget created = budgetService.createBudget(budget);
            return ResponseEntity.ok(created);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Lỗi khi tạo ngân sách: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateBudget(@PathVariable Long id, @RequestBody Budget updatedBudget) {
        try {
            if (id == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "Thiếu thông tin budget ID"));
            }
            if (updatedBudget.getLimitAmount() == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "Vui lòng nhập số tiền ngân sách"));
            }
            if (updatedBudget.getCategoryId() == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "Vui lòng chọn danh mục"));
            }
            if (updatedBudget.getMonthYear() == null || updatedBudget.getMonthYear().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Thiếu thông tin tháng/năm"));
            }

            if (!isValidMonthYear(updatedBudget.getMonthYear())) {
                return ResponseEntity.badRequest().body(Map.of("message", "Định dạng tháng/năm không hợp lệ. Sử dụng format: yyyy-MM"));
            }

            Budget updated = budgetService.updateBudget(id, updatedBudget);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Lỗi khi cập nhật ngân sách: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteBudget(@PathVariable Long id) {
        try {
            if (id == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "Thiếu thông tin budget ID"));
            }

            budgetService.deleteBudget(id);
            return ResponseEntity.ok(Map.of("message", "Xóa ngân sách thành công"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Lỗi khi xóa ngân sách: " + e.getMessage()));
        }
    }

    @GetMapping("/month")
    public ResponseEntity<?> getBudgetsByMonth(
            @RequestParam Long userId,
            @RequestParam String monthYear) {
        try {
            if (userId == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "Thiếu thông tin userId"));
            }
            if (monthYear == null || monthYear.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Thiếu thông tin tháng/năm"));
            }

            if (!isValidMonthYear(monthYear)) {
                return ResponseEntity.badRequest().body(Map.of("message", "Định dạng tháng/năm không hợp lệ. Sử dụng format: yyyy-MM"));
            }

            List<Budget> allBudgets = budgetService.getAllBudgets(userId);
            List<Budget> monthlyBudgets = allBudgets.stream()
                    .filter(budget -> monthYear.equals(budget.getMonthYear()))
                    .toList();

            return ResponseEntity.ok(monthlyBudgets);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Lỗi khi lấy ngân sách theo tháng: " + e.getMessage()));
        }
    }

    private boolean isValidMonthYear(String monthYear) {
        if (monthYear == null || monthYear.length() != 7) {
            return false;
        }
        try {
            String[] parts = monthYear.split("-");
            if (parts.length != 2) {
                return false;
            }
            int year = Integer.parseInt(parts[0]);
            int month = Integer.parseInt(parts[1]);
            return year >= 2000 && year <= 2100 && month >= 1 && month <= 12;
        } catch (NumberFormatException e) {
            return false;
        }
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<String> handleIllegalArgument(IllegalArgumentException ex) {
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(ex.getMessage());
    }
}