import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  doc,
  updateDoc,
  getDoc,
  onSnapshot,
  collection,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { db, auth } from "@/firebaseConfig";
import { IOrder } from "@/types/types";
import { OrderStatus } from "@/types/types";
import { useOrders } from "@/hooks/useOrders";
import OrderCard from "@/components/OrderCard";
import OrderDetailsModal from "@/components/OrderDetailsModal";
import eventBus from "@/utils/eventBus";
import ConfirmationModal from "@/components/ConfirmationModal";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { reverseCategorySales, updateCategorySales } from "@/userService"; // Add this import

const CACHE_KEY = "orders_cache";
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
const ORDERS_PER_PAGE = 20;

export default function Pedidos() {
  const [showPending, setShowPending] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<IOrder | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isConfirmationModalVisible, setIsConfirmationModalVisible] =
    useState(false);
  const [pendingStatusUpdate, setPendingStatusUpdate] = useState<{
    orderId: string;
    status: OrderStatus;
  } | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const lastUpdateRef = useRef<number>(0);
  const [orders, setOrders] = useState<IOrder[]>([]);

  const { loading, refreshing, setRefreshing, fetchOrders } = useOrders(
    showPending,
    ORDERS_PER_PAGE, // Limite de pedidos por página
    "createdAt",
    "desc"
  );

  const router = useRouter();

  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastRefreshTimeRef = useRef<number>(0);

  const loadCachedOrders = async () => {
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_DURATION) {
          return data;
        }
      }
      return null;
    } catch (error) {
      console.error("Erro ao carregar cache:", error);
      return null;
    }
  };

  const cacheOrders = async (data: any[]) => {
    try {
      await AsyncStorage.setItem(
        CACHE_KEY,
        JSON.stringify({
          data,
          timestamp: Date.now(),
        })
      );
    } catch (error) {
      console.error("Erro ao salvar cache:", error);
    }
  };

  const debouncedFetchOrders = useCallback(() => {
    const now = Date.now();
    if (now - lastRefreshTimeRef.current < 2000) {
      return;
    }

    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    refreshTimeoutRef.current = setTimeout(async () => {
      try {
        const cachedData = await loadCachedOrders();
        if (cachedData) {
          return;
        }

        await fetchOrders();
        lastUpdateRef.current = now;
      } catch (error) {
        console.error("Erro ao buscar pedidos:", error);
      }
    }, 300);
  }, [fetchOrders]);

  const handleUpdateStatus = useCallback(
    async (orderId: string, newStatus: OrderStatus) => {
      setIsUpdating(true);
      try {
        const user = auth.currentUser;
        if (!user) {
          throw new Error("Usuário não autenticado");
        }

        const orderRef = doc(db, "orders", user.uid, "vendas", orderId);

        const orderDoc = await getDoc(orderRef);
        if (!orderDoc.exists()) {
          throw new Error("Pedido não encontrado");
        }

        const orderData = orderDoc.data();

        if (orderData.status === "completed" && newStatus === "canceled") {
          await reverseCategorySales(orderData.items); // Add this line
        } else if (newStatus === "completed") {
          await updateCategorySales(orderData.items); // Add this line
        }
        ("");

        await updateDoc(orderRef, {
          status: newStatus,
          updatedAt: new Date(),
        });

        await fetchOrders();
        eventBus.emit("pedidoAtualizado");
      } catch (error) {
        console.error("Erro na atualização:", error);
        Alert.alert(
          "Erro ao atualizar status",
          "Não foi possível atualizar o status do pedido. Por favor, tente novamente."
        );
      } finally {
        setIsUpdating(false);
        setIsConfirmationModalVisible(false);
        setPendingStatusUpdate(null);
      }
    },
    [fetchOrders]
  );

  const updateOrderStatus = useCallback(
    (orderId: string, newStatus: OrderStatus) => {
      if (newStatus === "canceled") {
        if (Platform.OS === "web") {
          setPendingStatusUpdate({ orderId, status: newStatus });
          setIsConfirmationModalVisible(true);
        } else {
          Alert.alert(
            "Confirmar Cancelamento",
            "Tem certeza que deseja cancelar este pedido?",
            [
              {
                text: "Não",
                style: "cancel",
              },
              {
                text: "Sim",
                onPress: () => handleUpdateStatus(orderId, newStatus),
              },
            ]
          );
        }
      } else {
        handleUpdateStatus(orderId, newStatus);
      }
    },
    [handleUpdateStatus]
  );

  const handleOrderPress = useCallback((order: IOrder) => {
    setSelectedOrder(order);
    setIsModalVisible(true);
  }, []);

  const handleEditOrder = useCallback(
    (order: IOrder) => {
      router.push({
        pathname: "/screens/EditOrder",
        params: { id: order.id },
      });
    },
    [router]
  );

  const handleCloseModal = useCallback(() => {
    setIsModalVisible(false);
    setSelectedOrder(null);
  }, []);

  const memoizedRenderItem = useCallback(
    ({ item }: { item: IOrder }) => (
      <OrderCard
        order={item}
        onPress={handleOrderPress}
        onStatusUpdate={updateOrderStatus}
        onEditOrder={handleEditOrder}
      />
    ),
    [handleOrderPress, updateOrderStatus, handleEditOrder]
  );

  useEffect(() => {
    const handlePedidoAtualizado = () => {
      debouncedFetchOrders();
    };

    eventBus.on("pedidoAtualizado", handlePedidoAtualizado);

    return () => {
      eventBus.off("pedidoAtualizado", handlePedidoAtualizado);
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [debouncedFetchOrders]);

  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const ordersRef = collection(db, "orders", userId, "vendas");
    const status = showPending ? "pending" : "completed";
    const q = query(
      ordersRef,
      where("status", "==", status),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as IOrder)
      );
      setOrders(ordersData);
    });

    return () => unsubscribe();
  }, [showPending]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    debouncedFetchOrders();
  }, [debouncedFetchOrders]);

  const loadMoreOrders = () => {
    if (hasMore && !loading) {
      setPage((prev) => prev + 1);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-primaria">
      <View className="p-4 bg-secundaria-500">
        <Text className="text-2xl font-bold text-primaria">Pedidos</Text>
      </View>

      <View className="flex-row p-4">
        <TouchableOpacity
          onPress={() => setShowPending(true)}
          className={`flex-1 p-2 rounded-l-lg ${
            showPending ? "bg-secundaria-500" : "bg-secundaria-200"
          }`}
          accessibilityLabel="Ver pedidos pendentes"
        >
          <Text
            className={`text-center ${
              showPending ? "text-primaria" : "text-secundaria-700"
            }`}
          >
            Pendentes
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setShowPending(false)}
          className={`flex-1 p-2 rounded-r-lg ${
            !showPending ? "bg-secundaria-500" : "bg-secundaria-200"
          }`}
          accessibilityLabel="Ver pedidos Finalizados"
        >
          <Text
            className={`text-center ${
              !showPending ? "text-primaria" : "text-secundaria-700"
            }`}
          >
            Finalizados
          </Text>
        </TouchableOpacity>
        {Platform.OS === "web" && (
          <TouchableOpacity
            className="w-9 h-9 ml-2 mr-4 bg-secundaria-400 items-center justify-center rounded-lg"
            onPress={debouncedFetchOrders}
          >
            <Ionicons name="refresh-outline" size={24} color="black" />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <ActivityIndicator size="large" className="color-secundaria-700" />
      ) : (
        <FlatList
          data={orders}
          renderItem={memoizedRenderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          refreshing={refreshing}
          onRefresh={onRefresh}
          ListEmptyComponent={
            <Text className="text-center text-quinta">
              Nenhum pedido {showPending ? "pendente" : "finalizado"}
            </Text>
          }
          onEndReached={loadMoreOrders}
          onEndReachedThreshold={0.5}
          initialNumToRender={ORDERS_PER_PAGE} // Limite inicial de pedidos renderizados
          maxToRenderPerBatch={ORDERS_PER_PAGE} // Máximo de pedidos renderizados por lote
          windowSize={5}
          removeClippedSubviews={true}
        />
      )}

      <OrderDetailsModal
        isVisible={isModalVisible}
        order={selectedOrder}
        onClose={handleCloseModal}
      />

      {isUpdating && (
        <View className="absolute inset-0 bg-black/30 justify-center items-center">
          <ActivityIndicator size="large" className="color-secundaria-700" />
        </View>
      )}

      <ConfirmationModal
        isVisible={isConfirmationModalVisible}
        onClose={() => {
          setIsConfirmationModalVisible(false);
          setPendingStatusUpdate(null);
        }}
        onConfirm={() => {
          if (pendingStatusUpdate) {
            handleUpdateStatus(
              pendingStatusUpdate.orderId,
              pendingStatusUpdate.status
            );
          }
        }}
        title="Confirmar Cancelamento"
        message="Tem certeza que deseja cancelar este pedido?"
      />
    </SafeAreaView>
  );
}
