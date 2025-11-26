package com.pocketvision.ledger.controller;

import com.pocketvision.ledger.model.Expense;
import com.pocketvision.ledger.service.ExpenseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/expenses")
@CrossOrigin(origins = "http://localhost:8081", allowCredentials = "true")
public class ExpenseController {

    @Autowired
    private ExpenseService expenseService;

    @GetMapping
    public ResponseEntity<List<Expense>> getAllByUser(@RequestParam Long userId) {
        return ResponseEntity.ok(expenseService.getExpensesByUser(userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getExpenseById(@PathVariable Long id) {
        Expense expense = expenseService.getExpenseById(id);
        if (expense == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Không tìm thấy chi tiêu có ID = " + id);
        }
        return ResponseEntity.ok(expense);
    }

    @PostMapping
    public ResponseEntity<?> createExpense(@RequestBody Expense expense) {
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
            return ResponseEntity.badRequest().body("Nội dung ghi chú quá dài");
        }

        Expense saved = expenseService.createExpense(expense);
        return ResponseEntity.ok(saved);
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
            if (expense.getTotalAmount() > 9999999999.0) {
                return ResponseEntity.badRequest().body("Giá trị vượt mức cho phép");
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
                    .body("Lỗi server khi cập nhật chi tiêu: " + e.getMessage());
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
                    .body("Lỗi server khi xóa chi tiêu: " + e.getMessage());
        }
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<String> handleIllegalArgument(IllegalArgumentException ex) {
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .contentType(MediaType.TEXT_PLAIN)
                .body(ex.getMessage());
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

}
