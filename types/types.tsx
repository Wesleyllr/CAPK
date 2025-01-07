export interface IProduct {
    id: string;
    title: string;
    value: number;
    imageUrl?: string;
    quantity: number;
  }
  
  export interface ICartItem extends IProduct {
    observations?: string;
  }
  
  export type OrderStatus = "completed" | "pending" | "canceled";
  
  export interface IOrder {
    id: string;
    userId: string;
    items: ICartItem[];
    total: number;
    status: OrderStatus;
    createdAt: Date;
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