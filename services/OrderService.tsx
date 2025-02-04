import {
  collection,
  addDoc,
  Timestamp,
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { db, auth } from "@/firebaseConfig";
import { ICartItem, IOrder } from "@/types/types";
import { alertaPersonalizado } from "@/utils/alertaPersonalizado";

export class OrderService {
  private static ORDERS_COLLECTION = "orders";
  private static COUNTER_COLLECTION = "counters";
  private static COUNTER_DOC = "orderCounter";

  private static async getNextOrderId(): Promise<string> {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error("User not authenticated");

    // Referência para o documento do contador específico do usuário
    const counterRef = doc(db, `users/${userId}/counter/orderCounter`);

    try {
      // Tenta obter o documento do contador
      const counterDoc = await getDoc(counterRef);
      let nextNumber;
      if (!counterDoc.exists()) {
        // Se o documento não existir, cria com valor inicial
        nextNumber = 1;
        await setDoc(counterRef, {
          currentNumber: nextNumber,
        });
      } else {
        // Se existir, incrementa o valor atual
        nextNumber = counterDoc.data().currentNumber + 1;
        await setDoc(counterRef, {
          currentNumber: nextNumber,
        });
      }

      // Formata o número com zeros à esquerda para ter 8 dígitos
      const formattedNumber = nextNumber.toString().padStart(8, "0");
      return formattedNumber;
    } catch (error) {
      console.error("Error in getNextOrderId:", error);

      throw new Error(`Failed to generate order number: ${error.message}`);
    }
  }

  static async createOrder(
    items: ICartItem[],
    total: number,
    status: "completed" | "pending" | "canceled",
    nomeCliente: string // Adicione este parâmetro
  ): Promise<{ orderRefId: string; idOrder: string }> {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error("User not authenticated");
    try {
      // Gera o próximo número de ordem
      const idOrder = await this.getNextOrderId();

      const orderData: Omit<IOrder, "id"> = {
        idOrder,
        userId,
        items,
        total,
        status,
        createdAt: new Date(),
        nomeCliente,
      };

      // Referenciar a subcoleção `vendas` dentro do documento do usuário
      const vendasCollection = collection(
        db,
        `${this.ORDERS_COLLECTION}/${userId}/vendas`
      );

      // Adicionar o documento à subcoleção `vendas`
      const orderRef = await addDoc(vendasCollection, {
        ...orderData,
        idOrder,
        createdAt: Timestamp.fromDate(orderData.createdAt),
      });

      return { orderRefId: orderRef.id, idOrder };
    } catch (error: any) {
      console.error("Error in createOrder:", error);
      throw new Error(`Failed to create order: ${error.message}`);
    }
  }
}
