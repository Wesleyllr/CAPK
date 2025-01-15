import { useState, useCallback, useEffect } from "react";
import { Alert } from "react-native";
import { collection, query, where, orderBy, limit as setLimit, getDocs } from "firebase/firestore";
import { db, auth } from "@/firebaseConfig";
import { IOrder } from "@/types/types";

export const useOrders = (
  showPending: boolean,
  limit?: number,
  orderByField: "createdAt" | "status" | "total" = "createdAt",
  orderDirection: "asc" | "desc" = "asc" // Adicionando direção da ordenação (ascendente por padrão)
) => {
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(!refreshing); // Apenas exibe o carregamento inicial
      const userId = auth.currentUser?.uid;

      if (!userId) throw new Error("Usuário não autenticado");

      const ordersRef = collection(db, "orders", userId, "vendas");
      const status = showPending ? "pending" : "completed";

      // Configuração da consulta com ordenação e limite opcionais
      let q = query(
        ordersRef,
        where("status", "==", status),
        orderBy(orderByField, orderDirection) // Adiciona direção da ordenação
      );
      if (limit) {
        q = query(q, setLimit(limit));
      }

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
      console.error("Erro ao carregar pedidos:", error);
      Alert.alert(
        "Erro ao carregar pedidos",
        error instanceof Error ? error.message : "Erro desconhecido"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showPending, refreshing, limit, orderByField, orderDirection]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return { orders, loading, refreshing, setRefreshing, fetchOrders };
};
