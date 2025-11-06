package com.pocketvision.ledger.service;

import com.pocketvision.ledger.model.Budget;

import java.util.List;
import java.util.Optional;

public interface BudgetService {
    List<Budget> getAllBudgets(Long userId);
    Optional<Budget> getBudget(Long id);
    Budget createBudget(Budget budget);
    Budget updateBudget(Long id, Budget updatedBudget);
    void deleteBudget(Long id);
}
