package com.pocketvision.ledger.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

import com.pocketvision.ledger.model.Category;
public interface CategoryRepository extends JpaRepository<Category, Long> {
    List<Category> findByUserId(Long userId);
}
