import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Theme = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultTheme = "light",
  storageKey = "vision-ledger-theme",
}) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Lấy theme từ localStorage hoặc dùng default
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(storageKey) as Theme;
      if (stored === "light" || stored === "dark" || stored === "system") {
        return stored;
      }
    }
    return defaultTheme;
  });

  // Hàm lấy theme từ system preference
  const getSystemTheme = (): ResolvedTheme => {
    if (typeof window !== "undefined") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    return "light";
  };

  // Tính toán resolved theme (theme thực tế được áp dụng)
  const resolvedTheme: ResolvedTheme = theme === "system" ? getSystemTheme() : theme;

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Xóa class cũ
    root.classList.remove("light", "dark");
    
    // Thêm class mới dựa trên resolved theme
    root.classList.add(resolvedTheme);
    
    // Lưu vào localStorage (chỉ lưu theme được chọn, không lưu resolved theme)
    localStorage.setItem(storageKey, theme);
  }, [theme, resolvedTheme, storageKey]);

  // Lắng nghe thay đổi system preference khi theme là "system"
  useEffect(() => {
    if (theme !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      const root = window.document.documentElement;
      root.classList.remove("light", "dark");
      root.classList.add(getSystemTheme());
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

