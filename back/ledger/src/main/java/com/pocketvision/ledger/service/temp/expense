package com.pocketvision.ledger.service;

import com.pocketvision.ledger.model.Expense;
import com.pocketvision.ledger.model.Budget;
import com.pocketvision.ledger.repository.ExpenseRepository;
import com.pocketvision.ledger.repository.BudgetRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;

@Service
public class ExpenseServiceImpl implements ExpenseService {

    @Autowired
    private ExpenseRepository expenseRepository;

    @Autowired
    private BudgetRepository budgetRepository;

    @Autowired
    private BudgetService budgetService;

    @Override
    public List<Expense> getExpensesByUser(Long userId) {
        return expenseRepository.findByUserId(userId);
    }

    @Override
    public Expense getExpenseById(Long id) {
        return expenseRepository.findById(id).orElse(null);
    }

    @Override
    @Transactional
    public Expense createExpense(Expense expense) {
        validateExpense(expense);
        
        Expense savedExpense = expenseRepository.save(expense);
        updateRelatedBudget(expense);
        return savedExpense;
    }

    @Override
    @Transactional
    public Expense updateExpense(Long id, Expense expense) {
        Expense existing = expenseRepository.findById(id).orElse(null);
        if (existing == null) {
            return null;
        }
        
        validateExpense(expense);
        
        Long oldCategoryId = existing.getCategoryId();
        
        existing.setCategoryId(expense.getCategoryId());
        existing.setStoreName(expense.getStoreName());
        existing.setTotalAmount(expense.getTotalAmount());
        existing.setPaymentMethod(expense.getPaymentMethod());
        existing.setNote(expense.getNote());
        existing.setExpenseDate(expense.getExpenseDate());
        
        Expense updatedExpense = expenseRepository.save(existing);
        
        updateRelatedBudget(updatedExpense);
        
        if (oldCategoryId != null && !oldCategoryId.equals(expense.getCategoryId())) {
            updateBudgetForCategoryAndDate(existing.getUserId(), oldCategoryId, existing.getExpenseDate());
        }
        
        return updatedExpense;
    }

    @Override
    @Transactional
    public void deleteExpense(Long id) {
        Expense expense = expenseRepository.findById(id).orElse(null);
        if (expense != null) {
            Long userId = expense.getUserId();
            Long categoryId = expense.getCategoryId();
            java.time.LocalDate expenseDate = expense.getExpenseDate();
            
            expenseRepository.deleteById(id);
            
            if (categoryId != null) {
                updateBudgetForCategoryAndDate(userId, categoryId, expenseDate);
            }
        }
    }

    @Override
    public List<Expense> searchExpenses(Long userId, String keyword) {
        return expenseRepository.searchByKeyword(userId, keyword.trim());
    }

    private void validateExpense(Expense expense) {
        if (expense.getTotalAmount() == null || expense.getTotalAmount() <= 0) {
            throw new IllegalArgumentException("Số tiền phải lớn hơn 0");
        }
        if (expense.getTotalAmount() > 9999999999.0) {
            throw new IllegalArgumentException("Giá trị vượt mức cho phép");
        }
        if (expense.getCategoryId() == null) {
            throw new IllegalArgumentException("Vui lòng chọn danh mục");
        }
        if (expense.getExpenseDate() == null) {
            throw new IllegalArgumentException("Ngày chi tiêu không được để trống");
        }
        if (expense.getNote() != null && expense.getNote().length() > 255) {
            throw new IllegalArgumentException("Nội dung ghi chú quá dài");
        }
    }

    private void updateRelatedBudget(Expense expense) {
        if (expense.getCategoryId() == null || expense.getExpenseDate() == null) {
            return;
        }
        updateBudgetForCategoryAndDate(expense.getUserId(), expense.getCategoryId(), expense.getExpenseDate());
    }

    private void updateBudgetForCategoryAndDate(Long userId, Long categoryId, java.time.LocalDate expenseDate) {
        YearMonth yearMonth = YearMonth.from(expenseDate);
        String monthYear = yearMonth.format(DateTimeFormatter.ofPattern("yyyy-MM"));

        Optional<Budget> budgetOpt = budgetRepository.findByUserIdAndCategoryIdAndMonthYear(
            userId, categoryId, monthYear
        );

        budgetOpt.ifPresent(budget -> {
            budgetService.getBudget(budget.getId());
        });
    }
}
