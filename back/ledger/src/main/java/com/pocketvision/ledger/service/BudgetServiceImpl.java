package com.pocketvision.ledger.service;

import com.pocketvision.ledger.model.Budget;
import com.pocketvision.ledger.model.Expense;
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

    @Override
    public List<Budget> getAllBudgets(Long userId) {
        List<Budget> budgets = budgetRepository.findByUserId(userId);
        budgets.forEach(this::updateSpentAmount);
        return budgets;
    }

    @Override
    public Optional<Budget> getBudget(Long id) {
        Optional<Budget> budget = budgetRepository.findById(id);
        budget.ifPresent(this::updateSpentAmount);
        return budget;
    }

    @Override
    @Transactional
    public Budget createBudget(Budget budget) {
        if (budget.getLimitAmount() == null) {
            throw new IllegalArgumentException("Vui lòng nhập số tiền ngân sách");
        }
        if (budget.getLimitAmount() <= 0) {
            throw new IllegalArgumentException("Ngân sách phải lớn hơn 0");
        }

        Optional<Budget> existing = budgetRepository.findByUserIdAndCategoryIdAndMonthYear(
                budget.getUserId(), budget.getCategoryId(), budget.getMonthYear()
        );
        if (existing.isPresent()) {
            throw new IllegalArgumentException("Ngân sách cho tháng này đã tồn tại");
        }

        budget.setSpentAmount(0.0);
        Budget savedBudget = budgetRepository.save(budget);
        
        updateSpentAmount(savedBudget);
        
        return budgetRepository.findById(savedBudget.getId()).orElse(savedBudget);
    }

    @Override
    @Transactional
    public Budget updateBudget(Long id, Budget updatedBudget) {
        Budget existing = budgetRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy ngân sách"));

        if (updatedBudget.getLimitAmount() == null || updatedBudget.getLimitAmount() <= 0) {
            throw new IllegalArgumentException("Số tiền không hợp lệ");
        }

        existing.setLimitAmount(updatedBudget.getLimitAmount());
        existing.setCategoryId(updatedBudget.getCategoryId());
        existing.setMonthYear(updatedBudget.getMonthYear());
        
        Budget updated = budgetRepository.save(existing);
        updateSpentAmount(updated);
        
        return budgetRepository.findById(updated.getId()).orElse(updated);
    }

    @Override
    public void deleteBudget(Long id) {
        if (!budgetRepository.existsById(id)) {
            throw new IllegalArgumentException("Ngân sách không tồn tại");
        }
        budgetRepository.deleteById(id);
    }

    private void updateSpentAmount(Budget budget) {
        Double totalSpent = calculateTotalSpentForBudget(budget);
        budget.setSpentAmount(totalSpent);
        budgetRepository.save(budget);
    }

    private Double calculateTotalSpentForBudget(Budget budget) {
        YearMonth yearMonth = YearMonth.parse(budget.getMonthYear(), DateTimeFormatter.ofPattern("yyyy-MM"));
        LocalDate startDate = yearMonth.atDay(1);
        LocalDate endDate = yearMonth.atEndOfMonth();

        List<Expense> expenses = expenseRepository.findByUserIdAndCategoryIdAndExpenseDateBetween(
            budget.getUserId(), budget.getCategoryId(), startDate, endDate
        );

        return expenses.stream()
                .mapToDouble(Expense::getTotalAmount)
                .sum();
    }
}
