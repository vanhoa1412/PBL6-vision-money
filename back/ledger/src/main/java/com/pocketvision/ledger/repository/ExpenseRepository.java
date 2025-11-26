// package com.pocketvision.ledger.repository;

// import com.pocketvision.ledger.model.Expense;
// import org.springframework.data.jpa.repository.JpaRepository;
// import org.springframework.data.jpa.repository.Query;
// import org.springframework.data.repository.query.Param;
// import org.springframework.stereotype.Repository;

// import java.time.LocalDate;
// import java.util.List;

// @Repository
// public interface ExpenseRepository extends JpaRepository<Expense, Long> {
//     List<Expense> findByUserId(Long userId);
    
//     @Query("SELECT e FROM Expense e WHERE e.userId = :userId AND e.categoryId = :categoryId AND e.expenseDate BETWEEN :startDate AND :endDate")
//     List<Expense> findByUserIdAndCategoryIdAndExpenseDateBetween(
//             @Param("userId") Long userId,
//             @Param("categoryId") Long categoryId,
//             @Param("startDate") LocalDate startDate,
//             @Param("endDate") LocalDate endDate
//     );

//     @Query("""
//         SELECT e FROM Expense e
//         WHERE e.userId = :userId
//           AND (
//               LOWER(e.storeName) LIKE LOWER(CONCAT('%', :keyword, '%'))
//               OR LOWER(e.note) LIKE LOWER(CONCAT('%', :keyword, '%'))
//               OR CAST(e.totalAmount AS string) LIKE CONCAT('%', :keyword, '%')
//           )
//         ORDER BY e.expenseDate DESC
//     """)
//     List<Expense> searchByKeyword(@Param("userId") Long userId, @Param("keyword") String keyword);
// }

package com.pocketvision.ledger.repository;

import java.util.List;
import java.time.LocalDate;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.pocketvision.ledger.model.Expense;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, Long> {
    List<Expense> findByUserId(Long userId);
    
    // Thêm method mới để query expense theo khoảng thời gian và category
    @Query("SELECT e FROM Expense e WHERE e.userId = :userId AND e.categoryId = :categoryId AND e.expenseDate BETWEEN :startDate AND :endDate")
    List<Expense> findByUserIdAndCategoryIdAndExpenseDateBetween(
            @Param("userId") Long userId,
            @Param("categoryId") Long categoryId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

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

    // Thêm method để lấy expense theo tháng và category
    @Query("SELECT e FROM Expense e WHERE e.userId = :userId AND e.categoryId = :categoryId AND YEAR(e.expenseDate) = :year AND MONTH(e.expenseDate) = :month")
    List<Expense> findByUserIdAndCategoryIdAndMonth(
            @Param("userId") Long userId,
            @Param("categoryId") Long categoryId,
            @Param("year") int year,
            @Param("month") int month
    );
}