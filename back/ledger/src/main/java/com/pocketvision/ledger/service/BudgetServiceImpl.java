package com.pocketvision.ledger.service;

import com.pocketvision.ledger.model.Budget;
import com.pocketvision.ledger.model.Expense;
import com.pocketvision.ledger.model.Notification;
import com.pocketvision.ledger.repository.BudgetRepository;
import com.pocketvision.ledger.repository.ExpenseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;

@Service
public class BudgetServiceImpl implements BudgetService {

    @Autowired
    private BudgetRepository budgetRepository;

    @Autowired
    private ExpenseRepository expenseRepository;

    @Autowired
    private NotificationService notificationService;

    // ========================================================================
    // CÁC PHƯƠNG THỨC LẤY DỮ LIỆU (READ)
    // ========================================================================

    @Override
    public List<Budget> getAllBudgets(Long userId) {
        List<Budget> budgets = budgetRepository.findByUserId(userId);
        budgets.forEach(this::updateSpentAmount);
        return budgets;
    }

    @Override
    public List<Budget> getBudgetsByMonth(Long userId, String monthYear) {
        List<Budget> budgets = budgetRepository.findByUserIdAndMonthYear(userId, monthYear);
        budgets.forEach(this::updateSpentAmount);
        return budgets;
    }

    @Override
    public Optional<Budget> getBudget(Long id) {
        Optional<Budget> budget = budgetRepository.findById(id);
        budget.ifPresent(this::updateSpentAmount);
        return budget;
    }

    // ========================================================================
    // CÁC PHƯƠNG THỨC THAY ĐỔI DỮ LIỆU (WRITE)
    // ========================================================================

    @Override
    @Transactional
    public Budget createBudget(Budget budget) {
        if (budget.getLimitAmount() == null || budget.getLimitAmount() <= 0) {
            throw new IllegalArgumentException("Hạn mức ngân sách phải lớn hơn 0");
        }
        if (budget.getMonthYear() == null || !budget.getMonthYear().matches("^\\d{4}-\\d{2}$")) {
            throw new IllegalArgumentException("Định dạng tháng không hợp lệ (yyyy-MM)");
        }

        Optional<Budget> existing = budgetRepository.findByUserIdAndCategoryIdAndMonthYear(
                budget.getUserId(), budget.getCategoryId(), budget.getMonthYear()
        );
        if (existing.isPresent()) {
            throw new IllegalArgumentException("Ngân sách cho danh mục này trong tháng " + budget.getMonthYear() + " đã tồn tại.");
        }

        Double currentSpent = calculateTotalSpentForBudget(budget);
        budget.setSpentAmount(currentSpent);

        Budget savedBudget = budgetRepository.save(budget);

        checkAndNotify(savedBudget);

        return savedBudget;
    }

    @Override
    @Transactional
    public Budget updateBudget(Long id, Budget updatedBudget) {
        Budget existing = budgetRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy ngân sách"));

        if (updatedBudget.getLimitAmount() == null || updatedBudget.getLimitAmount() <= 0) {
            throw new IllegalArgumentException("Hạn mức mới không hợp lệ");
        }

        existing.setLimitAmount(updatedBudget.getLimitAmount());
        
        Double currentSpent = calculateTotalSpentForBudget(existing);
        existing.setSpentAmount(currentSpent);

        Budget saved = budgetRepository.save(existing);

        checkAndNotify(saved);
        
        return saved;
    }

    @Override
    public void deleteBudget(Long id) {
        if (!budgetRepository.existsById(id)) {
            throw new IllegalArgumentException("Ngân sách không tồn tại");
        }
        budgetRepository.deleteById(id);
    }

    // ========================================================================
    // CÁC HÀM HỖ TRỢ (PRIVATE HELPERS)
    // ========================================================================

    private void updateSpentAmount(Budget budget) {
        Double totalSpent = calculateTotalSpentForBudget(budget);
        
        if (Double.compare(totalSpent, budget.getSpentAmount()) != 0) {
            budget.setSpentAmount(totalSpent);
            budgetRepository.save(budget);
        }
    }

    private Double calculateTotalSpentForBudget(Budget budget) {
        try {
            YearMonth yearMonth = YearMonth.parse(budget.getMonthYear(), DateTimeFormatter.ofPattern("yyyy-MM"));
            LocalDate startDate = yearMonth.atDay(1);
            LocalDate endDate = yearMonth.atEndOfMonth();

            List<Expense> expenses = expenseRepository.findByUserIdAndCategoryIdAndExpenseDateBetween(
                budget.getUserId(), budget.getCategoryId(), startDate, endDate
            );

            return expenses.stream()
                    .mapToDouble(Expense::getTotalAmount)
                    .sum();
        } catch (Exception e) {
            System.err.println("Lỗi tính toán ngân sách (ID: " + budget.getId() + "): " + e.getMessage());
            return 0.0;
        }
    }

    private void checkAndNotify(Budget budget) {
        if (budget.getLimitAmount() <= 0) return;

        double percentage = (budget.getSpentAmount() / budget.getLimitAmount()) * 100;

        try {
            if (percentage >= 100) {
                // Đã thêm tham số Title (tham số thứ 2)
                notificationService.createNotification(
                    budget.getUserId(),
                    "Vỡ ngân sách!", // Title
                    String.format("CẢNH BÁO: Ngân sách tháng %s đã vượt quá %.0f%% hạn mức!", budget.getMonthYear(), percentage),
                    Notification.NotificationType.BUDGET_WARNING,
                    budget.getId()
                );
            } 
            else if (percentage >= 80) {
                // Đã thêm tham số Title (tham số thứ 2)
                notificationService.createNotification(
                    budget.getUserId(),
                    "Cảnh báo giới hạn", // Title
                    String.format("Cẩn thận! Bạn đã sử dụng %.0f%% ngân sách tháng %s.", percentage, budget.getMonthYear()),
                    Notification.NotificationType.BUDGET_WARNING,
                    budget.getId()
                );
            }
        } catch (Exception e) {
            System.err.println("Lỗi gửi thông báo ngân sách: " + e.getMessage());
        }
    }
}