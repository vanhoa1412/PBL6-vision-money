import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Expenses from "./pages/Expenses";
import AddExpense from "./pages/AddExpense";
import EditExpense from "./pages/EditExpense";
import Budgets from "./pages/Budgets";
import Invoices from "./pages/Invoices";
import UploadInvoice from "./pages/UploadInvoice";
import Reports from "./pages/Reports";
import AISuggestions from "./pages/AISuggestions";
import Notifications from "./pages/Notifications";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import Categories from "./pages/Categories";
import SearchExpenses from "./pages/SearchExpenses";
import FillExpense from "./pages/FillExpense";
import Settings from './pages/Settings';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/expenses/add" element={<AddExpense />} />
          <Route path="/expenses/edit/:id" element={<EditExpense />} />
          <Route path="/budgets" element={<Budgets />} />
          <Route path="/invoices" element={<Invoices />} />
          <Route path="/invoices/upload" element={<UploadInvoice />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/ai-suggestions" element={<AISuggestions />} />
          <Route path="/Notifications" element={<Notifications />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/search" element={<SearchExpenses />} />
          <Route path="/fill" element={<FillExpense />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
