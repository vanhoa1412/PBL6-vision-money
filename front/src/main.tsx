import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Áp dụng theme ngay lập tức trước khi React render để tránh flash
const applyThemeOnMount = () => {
  const theme = localStorage.getItem("vision-ledger-theme") || "light";
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  
  // Nếu là system, lấy theme từ system preference
  if (theme === "system") {
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    root.classList.add(systemTheme);
  } else {
    root.classList.add(theme);
  }
};

applyThemeOnMount();

createRoot(document.getElementById("root")!).render(<App />);
