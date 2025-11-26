
package com.pocketvision.ledger;

import org.junit.jupiter.api.*;
import org.openqa.selenium.*;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.support.ui.*;

import java.time.Duration;

@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class BudgetSeleniumTest {

    private WebDriver driver;
    private WebDriverWait wait;

    @BeforeEach
    void setUp() {
        driver = new ChromeDriver();
        driver.manage().window().maximize();
        wait = new WebDriverWait(driver, Duration.ofSeconds(10));
        driver.get("http://localhost:8081/login");
    }

    @AfterEach
    void tearDown() {
        if (driver != null) {
            driver.quit();
        }
    }

    // ------------------- HÀM TIỆN ÍCH -------------------

    private void login() throws InterruptedException {
        WebElement emailInput = wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("email")));
        emailInput.sendKeys("test1762430556211@gmail.com"); 

        WebElement passwordInput = driver.findElement(By.id("password"));
        passwordInput.sendKeys("1234567"); 

        WebElement loginButton = driver.findElement(By.xpath("//button[contains(.,'Đăng nhập')]"));
        loginButton.click();

        wait.until(ExpectedConditions.urlContains("/dashboard"));
        Thread.sleep(500);
    }

    private void openBudgetPage() throws InterruptedException {
        driver.get("http://localhost:8081/budgets");
        wait.until(ExpectedConditions.visibilityOfElementLocated(
                By.xpath("//h1[contains(.,'Quản lý ngân sách')]")));
        Thread.sleep(500);
    }

    private void openBudgetDialog() throws InterruptedException {
        WebElement addButton = wait.until(ExpectedConditions.elementToBeClickable(
                By.xpath("//button[contains(.,'Thêm ngân sách')]")));
        addButton.click();

        wait.until(ExpectedConditions.visibilityOfElementLocated(
                By.xpath("//h2[contains(.,'Thêm ngân sách mới')]")));
        Thread.sleep(500);
    }

    private void selectCategory(String categoryName) throws InterruptedException {
        WebElement dropdownTrigger = wait.until(
                ExpectedConditions.elementToBeClickable(By.id("categoryDropdown")));
        dropdownTrigger.click();
        Thread.sleep(500);

        WebElement categoryItem = wait.until(ExpectedConditions.elementToBeClickable(
                By.xpath(String.format("//div[contains(@data-testid,'category-')][contains(.,'%s')]", categoryName))
        ));
        ((JavascriptExecutor) driver).executeScript("arguments[0].scrollIntoView(true);", categoryItem);
        Thread.sleep(300);
        categoryItem.click();
        Thread.sleep(500);
    }

    private void submitDialog() throws InterruptedException {
        WebElement dialog = wait.until(ExpectedConditions.visibilityOfElementLocated(
                By.xpath("//div[contains(@role,'dialog')]")));

        WebElement submitButton = dialog.findElement(By.xpath(".//button[contains(.,'Thêm ngân sách') or contains(.,'Cập nhật')]"));
        ((JavascriptExecutor) driver).executeScript("arguments[0].scrollIntoView(true);", submitButton);
        Thread.sleep(300);
        ((JavascriptExecutor) driver).executeScript("arguments[0].click();", submitButton);

        Thread.sleep(1500);
    }

    // ------------------- TEST CASE CHÍNH -------------------

    

    @Test
    @Order(1)
    @DisplayName("BD02: Thiết lập ngân sách = 0 → báo lỗi 'Ngân sách phải lớn hơn 0'")
    void testCreateZeroBudget() throws InterruptedException {
        login();
        openBudgetPage();
        openBudgetDialog();

        selectCategory("Ăn Uống");

        WebElement limitInput = wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("limitAmount")));
        limitInput.clear();
        limitInput.sendKeys("0");
        Thread.sleep(500);

        submitDialog();

        String pageSource = driver.getPageSource();
        Assertions.assertTrue(
                pageSource.contains("Ngân sách phải lớn hơn 0"),
                "❌ Không hiển thị thông báo lỗi 'Ngân sách phải lớn hơn 0'."
        );
    }

    @Test
    @Order(2)
    @DisplayName("BD03: Thiết lập ngân sách âm → báo lỗi 'Số tiền không hợp lệ'")
    void testCreateNegativeBudget() throws InterruptedException {
        login();
        openBudgetPage();
        openBudgetDialog();

        selectCategory("Ăn Uống");

        WebElement limitInput = wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("limitAmount")));
        limitInput.clear();
        limitInput.sendKeys("-1000000");
        Thread.sleep(500);

        submitDialog();

        String pageSource = driver.getPageSource();
        Assertions.assertTrue(
                pageSource.contains("Số tiền không hợp lệ"),
                "❌ Không hiển thị lỗi 'Số tiền không hợp lệ' khi nhập âm."
        );
    }

    @Test
    @Order(3)
    @DisplayName("BD01: Thiết lập ngân sách hợp lệ")
    void testCreateValidBudget() throws InterruptedException {
        login();
        openBudgetPage();
        openBudgetDialog();

        selectCategory("Ăn Uống");

        WebElement limitInput = wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("limitAmount")));
        limitInput.clear();
        limitInput.sendKeys("5000000");
        Thread.sleep(500);

        submitDialog();

        Thread.sleep(1500);
        String pageSource = driver.getPageSource();
        Assertions.assertTrue(
                pageSource.contains("5.000.000") || pageSource.contains("5,000,000"),
                "❌ Ngân sách không hiển thị sau khi lưu."
        );
    }

}

