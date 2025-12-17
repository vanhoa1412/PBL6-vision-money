package com.pocketvision.ledger.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.pocketvision.ledger.model.Category;
import com.pocketvision.ledger.service.CategoryService;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    @Autowired
    private CategoryService categoryService;

    @GetMapping
    public ResponseEntity<List<Category>> getAllByUserId(@RequestParam Long userId) {
        return ResponseEntity.ok(categoryService.getCategoriesByUser(userId));
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Category category) {
        if (category.getUserId() == null || category.getName() == null || category.getName().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Thiếu thông tin: userId hoặc tên danh mục.");
        }
        
        if (category.getIcon() == null || category.getIcon().isEmpty()) {
            category.setIcon("🏷️");
        }

        Category saved = categoryService.createCategory(category);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Category updated) {
        Category saved = categoryService.updateCategory(id, updated);
        if (saved == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            categoryService.deleteCategory(id);
            return ResponseEntity.ok(Map.of("message", "Đã xóa danh mục thành công"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Không thể xóa danh mục này vì dữ liệu liên quan."));
        }
    }
}