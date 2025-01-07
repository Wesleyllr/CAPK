import {
  collection,
  query,
  where,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { db, auth } from "@/firebaseConfig";
import { IOrder } from "@/types/types";

export class ProductSalesService {
  private static ORDERS_COLLECTION = "orders";

  static async getWeeklySales() {
    try {
      const user = auth.currentUser;

      if (!user) throw new Error("Usuário não autenticado");
      const userId = user.uid;

      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - 7);

      const ordersRef = collection(db, `orders/${userId}/vendas`);

      const q = query(
        ordersRef,
        where("createdAt", ">=", Timestamp.fromDate(weekStart))
      );

      const querySnapshot = await getDocs(q);

      // Inicializa um objeto para armazenar vendas por dia
      const salesByDay = {
        Dom: 0,
        Seg: 0,
        Ter: 0,
        Qua: 0,
        Qui: 0,
        Sex: 0,
        Sab: 0,
      };

      // Processa cada pedido
      querySnapshot.forEach((doc) => {
        const order = { id: doc.id, ...doc.data() } as IOrder;
        const orderDate = order.createdAt.toDate();
        const dayName = this.getDayName(orderDate);
        salesByDay[dayName] += order.total;
      });

      // Converte para o formato que o VictoryBar espera
      const chartData = Object.entries(salesByDay).map(([day, sales]) => ({
        day,
        sales,
      }));

      return {
        chartData,
        totalSales: Object.values(salesByDay).reduce((a, b) => a + b, 0),
      };
    } catch (error: any) {
      throw new Error(`Erro ao buscar vendas: ${error.message}`);
    }
  }

  static async getProductSalesCount() {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Usuário não autenticado");
      const userId = user.uid;
      const now = new Date();

      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - 7);

      const ordersRef = collection(db, `orders/${userId}/vendas`);

      const q = query(
        ordersRef,
        where("createdAt", ">=", Timestamp.fromDate(weekStart))
      );

      const querySnapshot = await getDocs(q);

      // Mapeia quantidade vendida por produto
      const productSales = new Map();

      querySnapshot.forEach((doc) => {
        const order = { id: doc.id, ...doc.data() } as IOrder;
        order.items.forEach((item) => {
          const currentCount = productSales.get(item.id) || {
            quantity: 0,
            title: item.title,
          };
          currentCount.quantity += item.quantity;
          productSales.set(item.id, currentCount);
        });
      });

      // Converte para array de objetos para o gráfico
      return Array.from(productSales.values()).map(({ title, quantity }) => ({
        title,
        quantity,
      }));
    } catch (error: any) {
      throw new Error(
        `Erro ao buscar quantidade de produtos: ${error.message}`
      );
    }
  }

  private static getDayName(date: Date): string {
    const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];
    return days[date.getDay()];
  }
}
