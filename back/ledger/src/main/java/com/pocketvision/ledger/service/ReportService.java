package com.pocketvision.ledger.service;

import com.pocketvision.ledger.model.Expense;
import com.pocketvision.ledger.model.Category;
import com.pocketvision.ledger.repository.ExpenseRepository;
import com.pocketvision.ledger.repository.CategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ReportService {

    @Autowired
    private ExpenseRepository expenseRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    public Map<String, Object> getReportSummary(Long userId, LocalDate startDate, LocalDate endDate) {
        try {
            System.out.println("📊 Getting report summary for userId: " + userId);
            
            final LocalDate finalStartDate = (startDate != null) ? startDate : LocalDate.now().withDayOfMonth(1);
            final LocalDate finalEndDate = (endDate != null) ? endDate : LocalDate.now();
            
            System.out.println("📅 Date range: " + finalStartDate + " to " + finalEndDate);

            List<Expense> allExpenses = expenseRepository.findByUserId(userId);
            System.out.println("💰 Found " + allExpenses.size() + " total expenses");

            List<Expense> periodExpenses = allExpenses.stream()
                    .filter(expense -> expense.getExpenseDate() != null)
                    .filter(expense -> isDateInRangeCorrected(expense.getExpenseDate(), finalStartDate, finalEndDate))
                    .collect(Collectors.toList());

            System.out.println("📈 Filtered to " + periodExpenses.size() + " expenses in period");

            List<Category> categories = categoryRepository.findByUserId(userId);
            System.out.println("📂 Found " + categories.size() + " categories");

            double totalExpenses = allExpenses.stream()
                    .mapToDouble(Expense::getTotalAmount)
                    .sum();

            double periodExpensesTotal = periodExpenses.stream()
                    .mapToDouble(Expense::getTotalAmount)
                    .sum();

            List<Map<String, Object>> categoryBreakdown = calculateCategoryBreakdown(
                    periodExpenses, categories, periodExpensesTotal);

            Map<String, Object> stats = calculateStatistics(periodExpenses);

            Map<String, Object> result = new HashMap<>();
            result.put("totalExpenses", totalExpenses);
            result.put("periodExpenses", periodExpensesTotal);
            result.put("categoryBreakdown", categoryBreakdown);
            result.put("statistics", stats);
            result.put("period", Map.of(
                    "startDate", finalStartDate.toString(),
                    "endDate", finalEndDate.toString(),
                    "expenseCount", periodExpenses.size(),
                    "days", java.time.temporal.ChronoUnit.DAYS.between(finalStartDate, finalEndDate) + 1
            ));

            System.out.println("✅ Report summary generated successfully");
            return result;

        } catch (Exception e) {
            System.err.println("❌ Error in getReportSummary: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Lỗi khi tạo báo cáo tổng quan: " + e.getMessage(), e);
        }
    }

    public Map<String, Object> getChartData(Long userId, String chartType, LocalDate startDate, LocalDate endDate) {
        try {
            System.out.println("📊 Getting chart data for userId: " + userId + ", chartType: " + chartType);
            
            final LocalDate finalStartDate;
            final LocalDate finalEndDate;
            
            switch (chartType.toLowerCase()) {
                case "monthly":
                    finalStartDate = (startDate != null) ? startDate : LocalDate.now().minusMonths(6).withDayOfMonth(1);
                    finalEndDate = (endDate != null) ? endDate : LocalDate.now();
                    break;
                case "daily":
                    finalStartDate = (startDate != null) ? startDate : LocalDate.now().minusDays(30);
                    finalEndDate = (endDate != null) ? endDate : LocalDate.now();
                    break;
                case "category":
                    finalStartDate = (startDate != null) ? startDate : LocalDate.now().withDayOfMonth(1);
                    finalEndDate = (endDate != null) ? endDate : LocalDate.now();
                    break;
                default:
                    finalStartDate = (startDate != null) ? startDate : LocalDate.now().minusMonths(1);
                    finalEndDate = (endDate != null) ? endDate : LocalDate.now();
            }
            
            System.out.println("📅 Date range: " + finalStartDate + " to " + finalEndDate);
            
            List<Expense> expenses = expenseRepository.findByUserId(userId);
            System.out.println("💰 Found " + expenses.size() + " expenses for user");
            
            List<Expense> periodExpenses = expenses.stream()
                    .filter(expense -> expense.getExpenseDate() != null)
                    .filter(expense -> isDateInRangeCorrected(expense.getExpenseDate(), finalStartDate, finalEndDate))
                    .collect(Collectors.toList());

            System.out.println("📈 Filtered to " + periodExpenses.size() + " expenses in period");

            Map<String, Object> chartData = new HashMap<>();
            
            switch (chartType.toLowerCase()) {
                case "monthly":
                    chartData = generateMonthlyChartData(periodExpenses, finalStartDate, finalEndDate);
                    break;
                case "category":
                    chartData = generateCategoryChartData(periodExpenses, categoryRepository.findByUserId(userId));
                    break;
                case "daily":
                    chartData = generateDailyChartData(periodExpenses, finalStartDate, finalEndDate);
                    break;
                default:
                    chartData.put("error", "Loại biểu đồ không hợp lệ: " + chartType);
            }
            
            chartData.put("chartType", chartType);
            chartData.put("period", Map.of(
                "startDate", finalStartDate.toString(),
                "endDate", finalEndDate.toString(),
                "totalExpenses", periodExpenses.size()
            ));
            
            System.out.println("✅ Successfully generated chart data");
            return chartData;
            
        } catch (Exception e) {
            System.err.println("❌ Error in getChartData: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Lỗi khi tạo biểu đồ: " + e.getMessage(), e);
        }
    }

    public Map<String, Object> getAdvancedReport(Long userId, String reportType, LocalDate startDate, LocalDate endDate) {
        try {
            System.out.println("📋 Getting advanced report for userId: " + userId + ", reportType: " + reportType);
            
            final LocalDate finalStartDate = (startDate != null) ? startDate : LocalDate.now().minusDays(30);
            final LocalDate finalEndDate = (endDate != null) ? endDate : LocalDate.now();
            
            System.out.println("📅 Date range: " + finalStartDate + " to " + finalEndDate);

            List<Expense> expenses = expenseRepository.findByUserId(userId);
            
            List<Expense> periodExpenses = expenses.stream()
                    .filter(expense -> expense.getExpenseDate() != null)
                    .filter(expense -> isDateInRangeCorrected(expense.getExpenseDate(), finalStartDate, finalEndDate))
                    .collect(Collectors.toList());

            System.out.println("📈 Filtered to " + periodExpenses.size() + " expenses in period");

            Map<String, Object> reportData = switch (reportType.toLowerCase()) {
                case "monthly" -> generateMonthlyReport(periodExpenses, finalStartDate, finalEndDate);
                case "category" -> generateCategoryReport(periodExpenses, categoryRepository.findByUserId(userId));
                case "payment_method" -> generatePaymentMethodReport(periodExpenses);
                case "trend" -> generateTrendReport(periodExpenses, finalStartDate, finalEndDate);
                default -> {
                    Map<String, Object> errorMap = new HashMap<>();
                    errorMap.put("error", "Loại báo cáo không hợp lệ: " + reportType);
                    yield errorMap;
                }
            };

            Map<String, Object> report = new HashMap<>();
            report.putAll(reportData);
            report.put("reportType", reportType);
            report.put("period", Map.of(
                "startDate", finalStartDate.toString(), 
                "endDate", finalEndDate.toString()
            ));
            report.put("totalRecords", periodExpenses.size());
            report.put("totalAmount", periodExpenses.stream().mapToDouble(Expense::getTotalAmount).sum());
            
            System.out.println("✅ Successfully generated advanced report");
            return report;
            
        } catch (Exception e) {
            System.err.println("❌ Error in getAdvancedReport: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Lỗi khi tạo báo cáo nâng cao: " + e.getMessage(), e);
        }
    }

    private boolean isDateInRangeCorrected(LocalDate date, LocalDate startDate, LocalDate endDate) {
        boolean isInRange = !date.isBefore(startDate) && !date.isAfter(endDate);
        System.out.println("🔍 Date check: " + date + " in [" + startDate + " to " + endDate + "] = " + isInRange);
        return isInRange;
    }

    private Map<String, Object> calculateStatistics(List<Expense> expenses) {
        if (expenses.isEmpty()) {
            return Map.of(
                "averageDaily", 0.0,
                "maxExpense", 0.0,
                "minExpense", 0.0,
                "expenseCount", 0
            );
        }

        double averageDaily = expenses.stream()
                .mapToDouble(Expense::getTotalAmount)
                .average()
                .orElse(0.0);

        double maxExpense = expenses.stream()
                .mapToDouble(Expense::getTotalAmount)
                .max()
                .orElse(0.0);

        double minExpense = expenses.stream()
                .mapToDouble(Expense::getTotalAmount)
                .min()
                .orElse(0.0);

        return Map.of(
            "averageDaily", Math.round(averageDaily * 100.0) / 100.0,
            "maxExpense", maxExpense,
            "minExpense", minExpense,
            "expenseCount", expenses.size(),
            "totalAmount", expenses.stream().mapToDouble(Expense::getTotalAmount).sum()
        );
    }

    private Map<String, Object> generateMonthlyChartData(List<Expense> expenses, LocalDate startDate, LocalDate endDate) {
        System.out.println("📈 Generating monthly chart data for " + expenses.size() + " expenses");
        
        Map<String, Double> monthlyData = expenses.stream()
                .collect(Collectors.groupingBy(
                    expense -> expense.getExpenseDate().format(DateTimeFormatter.ofPattern("yyyy-MM")),
                    Collectors.summingDouble(Expense::getTotalAmount)
                ));
        
        List<String> labels = new ArrayList<>();
        List<Double> data = new ArrayList<>();
        
        LocalDate current = startDate.withDayOfMonth(1);
        while (!current.isAfter(endDate.withDayOfMonth(1))) {
            String monthKey = current.format(DateTimeFormatter.ofPattern("yyyy-MM"));
            String label = current.format(DateTimeFormatter.ofPattern("MM/yyyy"));
            labels.add(label);
            data.add(monthlyData.getOrDefault(monthKey, 0.0));
            current = current.plusMonths(1);
        }
        
        System.out.println("📊 Monthly chart - Labels: " + labels + ", Data: " + data);
        
        Map<String, Object> result = new HashMap<>();
        result.put("type", "line");
        result.put("labels", labels);
        result.put("datasets", List.of(Map.of(
            "label", "Chi tiêu theo tháng",
            "data", data,
            "borderColor", "#3b82f6",
            "backgroundColor", "rgba(59, 130, 246, 0.1)",
            "tension", 0.4
        )));
        
        return result;
    }

    private Map<String, Object> generateCategoryChartData(List<Expense> expenses, List<Category> categories) {
        System.out.println("🥧 Generating category chart data for " + expenses.size() + " expenses");
        
        Map<Long, Double> categoryTotals = new HashMap<>();
        Map<Long, String> categoryNames = categories.stream()
                .collect(Collectors.toMap(Category::getId, Category::getName));
        Map<Long, String> categoryColors = categories.stream()
                .collect(Collectors.toMap(Category::getId, 
                    cat -> cat.getColorHex() != null ? cat.getColorHex() : "#6b7280"));

        double otherAmount = 0.0;
        
        for (Expense expense : expenses) {
            Long categoryId = expense.getCategoryId();
            if (categoryId != null && categoryNames.containsKey(categoryId)) {
                categoryTotals.put(categoryId, 
                    categoryTotals.getOrDefault(categoryId, 0.0) + expense.getTotalAmount());
            } else {
                otherAmount += expense.getTotalAmount();
            }
        }
        
        List<String> labels = new ArrayList<>();
        List<Double> data = new ArrayList<>();
        List<String> backgroundColors = new ArrayList<>();
        
        for (Map.Entry<Long, Double> entry : categoryTotals.entrySet()) {
            labels.add(categoryNames.get(entry.getKey()));
            data.add(entry.getValue());
            backgroundColors.add(categoryColors.get(entry.getKey()));
        }
        
        if (otherAmount > 0) {
            labels.add("Khác");
            data.add(otherAmount);
            backgroundColors.add("#9ca3af");
        }
        
        System.out.println("📊 Category chart - Labels: " + labels + ", Data: " + data);
        
        Map<String, Object> result = new HashMap<>();
        result.put("type", "doughnut");
        result.put("labels", labels);
        result.put("datasets", List.of(Map.of(
            "label", "Chi tiêu theo danh mục",
            "data", data,
            "backgroundColor", backgroundColors,
            "borderWidth", 2
        )));
        
        return result;
    }

    private Map<String, Object> generateDailyChartData(List<Expense> expenses, LocalDate startDate, LocalDate endDate) {
        System.out.println("📅 Generating daily chart data for " + expenses.size() + " expenses");
        
        Map<LocalDate, Double> dailyData = expenses.stream()
                .collect(Collectors.groupingBy(
                    Expense::getExpenseDate,
                    Collectors.summingDouble(Expense::getTotalAmount)
                ));
        
        List<String> labels = new ArrayList<>();
        List<Double> data = new ArrayList<>();
        
        LocalDate current = startDate;
        while (!current.isAfter(endDate)) {
            labels.add(current.format(DateTimeFormatter.ofPattern("dd/MM")));
            data.add(dailyData.getOrDefault(current, 0.0));
            current = current.plusDays(1);
        }
        
        if (labels.size() > 60) {
            List<String> weeklyLabels = new ArrayList<>();
            List<Double> weeklyData = new ArrayList<>();
            
            current = startDate;
            while (!current.isAfter(endDate)) {
                LocalDate weekStart = current;
                LocalDate weekEnd = current.plusDays(6).isAfter(endDate) ? endDate : current.plusDays(6);
                
                double weekTotal = dailyData.entrySet().stream()
                        .filter(entry -> !entry.getKey().isBefore(weekStart) && !entry.getKey().isAfter(weekEnd))
                        .mapToDouble(Map.Entry::getValue)
                        .sum();
                
                weeklyLabels.add(weekStart.format(DateTimeFormatter.ofPattern("dd/MM")) + " - " + 
                               weekEnd.format(DateTimeFormatter.ofPattern("dd/MM")));
                weeklyData.add(weekTotal);
                
                current = current.plusDays(7);
            }
            
            labels = weeklyLabels;
            data = weeklyData;
        }
        
        System.out.println("📊 Daily chart - Labels: " + labels.size() + " items, Data: " + data.size() + " items");
        
        Map<String, Object> result = new HashMap<>();
        result.put("type", "bar");
        result.put("labels", labels);
        result.put("datasets", List.of(Map.of(
            "label", "Chi tiêu hàng ngày",
            "data", data,
            "backgroundColor", "rgba(99, 102, 241, 0.6)",
            "borderColor", "#4f46e5",
            "borderWidth", 1
        )));
        
        return result;
    }

    private Map<String, Object> generateMonthlyReport(List<Expense> expenses, LocalDate startDate, LocalDate endDate) {
        Map<String, Double> monthlyTotals = expenses.stream()
                .collect(Collectors.groupingBy(
                    expense -> expense.getExpenseDate().format(DateTimeFormatter.ofPattern("yyyy-MM")),
                    Collectors.summingDouble(Expense::getTotalAmount)
                ));

        LocalDate current = startDate.withDayOfMonth(1);
        while (!current.isAfter(endDate.withDayOfMonth(1))) {
            String monthKey = current.format(DateTimeFormatter.ofPattern("yyyy-MM"));
            monthlyTotals.putIfAbsent(monthKey, 0.0);
            current = current.plusMonths(1);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("monthlyBreakdown", monthlyTotals);
        result.put("totalMonths", monthlyTotals.size());
        return result;
    }

    private Map<String, Object> generateCategoryReport(List<Expense> expenses, List<Category> categories) {
        Map<Long, Double> categoryTotals = new HashMap<>();
        Map<Long, String> categoryNames = categories.stream()
                .collect(Collectors.toMap(Category::getId, Category::getName));

        for (Expense expense : expenses) {
            Long categoryId = expense.getCategoryId();
            if (categoryId != null) {
                categoryTotals.put(categoryId, 
                    categoryTotals.getOrDefault(categoryId, 0.0) + expense.getTotalAmount());
            }
        }

        Map<String, Object> resultData = new HashMap<>();
        for (Map.Entry<Long, Double> entry : categoryTotals.entrySet()) {
            String categoryName = categoryNames.getOrDefault(entry.getKey(), "Khác");
            resultData.put(categoryName, entry.getValue());
        }

        Map<String, Object> result = new HashMap<>();
        result.put("categoryBreakdown", resultData);
        result.put("totalCategories", resultData.size());
        return result;
    }

    private Map<String, Object> generatePaymentMethodReport(List<Expense> expenses) {
        Map<Expense.PaymentMethod, Double> methodTotals = expenses.stream()
                .collect(Collectors.groupingBy(
                    Expense::getPaymentMethod,
                    Collectors.summingDouble(Expense::getTotalAmount)
                ));

        Map<String, Double> resultData = new HashMap<>();
        for (Map.Entry<Expense.PaymentMethod, Double> entry : methodTotals.entrySet()) {
            resultData.put(entry.getKey().name(), entry.getValue());
        }

        Map<String, Object> result = new HashMap<>();
        result.put("paymentMethodBreakdown", resultData);
        result.put("totalMethods", resultData.size());
        return result;
    }

    private Map<String, Object> generateTrendReport(List<Expense> expenses, LocalDate startDate, LocalDate endDate) {
        Map<String, Object> trends = new HashMap<>();
        
        if (expenses.size() > 1) {
            Map<String, Double> weeklyTrends = expenses.stream()
                    .collect(Collectors.groupingBy(
                        expense -> expense.getExpenseDate().format(DateTimeFormatter.ofPattern("yyyy-'W'ww")),
                        Collectors.summingDouble(Expense::getTotalAmount)
                    ));
            
            trends.put("weeklyTrends", weeklyTrends);
            trends.put("analysis", "Xu hướng chi tiêu theo tuần");
        }
        
        return trends;
    }

    private List<Map<String, Object>> calculateCategoryBreakdown(
            List<Expense> expenses, 
            List<Category> categories, 
            double totalAmount) {
        
        Map<Long, Double> categoryAmounts = new HashMap<>();
        Map<Long, Category> categoryMap = categories.stream()
                .collect(Collectors.toMap(Category::getId, category -> category));

        double otherAmount = 0.0;

        for (Expense expense : expenses) {
            Long categoryId = expense.getCategoryId();
            if (categoryId != null && categoryMap.containsKey(categoryId)) {
                categoryAmounts.put(categoryId, 
                        categoryAmounts.getOrDefault(categoryId, 0.0) + expense.getTotalAmount());
            } else {
                otherAmount += expense.getTotalAmount();
            }
        }

        List<Map<String, Object>> breakdown = new ArrayList<>();

        for (Map.Entry<Long, Double> entry : categoryAmounts.entrySet()) {
            Long categoryId = entry.getKey();
            Double amount = entry.getValue();
            Category category = categoryMap.get(categoryId);
            
            Map<String, Object> categoryData = new HashMap<>();
            categoryData.put("id", categoryId);
            categoryData.put("name", category.getName());
            categoryData.put("amount", amount);
            categoryData.put("percentage", totalAmount > 0 ? Math.round((amount / totalAmount) * 100 * 100.0) / 100.0 : 0);
            categoryData.put("icon", category.getIcon() != null ? category.getIcon() : "📁");
            categoryData.put("color_hex", category.getColorHex());
            
            breakdown.add(categoryData);
        }

        if (otherAmount > 0) {
            Map<String, Object> otherData = new HashMap<>();
            otherData.put("id", -1L);
            otherData.put("name", "Khác");
            otherData.put("amount", otherAmount);
            otherData.put("percentage", totalAmount > 0 ? Math.round((otherAmount / totalAmount) * 100 * 100.0) / 100.0 : 0);
            otherData.put("icon", "❓");
            otherData.put("color_hex", "#9CA3AF");
            breakdown.add(otherData);
        }

        return breakdown.stream()
                .sorted((a, b) -> Double.compare((Double) b.get("amount"), (Double) a.get("amount")))
                .collect(Collectors.toList());
    }
}