package com.pocketvision.ledger.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.pocketvision.ledger.model.Expense;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, Long> {
    List<Expense> findByUserId(Long userId);

    @Query("""
        SELECT e FROM Expense e
        WHERE e.userId = :userId
          AND (
              LOWER(e.storeName) LIKE LOWER(CONCAT('%', :keyword, '%'))
              OR LOWER(e.note) LIKE LOWER(CONCAT('%', :keyword, '%'))
              OR CAST(e.totalAmount AS string) LIKE CONCAT('%', :keyword, '%')
          )
        ORDER BY e.expenseDate DESC
    """)
    List<Expense> searchByKeyword(@Param("userId") Long userId, @Param("keyword") String keyword);
}
