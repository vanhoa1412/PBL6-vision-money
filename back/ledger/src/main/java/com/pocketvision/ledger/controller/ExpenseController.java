package com.pocketvision.ledger.controller;

import com.pocketvision.ledger.model.Expense;
import com.pocketvision.ledger.service.ExpenseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/expenses")
public class ExpenseController {

    @Autowired
    private ExpenseService expenseService;

    @GetMapping
    public ResponseEntity<?> getAllByUser(@RequestParam Long userId) {
        try {
            if (userId == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "Thiếu thông tin userId"));
            }
            List<Expense> expenses = expenseService.getExpensesByUser(userId);
            return ResponseEntity.ok(expenses);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Lỗi server: " + e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getExpenseById(@PathVariable Long id) {
        try {
            Expense expense = expenseService.getExpenseById(id);
            if (expense == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "Không tìm thấy chi tiêu có ID = " + id));
            }
            return ResponseEntity.ok(expense);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Lỗi lấy thông tin: " + e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<?> createExpense(@RequestBody Expense expense) {
        try {
            if (expense.getUserId() == null) {
                return ResponseEntity.badRequest().body("Thiếu thông tin người dùng (userId)");
            }
            if (expense.getTotalAmount() == null) {
                return ResponseEntity.badRequest().body("Số tiền không được để trống");
            }
            if (expense.getTotalAmount() <= 0) {
                return ResponseEntity.badRequest().body("Số tiền phải lớn hơn 0");
            }
            if (expense.getTotalAmount() > 9999999999.0) {
                return ResponseEntity.badRequest().body("Giá trị vượt mức cho phép");
            }
            if (expense.getCategoryId() == null) {
                return ResponseEntity.badRequest().body("Vui lòng chọn danh mục");
            }
            if (expense.getExpenseDate() == null) {
                return ResponseEntity.badRequest().body("Ngày chi tiêu không được để trống");
            }
            if (expense.getNote() != null && expense.getNote().length() > 255) {
                return ResponseEntity.badRequest().body("Nội dung ghi chú quá dài (tối đa 255 ký tự)");
            }

            Expense saved = expenseService.createExpense(expense);
            return ResponseEntity.ok(saved);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Lỗi khi tạo chi tiêu: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateExpense(@PathVariable Long id, @RequestBody Expense expense) {
        try {
            if (expense.getTotalAmount() == null) {
                return ResponseEntity.badRequest().body("Số tiền không được để trống");
            }
            if (expense.getTotalAmount() <= 0) {
                return ResponseEntity.badRequest().body("Số tiền phải lớn hơn 0");
            }
            if (expense.getCategoryId() == null) {
                return ResponseEntity.badRequest().body("Vui lòng chọn danh mục");
            }
            if (expense.getNote() != null && expense.getNote().length() > 255) {
                return ResponseEntity.badRequest().body("Nội dung ghi chú quá dài");
            }

            Expense updated = expenseService.updateExpense(id, expense);
            if (updated == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Không tìm thấy chi tiêu để cập nhật");
            }
            return ResponseEntity.ok(updated);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Lỗi server khi cập nhật: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteExpense(@PathVariable Long id) {
        try {
            Expense expense = expenseService.getExpenseById(id);
            if (expense == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Không tìm thấy chi tiêu để xóa");
            }

            expenseService.deleteExpense(id);
            return ResponseEntity.ok("Đã xóa chi tiêu thành công");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Lỗi server khi xóa: " + e.getMessage());
        }
    }

    @GetMapping("/search")
    public ResponseEntity<?> searchExpenses(
            @RequestParam Long userId,
            @RequestParam(required = false) String keyword) {

        if (keyword == null || keyword.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("⚠️ Vui lòng nhập từ khóa tìm kiếm");
        }

        List<Expense> results = expenseService.searchExpenses(userId, keyword);

        if (results.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("❌ Không tìm thấy kết quả phù hợp");
        }

        return ResponseEntity.ok(results);
    }

    @GetMapping("/fill")
    public ResponseEntity<?> filterExpenses(
            @RequestParam Long userId,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) Double minAmount,
            @RequestParam(required = false) Double maxAmount,
            @RequestParam(required = false) String category) {

        try {
            List<Expense> allExpenses = expenseService.getExpensesByUser(userId);

            List<Expense> filtered = allExpenses.stream()
                .filter(e -> {
                    boolean match = true;

                    if (startDate != null && !startDate.isEmpty()) {
                        match = match && !e.getExpenseDate().isBefore(LocalDate.parse(startDate));
                    }
                    if (endDate != null && !endDate.isEmpty()) {
                        match = match && !e.getExpenseDate().isAfter(LocalDate.parse(endDate));
                    }
                    if (minAmount != null) {
                        match = match && e.getTotalAmount() >= minAmount;
                    }
                    if (maxAmount != null) {
                        match = match && e.getTotalAmount() <= maxAmount;
                    }
                    
                    if (category != null && !category.isEmpty()) {
                        try {
                            Long catId = Long.parseLong(category);
                            match = match && e.getCategoryId().equals(catId);
                        } catch (NumberFormatException ex) {
                            // Nếu user nhập tên (chữ), tạm thời bỏ qua filter này
                            // TODO: Cần nâng cấp Service để join bảng Categories nếu muốn tìm theo tên
                        }
                    }

                    return match;
                })
                .collect(Collectors.toList());

            return ResponseEntity.ok(filtered);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Lỗi khi lọc dữ liệu: " + e.getMessage()));
        }
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<String> handleIllegalArgument(IllegalArgumentException ex) {
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .contentType(MediaType.TEXT_PLAIN)
                .body(ex.getMessage());
    }
}