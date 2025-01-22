import React, { useState, useCallback, useEffect } from "react";
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
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db, auth, rtdb } from "@/firebaseConfig";
import { IOrder } from "@/types/types";
import { OrderStatus } from "@/types/types";
import { useOrders } from "@/hooks/useOrders";
import OrderCard from "@/components/OrderCard";
import OrderDetailsModal from "@/components/OrderDetailsModal";
import eventBus from "@/utils/eventBus";
import { onValue, ref } from "firebase/database";
import { NotificationService } from "@/services/notificationService";
import ConfirmationModal from "@/components/ConfirmationModal";
import { Ionicons } from "@expo/vector-icons";


export default function Pedidos() {
  const [showPending, setShowPending] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<IOrder | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isConfirmationModalVisible, setIsConfirmationModalVisible] = useState(false);
  const [pendingStatusUpdate, setPendingStatusUpdate] = useState<{ orderId: string; status: OrderStatus } | null>(null);

  const { orders, loading, refreshing, setRefreshing, fetchOrders } = useOrders(
    showPending,
    20,
    "createdAt",
    "desc"
  );

  const handleUpdateStatus = useCallback(
    async (orderId: string, newStatus: OrderStatus) => {
      setIsUpdating(true);
      try {
        const user = auth.currentUser;
        if (!user) {
          throw new Error("Usuário não autenticado");
        }

        // Construir a referência correta do documento
        const orderRef = doc(db, "orders", user.uid, "vendas", orderId);

        // Verificar se o documento existe antes de tentar atualizar
        const orderDoc = await getDoc(orderRef);
        if (!orderDoc.exists()) {
          throw new Error("Pedido não encontrado");
        }

        // Tentar atualizar o documento
        await updateDoc(orderRef, {
          status: newStatus,
          updatedAt: new Date(),
        });

        // Atualizar a lista de pedidos
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
        if (Platform.OS === 'web') {
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
      />
    ),
    [handleOrderPress, updateOrderStatus]
  );

  useEffect(() => {
    // Inscreve-se nas notificações de pedidos
    const unsubscribe = NotificationService.subscribeToOrderNotifications(
      async (notification) => {
        if (notification.status === "PENDING_REFRESH") {
          await fetchOrders();
          // Confirma que o refresh foi realizado
          await NotificationService.confirmOrderRefresh();
        }
      }
    );

    return () => unsubscribe();
  }, [fetchOrders]);

  useEffect(() => {
    const handlePedidoAtualizado = () => {
      fetchOrders();
    };

    eventBus.on("pedidoAtualizado", handlePedidoAtualizado);

    return () => {
      eventBus.off("pedidoAtualizado", handlePedidoAtualizado);
    };
  }, [fetchOrders]);

  useEffect(() => {
    const ordersRef = ref(rtdb, "orders");
    const unsubscribe = onValue(ordersRef, (snapshot) => {
      if (snapshot.exists()) {
        fetchOrders();
      }
    });

    return () => unsubscribe();
  }, [fetchOrders]);

  useEffect(() => {
    const ordersRef = ref(rtdb, "orders/refresh");
    const unsubscribe = onValue(ordersRef, (snapshot) => {
      if (snapshot.exists()) {
        fetchOrders();
      }
    });

    return () => unsubscribe();
  }, [fetchOrders]);

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
        {Platform.OS === 'web' && (
          <TouchableOpacity
            className="w-9 h-9 ml-2 mr-4 bg-secundaria-400 items-center justify-center rounded-lg"
            onPress={() => fetchOrders()}
          >
            <Ionicons name="refresh-outline" size={24} color="black" />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <ActivityIndicator size="large" className="color-secundaria-700" />
      ) : (
        <FlatList
          data={orders} // Ordena por createdAt (mais recente primeiro)
          renderItem={memoizedRenderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            fetchOrders();
          }}
          ListEmptyComponent={
            <Text className="text-center text-quinta">
              Nenhum pedido {showPending ? "pendente" : "finalizado"}
            </Text>
          }
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
            handleUpdateStatus(pendingStatusUpdate.orderId, pendingStatusUpdate.status);
          }
        }}
        title="Confirmar Cancelamento"
        message="Tem certeza que deseja cancelar este pedido?"
      />
    </SafeAreaView>
  );
}
