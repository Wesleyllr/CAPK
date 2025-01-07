import {
  collection,
  query,
  where,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { db, auth } from "@/firebaseConfig";
import { DashboardData, IOrder } from "@/types/types";

export class DashboardService {
  static async getDashboardData(): Promise<DashboardData> {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error("Usuário não autenticado");

    const now = new Date();
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const ordersRef = collection(db, "orders");
    const ordersQuery = query(
      ordersRef,
      where("userId", "==", userId),
      where("status", "==", "completed")
    );

    const querySnapshot = await getDocs(ordersQuery);
    const orders = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as IOrder[];

    // Calcular métricas de vendas
    const salesMetrics = {
      daily: this.calculateTotalSales(orders, startOfDay),
      weekly: this.calculateTotalSales(orders, startOfWeek),
      monthly: this.calculateTotalSales(orders, startOfMonth),
    };

    // Calcular métricas de receita
    const revenueMetrics = {
      totalRevenue: orders.reduce((sum, order) => sum + order.total, 0),
      averageOrderValue:
        orders.length > 0
          ? orders.reduce((sum, order) => sum + order.total, 0) / orders.length
          : 0,
      orderCount: orders.length,
    };

    return {
      salesMetrics,
      orders,
      revenueMetrics,
    };
  }

  private static calculateTotalSales(
    orders: IOrder[],
    startDate: Date
  ): number {
    return orders
      .filter((order) => order.createdAt >= startDate)
      .reduce((sum, order) => sum + order.total, 0);
  }
}
