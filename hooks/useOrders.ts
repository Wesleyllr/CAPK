import { useState, useCallback, useEffect } from "react";
import { Alert } from "react-native";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db, auth } from "@/firebaseConfig";
import { IOrder } from "@/types/types";

export const useOrders = (showPending: boolean) => {
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error("Usuário não autenticado");

      const ordersRef = collection(db, "orders");
      const status = showPending ? "pending" : "completed";
      const q = query(
        ordersRef,
        where("userId", "==", userId),
        where("status", "==", status)
      );

      const querySnapshot = await getDocs(q);
      const ordersData = querySnapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as IOrder)
      );

      setOrders(ordersData);
    } catch (error) {
      Alert.alert(
        "Erro ao carregar pedidos",
        error instanceof Error ? error.message : "Erro desconhecido"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showPending]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return { orders, loading, refreshing, setRefreshing, fetchOrders };
};
