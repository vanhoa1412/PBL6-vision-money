package com.pocketvision.ledger;

import org.junit.jupiter.api.*;
import org.openqa.selenium.*;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.time.Duration;
import java.util.List;

@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class SearchExpenseSeleniumTest {
    private static WebDriver driver;
    private static WebDriverWait wait;
    private final String BASE_URL = "http://localhost:8081/search";

    @BeforeAll
    static void setup() {
        driver = new ChromeDriver();
        driver.manage().window().maximize();
        wait = new WebDriverWait(driver, Duration.ofSeconds(8));
    }

    @BeforeEach
    void openSearchPage() {
        driver.get(BASE_URL);
    }

    private WebElement getSearchInput() {
        return wait.until(ExpectedConditions.presenceOfElementLocated(
                By.cssSelector("input[placeholder='Nhập tên cửa hàng, ghi chú, số tiền...']")));
    }

    private WebElement getSearchButton() {
        return driver.findElement(By.xpath("//button[contains(.,'Tìm kiếm')]"));
    }

    private List<WebElement> getResults() {
        return driver.findElements(By.cssSelector("table tbody tr"));
    }

    private String getMessage() {
        List<WebElement> msg = driver.findElements(By.cssSelector("p.text-red-600"));
        return msg.isEmpty() ? "" : msg.get(0).getText();
    }

    @Test
    @Order(1)
    void SE01_TimTheoTenHopLe() {
        getSearchInput().clear();
        getSearchInput().sendKeys("Vinmart");
        getSearchButton().click();

        wait.until(ExpectedConditions.or(
                ExpectedConditions.presenceOfElementLocated(By.cssSelector("table tbody tr")),
                ExpectedConditions.presenceOfElementLocated(By.cssSelector("p.text-red-600"))
        ));

        
        boolean found = getResults().stream()
                .anyMatch(r -> r.getText().toLowerCase().contains("vinmart"));

        Assertions.assertTrue(found, "❌ Không tìm thấy kết quả chứa 'vinmart'");
    }

    @Test
    @Order(2)
    void SE02_TimTheoSoTienHopLe() {
        getSearchInput().clear();
        getSearchInput().sendKeys("500000");
        getSearchButton().click();

        wait.until(ExpectedConditions.or(
                ExpectedConditions.presenceOfElementLocated(By.cssSelector("table tbody tr")),
                ExpectedConditions.presenceOfElementLocated(By.cssSelector("p.text-red-600"))
        ));

        
        boolean found = getResults().stream()
                .map(WebElement::getText)
                .map(text -> text.replace(".", "").replace("₫", "").replace(" ", "")) // bỏ dấu . và ₫
                .anyMatch(t -> t.contains("500000"));

        Assertions.assertTrue(found, "❌ Không tìm thấy chi tiêu có số tiền 500000");
    }


    @Test
    @Order(3)
    void SE03_TimKiemKhongTonTai() {
        getSearchInput().sendKeys("ABCXYZ");
        getSearchButton().click();

        wait.until(ExpectedConditions.presenceOfElementLocated(By.cssSelector("p.text-red-600")));
        Assertions.assertTrue(getMessage().contains("Không tìm thấy dữ liệu"),
                "Không hiển thị thông báo 'Không tìm thấy dữ liệu'");
    }

    @Test
    @Order(4)
    void SE04_TimKiemBoTrong() {
        getSearchInput().clear();
        getSearchButton().click();

        wait.until(ExpectedConditions.presenceOfElementLocated(By.cssSelector("p.text-red-600")));
        Assertions.assertTrue(getMessage().contains("Vui lòng nhập từ khóa"),
                "Không hiển thị thông báo khi để trống ô tìm kiếm");
    }

    @Test
    @Order(5)
    void SE05_KhongPhanBietHoaThuong() {
        getSearchInput().sendKeys("vinmart");
        getSearchButton().click();

        wait.until(ExpectedConditions.or(
                ExpectedConditions.presenceOfElementLocated(By.cssSelector("table tbody tr")),
                ExpectedConditions.presenceOfElementLocated(By.cssSelector("p.text-red-600"))
        ));

        Assertions.assertTrue(
                getResults().stream().anyMatch(r -> r.getText().toLowerCase().contains("vinmart")),
                "Không tìm thấy kết quả chứa 'vinmart'");
    }

    @Test
    @Order(6)
    void SE06_TimKyTuDacBiet() {
        getSearchInput().sendKeys("#2025");
        getSearchButton().click();

        wait.until(ExpectedConditions.or(
                ExpectedConditions.presenceOfElementLocated(By.cssSelector("table tbody tr")),
                ExpectedConditions.presenceOfElementLocated(By.cssSelector("p.text-red-600"))
        ));

        Assertions.assertTrue(
                getResults().stream().anyMatch(r -> r.getText().contains("#2025")),
                "Không tìm thấy hóa đơn chứa ký tự #2025");
    }

    @AfterAll
    static void teardown() {
        driver.quit();
    }
}
