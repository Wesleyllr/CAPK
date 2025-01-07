import { collection, addDoc, Timestamp } from "firebase/firestore";
import { db, auth } from "@/firebaseConfig";
import { ICartItem, IOrder } from "@/types/types";

export class OrderService {
  private static ORDERS_COLLECTION = "orders";

  static async createOrder(
    items: ICartItem[],
    total: number,
    status: "completed" | "pending" | "canceled"
  ): Promise<string> {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error("User not authenticated");

    const orderData: Omit<IOrder, "id"> = {
      userId,
      items,
      total,
      status,
      createdAt: new Date(),
    };

    try {
      // Referenciar a subcoleção `vendas` dentro do documento do usuário
      const vendasCollection = collection(
        db,
        `${this.ORDERS_COLLECTION}/${userId}/vendas`
      );

      // Adicionar o documento à subcoleção `vendas`
      const orderRef = await addDoc(vendasCollection, {
        ...orderData,
        createdAt: Timestamp.fromDate(orderData.createdAt),
      });

      return orderRef.id;
    } catch (error: any) {
      throw new Error(`Failed to create order: ${error.message}`);
    }
  }
}
