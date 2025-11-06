package com.pocketvision.ledger.service;

import java.util.List;

import com.pocketvision.ledger.model.Expense;

public interface ExpenseService {
    List<Expense> getExpensesByUser(Long userId);
    Expense createExpense(Expense expense);
    Expense updateExpense(Long id, Expense expense);
    void deleteExpense(Long id);
    Expense getExpenseById(Long id);
    List<Expense> searchExpenses(Long userId, String keyword);
}
