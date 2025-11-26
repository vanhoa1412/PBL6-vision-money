package com.pocketvision.ledger;

import io.github.bonigarcia.wdm.WebDriverManager;
import org.junit.jupiter.api.*;
import org.openqa.selenium.*;
import org.openqa.selenium.chrome.ChromeDriver;

import static org.junit.jupiter.api.Assertions.*;

@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class AuthLoginSeleniumTest {

    private static WebDriver driver;

    @BeforeAll
    static void setupClass() {
        WebDriverManager.chromedriver().setup();
        driver = new ChromeDriver();
        driver.manage().window().maximize();
    }

    @BeforeEach
    void openLoginPage() {
        driver.get("http://localhost:8081/login");
    }

    @Test
    @Order(1)
    @DisplayName("FI-L1: Kiểm tra trang đăng nhập hiển thị đúng")
    void testLoginPageLoads() {
        assertTrue(driver.findElement(By.id("email")).isDisplayed());
        assertTrue(driver.findElement(By.id("password")).isDisplayed());
        assertTrue(driver.findElement(By.cssSelector("button[type='submit']")).isDisplayed());
    }

    @Test
    @Order(2)
    @DisplayName("FI-L2: Đăng nhập hợp lệ")
    void testValidLogin() throws InterruptedException {
        driver.findElement(By.id("email")).sendKeys("A@gmail.com");
        driver.findElement(By.id("password")).sendKeys("1234567");
        driver.findElement(By.cssSelector("button[type='submit']")).click();

        Thread.sleep(2500); 

        assertTrue(driver.getCurrentUrl().contains("/dashboard"),
                "Không chuyển hướng sang dashboard sau khi đăng nhập!");
    }

    @Test
    @Order(3)
    @DisplayName("FI-L3: Đăng nhập sai mật khẩu")
    void testInvalidPassword() throws InterruptedException {
        driver.findElement(By.id("email")).sendKeys("test@gmail.com");
        driver.findElement(By.id("password")).sendKeys("saimatkhau123");
        driver.findElement(By.cssSelector("button[type='submit']")).click();

        Thread.sleep(2000);

        WebElement toast = driver.findElement(By.cssSelector(".toast-destructive"));
        assertTrue(toast.isDisplayed(), "Không hiển thị thông báo lỗi khi sai mật khẩu!");
    }

    @Test
    @Order(4)
    @DisplayName("FI-L4: Đăng nhập với email không tồn tại")
    void testNonExistingEmail() throws InterruptedException {
        driver.findElement(By.id("email")).sendKeys("nonexistent" + System.currentTimeMillis() + "@gmail.com");
        driver.findElement(By.id("password")).sendKeys("123456");
        driver.findElement(By.cssSelector("button[type='submit']")).click();

        Thread.sleep(2000);

        WebElement toast = driver.findElement(By.cssSelector(".toast-destructive"));
        assertTrue(toast.isDisplayed(), "Không hiển thị thông báo lỗi khi email không tồn tại!");
    }

    @AfterAll
    static void tearDown() {
        if (driver != null) {
            driver.quit();
        }
    }
}
