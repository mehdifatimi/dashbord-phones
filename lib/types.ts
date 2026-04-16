export interface Category {
  id: string;
  name: string;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  category_id: string;
  purchase_price: number;
  sale_price: number;
  stock: number;
  image_url: string | null;
  created_at: string;
  categories?: Category;
}

export interface Sale {
  id: string;
  product_id: string;
  quantity: number;
  total_price: number;
  profit: number;
  created_at: string;
  products?: Product;
}

export interface DashboardStats {
  totalProducts: number;
  totalSales: number;
  totalProfit: number;
  lowStockProducts: Product[];
  recentSales: Sale[];
}
