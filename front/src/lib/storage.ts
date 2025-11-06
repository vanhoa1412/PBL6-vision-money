// Local storage utilities for Pocket Vision Ledger

export interface User {
  id: number;
  fullName: string;
  email: string;
  role: 'USER' | 'ADMIN';
  avatarUrl?: string | null;
  created_at?: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  color_hex: string;
  icon: string;
  created_at: string;
}

export interface Invoice {
  id: string;
  user_id: string;
  category_id?: string;
  store_name?: string;
  invoice_date: string;
  total_amount: number;
  payment_method: 'CASH' | 'CREDIT_CARD' | 'BANK_TRANSFER' | 'E_WALLET' | 'OTHER';
  note?: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  month_year: string;
  limit_amount: number;
  spent_amount: number;
  created_at: string;
}

// Storage keys
const STORAGE_KEYS = {
  USER: 'pvl_user',
  CATEGORIES: 'pvl_categories',
  INVOICES: 'pvl_invoices',
  BUDGETS: 'pvl_budgets',
};

// User operations
export const storage = {
  user: {
    get(): User | null {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    },
    set(user: User) {
      localStorage.setItem("user", JSON.stringify(user));
    },
    remove() {
      localStorage.removeItem("user");
    },
  },
  
  categories: {
    getAll: (): Category[] => {
      const data = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      return data ? JSON.parse(data) : [];
    },
    set: (categories: Category[]) => {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    },
    add: (category: Omit<Category, 'id' | 'created_at'>) => {
      const categories = storage.categories.getAll();
      const newCategory: Category = {
        ...category,
        id: Date.now().toString(),
        created_at: new Date().toISOString(),
      };
      categories.push(newCategory);
      storage.categories.set(categories);
      return newCategory;
    },
    delete: (id: string) => {
      const categories = storage.categories.getAll().filter(c => c.id !== id);
      storage.categories.set(categories);
    },
  },
  
  invoices: {
    getAll: (): Invoice[] => {
      const data = localStorage.getItem(STORAGE_KEYS.INVOICES);
      return data ? JSON.parse(data) : [];
    },
    set: (invoices: Invoice[]) => {
      localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
    },
    add: (invoice: Omit<Invoice, 'id' | 'created_at' | 'updated_at'>) => {
      const invoices = storage.invoices.getAll();
      const newInvoice: Invoice = {
        ...invoice,
        id: Date.now().toString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      invoices.push(newInvoice);
      storage.invoices.set(invoices);
      return newInvoice;
    },
    update: (id: string, updates: Partial<Invoice>) => {
      const invoices = storage.invoices.getAll();
      const index = invoices.findIndex(i => i.id === id);
      if (index !== -1) {
        invoices[index] = {
          ...invoices[index],
          ...updates,
          updated_at: new Date().toISOString(),
        };
        storage.invoices.set(invoices);
        return invoices[index];
      }
      return null;
    },
    delete: (id: string) => {
      const invoices = storage.invoices.getAll().filter(i => i.id !== id);
      storage.invoices.set(invoices);
    },
  },
  
  budgets: {
    getAll: (): Budget[] => {
      const data = localStorage.getItem(STORAGE_KEYS.BUDGETS);
      return data ? JSON.parse(data) : [];
    },
    set: (budgets: Budget[]) => {
      localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(budgets));
    },
    add: (budget: Omit<Budget, 'id' | 'created_at'>) => {
      const budgets = storage.budgets.getAll();
      const newBudget: Budget = {
        ...budget,
        id: Date.now().toString(),
        created_at: new Date().toISOString(),
      };
      budgets.push(newBudget);
      storage.budgets.set(budgets);
      return newBudget;
    },
    update: (id: string, updates: Partial<Budget>) => {
      const budgets = storage.budgets.getAll();
      const index = budgets.findIndex(b => b.id === id);
      if (index !== -1) {
        budgets[index] = { ...budgets[index], ...updates };
        storage.budgets.set(budgets);
        return budgets[index];
      }
      return null;
    },
    delete: (id: string) => {
      const budgets = storage.budgets.getAll().filter(b => b.id !== id);
      storage.budgets.set(budgets);
    },
  },
};
