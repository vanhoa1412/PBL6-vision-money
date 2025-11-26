
CREATE DATABASE IF NOT EXISTS pocket_vision_ledger CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE pocket_vision_ledger;


-- ================================================
-- USERS TABLE
-- ================================================
CREATE TABLE users (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    full_name       VARCHAR(100) NOT NULL,
    email           VARCHAR(150) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    avatar_url      VARCHAR(255),
    role            ENUM('USER','ADMIN') DEFAULT 'USER',
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ================================================
-- CATEGORIES TABLE
-- ================================================
CREATE TABLE categories (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT NOT NULL,
    name            VARCHAR(100) NOT NULL,
    color_hex       VARCHAR(10),
    icon            VARCHAR(50),
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ================================================
-- INVOICES TABLE
-- ================================================
CREATE TABLE invoices (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT NOT NULL,
    category_id     BIGINT,
    store_name      VARCHAR(150),
    invoice_date    DATE NOT NULL,
    total_amount    DECIMAL(12,2) NOT NULL,
    payment_method  ENUM('CASH','CREDIT_CARD','BANK_TRANSFER','E_WALLET','OTHER') DEFAULT 'OTHER',
    note            TEXT,
    image_url       VARCHAR(255),
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- ================================================
-- INVOICE ITEMS TABLE
-- ================================================
CREATE TABLE invoice_items (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    invoice_id      BIGINT NOT NULL,
    item_name       VARCHAR(150) NOT NULL,
    quantity        INT DEFAULT 1,
    unit_price      DECIMAL(10,2) NOT NULL,
    total_price     DECIMAL(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
);

-- ================================================
-- BUDGETS TABLE
-- ================================================
CREATE TABLE budgets (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT NOT NULL,
    category_id     BIGINT NOT NULL,
    month_year      CHAR(7) NOT NULL,     -- ví dụ: '2025-10'
    limit_amount    DECIMAL(12,2) NOT NULL,
    spent_amount    DECIMAL(12,2) DEFAULT 0,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    UNIQUE KEY uniq_budget (user_id, category_id, month_year)
);

-- ================================================
-- INCOME TABLE (Tùy chọn - Theo dõi thu nhập)
-- ================================================
CREATE TABLE incomes (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT NOT NULL,
    category_id     BIGINT,
    source_name     VARCHAR(150) NOT NULL,
    amount          DECIMAL(12,2) NOT NULL,
    income_date     DATE NOT NULL,
    note            TEXT,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- ================================================
-- NOTIFICATIONS TABLE
-- ================================================
CREATE TABLE notifications (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT NOT NULL,
    type            ENUM('BUDGET_WARNING','NEW_INVOICE','PAYMENT_REMINDER','GENERAL') DEFAULT 'GENERAL',
    message         VARCHAR(255) NOT NULL,
    related_id      BIGINT,
    is_read         BOOLEAN DEFAULT FALSE,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE expenses (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    category_id BIGINT,
    store_name VARCHAR(150),  -- 🔹 tên cửa hàng / nơi chi tiêu
    total_amount DECIMAL(12,2) NOT NULL,  -- 🔹 tổng tiền chi
    payment_method ENUM('CASH','CREDIT_CARD','BANK_TRANSFER','E_WALLET','OTHER') DEFAULT 'OTHER',  -- 🔹 phương thức thanh toán
    note VARCHAR(255),
    expense_date DATE NOT NULL,  -- 🔹 ngày chi tiêu
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- ================================================
-- INDEXES (Tăng hiệu năng tìm kiếm)
-- ================================================
CREATE INDEX idx_invoice_user ON invoices(user_id);
CREATE INDEX idx_invoice_category ON invoices(category_id);
CREATE INDEX idx_item_invoice ON invoice_items(invoice_id);
CREATE INDEX idx_budget_user ON budgets(user_id);
CREATE INDEX idx_notification_user ON notifications(user_id);

