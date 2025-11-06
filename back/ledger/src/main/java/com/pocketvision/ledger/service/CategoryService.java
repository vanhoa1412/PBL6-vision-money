package com.pocketvision.ledger.service;

import java.util.List;

import com.pocketvision.ledger.model.Category;

public interface CategoryService {
    List<Category> getCategoriesByUser(Long userId);
    Category createCategory(Category category);
    Category updateCategory(Long id, Category updated);
    void deleteCategory(Long id);
}
