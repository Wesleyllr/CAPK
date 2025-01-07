import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, FlatList, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { CartItem } from "@/components/CartItem";
import { CartService } from "@/services/CartService";
import { OrderService } from "@/services/OrderService";
import { ICartItem } from "@/types/types";
import { CompactCartItem } from "@/components/CompactCartItem";
import Header from "@/components/CustomHeader";

export default function Cart() {
  const router = useRouter();
  const [items, setItems] = useState<ICartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCompactView, setIsCompactView] = useState(false);

  const loadCart = async () => {
    try {
      const cartItems = await CartService.getItems();
      setItems(cartItems);
    } catch (error) {
      Alert.alert("Erro", "Falha ao carregar o carrinho");
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  useEffect(() => {
    loadCart();
  }, []);

  const handleUpdateQuantity = async (id: string, quantity: number) => {
    try {
      if (quantity === 0) {
        await CartService.removeItem(id);
      } else {
        await CartService.updateItem(id, { quantity });
      }
      await loadCart();
    } catch (error) {
      Alert.alert("Erro", "Falha ao atualizar quantidade");
    }
  };

  const handleRemoveItem = async (id: string) => {
    try {
      await CartService.removeItem(id);
      await loadCart();
    } catch (error) {
      Alert.alert("Erro", "Falha ao remover item");
    }
  };

  const handleUpdateObservations = async (id: string, observations: string) => {
    try {
      await CartService.updateItem(id, { observations });
      await loadCart();
    } catch (error) {
      Alert.alert("Erro", "Falha ao atualizar observações");
    }
  };

  const handleOrder = async (status: "completed" | "pending") => {
    try {
      const orderId = await OrderService.createOrder(items, total, status);
      await CartService.clearCart();
      const statusText = status === "completed" ? "finalizado" : "em aberto";
      Alert.alert("Sucesso", `Pedido #${orderId} ${statusText}!`);
      router.back();
    } catch (error) {
      Alert.alert("Erro", error.message || error);
    }
  };

  const total = items.reduce(
    (sum, item) => sum + item.value * item.quantity,
    0
  );

  return (
    <SafeAreaView className="flex-1 bg-primaria">
      <Header 
        title="Carrinho" 
        onGoBack={handleGoBack} 
        isCompactView={isCompactView}
        onToggleView={() => setIsCompactView(!isCompactView)}
      />


      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) =>
          isCompactView ? (
            <CompactCartItem
              item={item}
              onUpdateQuantity={handleUpdateQuantity}
              onRemove={handleRemoveItem}
            />
          ) : (
            <CartItem
              item={item}
              onUpdateQuantity={handleUpdateQuantity}
              onRemove={handleRemoveItem}
              onUpdateObservations={handleUpdateObservations}
            />
          )
        }
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <Text className="text-center text-quinta font-medium mt-4">
            Carrinho vazio
          </Text>
        }
      />

      <View className="p-4 bg-secundaria-50">
        <Text className="text-xl font-bold text-secundaria-900 mb-4">
          Total:{" "}
          {new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
          }).format(total)}
        </Text>

        <View className="flex-row gap-2">
          <TouchableOpacity
            onPress={() => handleOrder("pending")}
            className="flex-1 bg-terceira-500 p-4 rounded-lg"
            disabled={items.length === 0}
          >
            <Text className="text-primaria text-center font-bold text-lg">
              Deixar em Aberto
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleOrder("completed")}
            className="flex-1 bg-quarta p-4 rounded-lg"
            disabled={items.length === 0}
          >
            <Text className="text-primaria text-center font-bold text-lg">
              Finalizar Pedido
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
