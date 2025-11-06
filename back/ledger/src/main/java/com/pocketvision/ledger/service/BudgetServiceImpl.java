package com.pocketvision.ledger.service;

import com.pocketvision.ledger.model.Budget;
import com.pocketvision.ledger.repository.BudgetRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class BudgetServiceImpl implements BudgetService {

    @Autowired
    private BudgetRepository budgetRepository;

    @Override
    public List<Budget> getAllBudgets(Long userId) {
        return budgetRepository.findByUserId(userId);
    }

    @Override
    public Optional<Budget> getBudget(Long id) {
        return budgetRepository.findById(id);
    }

    @Override
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
        return budgetRepository.save(budget);
    }

    @Override
    public Budget updateBudget(Long id, Budget updatedBudget) {
        Budget existing = budgetRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy ngân sách"));

        if (updatedBudget.getLimitAmount() == null || updatedBudget.getLimitAmount() <= 0) {
            throw new IllegalArgumentException("Số tiền không hợp lệ");
        }

        existing.setLimitAmount(updatedBudget.getLimitAmount());
        existing.setCategoryId(updatedBudget.getCategoryId());
        existing.setMonthYear(updatedBudget.getMonthYear());
        return budgetRepository.save(existing);
    }

    @Override
    public void deleteBudget(Long id) {
        if (!budgetRepository.existsById(id)) {
            throw new IllegalArgumentException("Ngân sách không tồn tại");
        }
        budgetRepository.deleteById(id);
    }
}
