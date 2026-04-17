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
  imei?: string;
  created_at: string;
  products?: Product;
}

export interface Repair {
  id: string;
  customer_name: string;
  customer_phone: string;
  device_model: string;
  imei?: string;
  issue_description: string;
  estimated_price: number;
  status: 'Pending' | 'In Progress' | 'Ready' | 'Delivered' | 'Cancelled';
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  totalProducts: number;
  totalSales: number;
  totalProfit: number;
  totalRevenue: number;
  activeRepairs: number;
  lowStockProducts: Product[];
  recentSales: Sale[];
}
