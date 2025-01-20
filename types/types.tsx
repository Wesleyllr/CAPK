export interface IProduct {
  id: string;
  title: string;
  value: number | null;
  imageUrl?: string;
  quantity: number;
  isVariablePrice?: boolean;
}

export interface ICartItem extends IProduct {
  observations?: string;
}

export type OrderStatus = "completed" | "pending" | "canceled";

export interface IOrder {
  id: string;
  idOrder: string; // Novo campo para o número sequencial
  userId: string;
  items: ICartItem[];
  total: number;
  status: OrderStatus;
  createdAt: Date;
  nomeCliente: string;
  categoryId?: string;
}

export interface SalesMetric {
  daily: number;
  weekly: number;
  monthly: number;
}

// Remove OrderMetric pois IOrder já contém essa informação
export interface DashboardData {
  salesMetrics: SalesMetric;
  orders: IOrder[];
  revenueMetrics: {
    totalRevenue: number;
    averageOrderValue: number;
    orderCount: number;
  };
}
