import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/firebaseConfig";
import { IOrder } from "@/types/types";
import { OrderStatus } from "@/types/types";
import { useOrders } from "@/hooks/useOrders";
import OrderCard from "@/components/OrderCard";
import OrderDetailsModal from "@/components/OrderDetailsModal";

export default function Pedidos() {
  const [showPending, setShowPending] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<IOrder | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const { orders, loading, refreshing, setRefreshing, fetchOrders } =
    useOrders(showPending);

  const updateOrderStatus = useCallback(
    async (orderId: string, newStatus: OrderStatus) => {
      setIsUpdating(true);
      try {
        const orderRef = doc(db, "orders", orderId);
        await updateDoc(orderRef, { status: newStatus });
        await fetchOrders();
        Alert.alert("Sucesso", "Status do pedido atualizado com sucesso");
      } catch (error) {
        Alert.alert(
          "Erro ao atualizar status",
          error instanceof Error ? error.message : "Erro desconhecido"
        );
      } finally {
        setIsUpdating(false);
      }
    },
    [fetchOrders]
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
          onRefresh={() => {
            setRefreshing(true);
            fetchOrders();
          }}
          ListEmptyComponent={
            <Text className="text-center text-quinta">
              Nenhum pedido {showPending ? "pendente" : "completado"}
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
    </SafeAreaView>
  );
}
