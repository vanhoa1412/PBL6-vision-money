package com.pocketvision.ledger;

import io.github.bonigarcia.wdm.WebDriverManager;
import org.junit.jupiter.api.*;
import org.openqa.selenium.*;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.support.ui.*;

import java.time.Duration;

import static org.junit.jupiter.api.Assertions.*;

@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class AddExpenseSeleniumTest {

    private static WebDriver driver;
    private static WebDriverWait wait;

    @BeforeAll
    static void setupClass() {
        WebDriverManager.chromedriver().setup();
        driver = new ChromeDriver();
        driver.manage().window().maximize();
        wait = new WebDriverWait(driver, Duration.ofSeconds(8));
    }

    @BeforeEach
    void loginAndOpenAddExpense() throws InterruptedException {
        driver.get("http://localhost:8081/login");

        // Đăng nhập
        WebElement email = wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("email")));
        email.clear();
        email.sendKeys("test1762430556211@gmail.com");

        WebElement password = driver.findElement(By.id("password"));
        password.clear();
        password.sendKeys("1234567");

        driver.findElement(By.cssSelector("button[type='submit']")).click();

        // Chờ load trang và chuyển hướng
        Thread.sleep(1500);
        driver.get("http://localhost:8081/expenses/add");
    }

    /** 🔽 Chọn danh mục (Select của shadcn/ui) */
    private void selectCategory(String name) {
        try {
            // Tìm phần tử <select> ẩn chứa danh mục
            WebElement select = driver.findElement(By.xpath("//label[contains(.,'Danh mục')]/following-sibling::select"));

            // Lấy option cần chọn
            WebElement option = select.findElement(By.xpath(".//option[contains(normalize-space(.),'" + name + "')]"));

            // Gán giá trị option và kích hoạt sự kiện change bằng JavaScript
            JavascriptExecutor js = (JavascriptExecutor) driver;
            js.executeScript("arguments[0].value = arguments[1].value; arguments[0].dispatchEvent(new Event('change', { bubbles: true }));", select, option);

            System.out.println("✅ Đã chọn danh mục: " + name);

        } catch (Exception e) {
            System.err.println("❌ Lỗi khi chọn danh mục: " + e.getMessage());
            throw e;
        }
    }



    /** 🔽 Chọn phương thức thanh toán */
    private void selectPayment(String label) {
        try {
            WebElement select = driver.findElement(By.xpath("//label[contains(.,'Phương thức thanh toán')]/following-sibling::select"));
            WebElement option = select.findElement(By.xpath(".//option[contains(normalize-space(.),'" + label + "')]"));
            JavascriptExecutor js = (JavascriptExecutor) driver;
            js.executeScript(
                    "arguments[0].value = arguments[1].value;" +
                    "arguments[0].dispatchEvent(new Event('change', { bubbles: true }));",
                    select, option
            );
            System.out.println("✅ Đã chọn phương thức thanh toán: " + label);
        } catch (Exception e) {
            System.err.println("❌ Lỗi khi chọn phương thức thanh toán: " + e.getMessage());
            throw e;
        }
    }

    /** 🔽 Điền thông tin cơ bản */
    private void fillBasicInfo(String store, String amount, String category, String note) {
        // Tên cửa hàng
        WebElement storeInput = wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("storeName")));
        storeInput.clear();
        storeInput.sendKeys(store);

        // Ngày chi tiêu
        WebElement dateInput = driver.findElement(By.xpath("//input[@type='date']"));
        if (dateInput.getAttribute("value").isEmpty()) {
            dateInput.sendKeys("2025-11-06");
        }

        // Số tiền
        WebElement amountInput = driver.findElement(By.xpath("//input[@type='number']"));
        amountInput.clear();
        if (amount != null && !amount.isEmpty()) amountInput.sendKeys(amount);

        // Danh mục
        if (category != null && !category.isEmpty()) selectCategory(category);

        // Phương thức thanh toán
        selectPayment("Tiền mặt");

        // Ghi chú
        if (note != null) {
            WebElement noteArea = driver.findElement(By.tagName("textarea"));
            noteArea.clear();
            noteArea.sendKeys(note);
        }
    }

    /** 🔽 Gửi form và chờ kết quả */
    private void submitAndWait() throws InterruptedException {
        WebElement submitBtn = wait.until(ExpectedConditions.elementToBeClickable(
                By.xpath("//button[contains(.,'Thêm chi tiêu')]")));
        submitBtn.click();
        Thread.sleep(1500);
    }

    /** 🔽 Kiểm tra toast */
    private void expectToastContains(String text) {
        WebElement toast = wait.until(ExpectedConditions.visibilityOfElementLocated(
                By.xpath("//*[contains(.,'" + text + "') and (contains(@class,'toast') or contains(@class,'Toast'))]")));
        assertTrue(toast.isDisplayed(), "Không thấy thông báo chứa: " + text);
    }

    // ✅ EX-01: Thêm khoản chi tiêu hợp lệ
    @Test @Order(1)
    void testAddExpenseValid() throws InterruptedException {
        fillBasicInfo("Highlands Coffee", "500000", "Ăn Uống", "Ăn trưa công ty");
        submitAndWait();
        assertTrue(driver.getCurrentUrl().contains("/expenses"));
    }

    

    // ✅ EX-03: Số tiền = 0
    @Test @Order(3)
    void testAddExpenseZeroAmount() throws InterruptedException {
        fillBasicInfo("Xe buýt", "0", "Ăn Uống", "Đi lại công việc");
        submitAndWait();
        expectToastContains("Số tiền phải lớn hơn 0");
    }



    // ✅ EX-05: Không chọn danh mục
    @Test @Order(5)
    void testAddExpenseNoCategory() throws InterruptedException {
        fillBasicInfo("The Coffee House", "300000", null, "Mua cafe");
        submitAndWait();
        expectToastContains("Vui lòng chọn danh mục");
    }

    // ✅ EX-06: Số tiền quá lớn
    @Test @Order(6)
    void testAddExpenseTooLarge() throws InterruptedException {
        fillBasicInfo("Tiki", "100000000000", "Ăn Uống", null);
        submitAndWait();
        expectToastContains("Giá trị vượt mức cho phép");
    }

    // ✅ EX-07: Ghi chú quá dài
    @Test @Order(7)
    void testAddExpenseLongNote() throws InterruptedException {
        String longNote = "A".repeat(300);
        fillBasicInfo("Shopee", "200000", "Ăn Uống", longNote);
        submitAndWait();
        expectToastContains("Nội dung ghi chú quá dài");
    }

    @AfterAll
    static void tearDown() {
        if (driver != null) driver.quit();
    }
}
