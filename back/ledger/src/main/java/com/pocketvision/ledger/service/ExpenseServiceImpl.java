package com.pocketvision.ledger.service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pocketvision.ledger.model.Budget;
import com.pocketvision.ledger.model.Expense;
import com.pocketvision.ledger.model.Notification;
import com.pocketvision.ledger.repository.BudgetRepository;
import com.pocketvision.ledger.repository.ExpenseRepository;

@Service
public class ExpenseServiceImpl implements ExpenseService {

    @Autowired
    private ExpenseRepository expenseRepository;

    @Autowired
    private BudgetRepository budgetRepository;

    @Autowired
    private NotificationService notificationService;

    // ==========================================
    // CÁC PHƯƠNG THỨC LẤY DỮ LIỆU
    // ==========================================

    @Override
    public List<Expense> getExpensesByUser(Long userId) {
        return expenseRepository.findByUserId(userId);
    }

    @Override
    public Expense getExpenseById(Long id) {
        return expenseRepository.findById(id).orElse(null);
    }

    @Override
    public List<Expense> searchExpenses(Long userId, String keyword) {
        return expenseRepository.searchByKeyword(userId, keyword);
    }

    // ==========================================
    // CÁC PHƯƠNG THỨC THAY ĐỔI DỮ LIỆU (CRUD)
    // ==========================================

    @Override
    @Transactional
    public Expense createExpense(Expense expense) {
        validateExpense(expense);

        Expense savedExpense = expenseRepository.save(expense);

        updateRelatedBudget(savedExpense.getUserId(), savedExpense.getCategoryId(), savedExpense.getExpenseDate());

        checkBudgetAndNotify(savedExpense);

        return savedExpense;
    }

    @Override
    @Transactional
    public Expense updateExpense(Long id, Expense updatedExpense) {
        Expense existingExpense = expenseRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy khoản chi tiêu"));

        validateExpense(updatedExpense);

        Long oldCategoryId = existingExpense.getCategoryId();
        LocalDate oldDate = existingExpense.getExpenseDate();

        existingExpense.setStoreName(updatedExpense.getStoreName());
        existingExpense.setTotalAmount(updatedExpense.getTotalAmount());
        existingExpense.setCategoryId(updatedExpense.getCategoryId());
        existingExpense.setExpenseDate(updatedExpense.getExpenseDate());
        existingExpense.setNote(updatedExpense.getNote());
        existingExpense.setPaymentMethod(updatedExpense.getPaymentMethod());

        Expense savedExpense = expenseRepository.save(existingExpense);

        updateRelatedBudget(savedExpense.getUserId(), savedExpense.getCategoryId(), savedExpense.getExpenseDate());

        boolean categoryChanged = !oldCategoryId.equals(savedExpense.getCategoryId());
        boolean monthChanged = !getYearMonth(oldDate).equals(getYearMonth(savedExpense.getExpenseDate()));

        if (categoryChanged || monthChanged) {
            updateRelatedBudget(savedExpense.getUserId(), oldCategoryId, oldDate);
        }

        checkBudgetAndNotify(savedExpense);

        return savedExpense;
    }

    @Override
    @Transactional
    public void deleteExpense(Long id) {
        Expense expense = expenseRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy khoản chi tiêu"));

        Long userId = expense.getUserId();
        Long categoryId = expense.getCategoryId();
        LocalDate expenseDate = expense.getExpenseDate();

        expenseRepository.delete(expense);

        updateRelatedBudget(userId, categoryId, expenseDate);
    }

    // ========================================================================
    // CÁC HÀM HỖ TRỢ (PRIVATE HELPERS)
    // ========================================================================

    private void validateExpense(Expense expense) {
        if (expense.getUserId() == null) {
            throw new IllegalArgumentException("Thiếu thông tin người dùng");
        }
        if (expense.getTotalAmount() == null || expense.getTotalAmount() <= 0) {
            throw new IllegalArgumentException("Số tiền phải lớn hơn 0");
        }
        if (expense.getCategoryId() == null) {
            throw new IllegalArgumentException("Vui lòng chọn danh mục chi tiêu");
        }
        if (expense.getExpenseDate() == null) {
            throw new IllegalArgumentException("Ngày chi tiêu không được để trống");
        }
        if (expense.getNote() != null && expense.getNote().length() > 255) {
            throw new IllegalArgumentException("Ghi chú quá dài (tối đa 255 ký tự)");
        }
    }

    private String getYearMonth(LocalDate date) {
        return date.format(DateTimeFormatter.ofPattern("yyyy-MM"));
    }

    private void updateRelatedBudget(Long userId, Long categoryId, LocalDate date) {
        if (categoryId == null || date == null) return;

        String monthYear = getYearMonth(date);

        Optional<Budget> budgetOpt = budgetRepository.findByUserIdAndCategoryIdAndMonthYear(
                userId, categoryId, monthYear
        );

        budgetOpt.ifPresent(budget -> {
            LocalDate startDate = date.withDayOfMonth(1);
            LocalDate endDate = date.withDayOfMonth(date.lengthOfMonth());

            List<Expense> expenses = expenseRepository.findByUserIdAndCategoryIdAndExpenseDateBetween(
                    userId, categoryId, startDate, endDate
            );

            double totalSpent = expenses.stream()
                    .mapToDouble(Expense::getTotalAmount)
                    .sum();
            
            budget.setSpentAmount(totalSpent);
            budgetRepository.save(budget);
        });
    }

    // --- Đã sửa lỗi thiếu tham số Title tại đây ---
    private void checkBudgetAndNotify(Expense expense) {
        if (expense.getCategoryId() == null || expense.getExpenseDate() == null) return;

        String monthYear = getYearMonth(expense.getExpenseDate());

        budgetRepository.findByUserIdAndCategoryIdAndMonthYear(
                expense.getUserId(), expense.getCategoryId(), monthYear
        ).ifPresent(budget -> {
            
            if (budget.getLimitAmount() > 0) {
                double percentage = (budget.getSpentAmount() / budget.getLimitAmount()) * 100;

                if (percentage >= 100) {
                    notificationService.createNotification(
                        expense.getUserId(),
                        "Vỡ ngân sách!", // Title (Tham số thứ 2)
                        String.format("CẢNH BÁO: Bạn đã tiêu %.0f%% (vượt mức) cho danh mục này!", percentage), // Message
                        Notification.NotificationType.BUDGET_WARNING, // Type
                        budget.getId() // Related ID
                    );
                } 
                else if (percentage >= 80) {
                    notificationService.createNotification(
                        expense.getUserId(),
                        "Cảnh báo giới hạn", // Title (Tham số thứ 2)
                        String.format("Cẩn thận! Bạn đã sử dụng %.0f%% ngân sách tháng này.", percentage), // Message
                        Notification.NotificationType.BUDGET_WARNING, // Type
                        budget.getId() // Related ID
                    );
                }
            }
        });
    }
}