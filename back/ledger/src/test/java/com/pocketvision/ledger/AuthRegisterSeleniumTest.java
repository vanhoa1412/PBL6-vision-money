package com.pocketvision.ledger;

import io.github.bonigarcia.wdm.WebDriverManager;
import org.junit.jupiter.api.*;
import org.openqa.selenium.*;
import org.openqa.selenium.chrome.ChromeDriver;

import static org.junit.jupiter.api.Assertions.*;

@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class AuthRegisterSeleniumTest {

    private static WebDriver driver;

    @BeforeAll
    static void setupClass() {
        WebDriverManager.chromedriver().setup();
        driver = new ChromeDriver();
        driver.manage().window().maximize();
    }

    @BeforeEach
    void openRegisterPage() {
        driver.get("http://localhost:8081/register");
    }

    @Test
    @Order(1)
    @DisplayName("FI-R1: Kiểm tra trang đăng ký hiển thị đúng")
    void testRegisterPageLoads() {
        assertTrue(driver.findElement(By.id("fullName")).isDisplayed());
        assertTrue(driver.findElement(By.id("email")).isDisplayed());
        assertTrue(driver.findElement(By.id("password")).isDisplayed());
        assertTrue(driver.findElement(By.id("confirmPassword")).isDisplayed());
    }

    @Test
    @Order(2)
    @DisplayName("FI-R2: Đăng ký tài khoản hợp lệ")
    void testValidRegistration() throws InterruptedException {
        String uniqueEmail = "test" + System.currentTimeMillis() + "@gmail.com";

        driver.findElement(By.id("fullName")).sendKeys("Nguyễn Văn Test");
        driver.findElement(By.id("email")).sendKeys(uniqueEmail);
        driver.findElement(By.id("password")).sendKeys("1234567");
        driver.findElement(By.id("confirmPassword")).sendKeys("1234567");

        driver.findElement(By.cssSelector("button[type='submit']")).click();

        Thread.sleep(2500);

        assertTrue(driver.getCurrentUrl().contains("/dashboard") ||
                   driver.getCurrentUrl().contains("dashboard"),
                   "Không chuyển hướng sang dashboard sau khi đăng ký!");
    }

    @Test
    @Order(3)
    @DisplayName("FI-R3: Đăng ký thất bại khi mật khẩu xác nhận sai")
    void testPasswordMismatch() throws InterruptedException {
        driver.findElement(By.id("fullName")).sendKeys("Nguyen Sai Mat Khau");
        driver.findElement(By.id("email")).sendKeys("wrong" + System.currentTimeMillis() + "@gmail.com");
        driver.findElement(By.id("password")).sendKeys("123456");
        driver.findElement(By.id("confirmPassword")).sendKeys("654321");

        driver.findElement(By.cssSelector("button[type='submit']")).click();

        Thread.sleep(2000);

        WebElement toast = driver.findElement(By.cssSelector(".toast-destructive"));
        assertTrue(toast.isDisplayed(), "Không hiển thị thông báo lỗi khi mật khẩu không khớp!");
    }

    @AfterAll
    static void tearDown() {
        if (driver != null) {
            driver.quit();
        }
    }
}
