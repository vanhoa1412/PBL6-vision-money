package com.pocketvision.ledger.service;

import com.pocketvision.ledger.model.Expense;
import com.pocketvision.ledger.model.Budget;
import com.pocketvision.ledger.repository.BudgetRepository;
import com.pocketvision.ledger.repository.ExpenseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class ExpenseServiceImpl implements ExpenseService {

    @Autowired
    private ExpenseRepository expenseRepository;

    @Autowired
    private BudgetRepository budgetRepository;

    @Override
    public List<Expense> getExpensesByUser(Long userId) {
        return expenseRepository.findByUserId(userId);
    }

    @Override
    public Expense createExpense(Expense expense) {
        if (expense.getTotalAmount() == null || expense.getTotalAmount() <= 0) {
            throw new IllegalArgumentException("Số tiền không hợp lệ");
        }

        Expense saved = expenseRepository.save(expense);

        updateBudgetSpentAmount(expense, +expense.getTotalAmount());

        return saved;
    }

    @Override
    public Expense updateExpense(Long id, Expense updated) {
        return expenseRepository.findById(id).map(existing -> {
            Double oldAmount = existing.getTotalAmount();

            existing.setStoreName(updated.getStoreName());
            existing.setCategoryId(updated.getCategoryId());
            existing.setTotalAmount(updated.getTotalAmount());
            existing.setPaymentMethod(updated.getPaymentMethod());
            existing.setNote(updated.getNote());
            existing.setExpenseDate(updated.getExpenseDate());

            Expense saved = expenseRepository.save(existing);

            if (!oldAmount.equals(updated.getTotalAmount())) {
                updateBudgetSpentAmount(existing, -oldAmount);
                updateBudgetSpentAmount(updated, +updated.getTotalAmount());
            }

            return saved;
        }).orElseThrow(() -> new IllegalArgumentException("Không tìm thấy chi tiêu"));
    }

    @Override
    public void deleteExpense(Long id) {
        Expense expense = expenseRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy chi tiêu để xóa"));

        updateBudgetSpentAmount(expense, -expense.getTotalAmount());

        expenseRepository.deleteById(id);
    }

    @Override
    public Expense getExpenseById(Long id) {
        return expenseRepository.findById(id).orElse(null);
    }

    private void updateBudgetSpentAmount(Expense expense, Double delta) {
        try {
            String monthYear = expense.getExpenseDate()
                    .format(DateTimeFormatter.ofPattern("yyyy-MM"));

            Budget budget = budgetRepository.findByUserIdAndCategoryIdAndMonthYear(
                    expense.getUserId(),
                    expense.getCategoryId(),
                    monthYear
            ).orElse(null);

            if (budget != null) {
                double newSpent = Math.max(0, budget.getSpentAmount() + delta);
                budget.setSpentAmount(newSpent);
                budgetRepository.save(budget);
            }
        } catch (Exception e) {
            System.err.println("⚠️ Lỗi cập nhật ngân sách: " + e.getMessage());
        }
    }
    @Override
    public List<Expense> searchExpenses(Long userId, String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            throw new IllegalArgumentException("Vui lòng nhập từ khóa tìm kiếm");
        }
        return expenseRepository.searchByKeyword(userId, keyword.trim());
    }

}
