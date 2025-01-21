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
import AsyncStorage from "@react-native-async-storage/async-storage";
import EventEmitter from "eventemitter3";
import eventBus from "@/utils/eventBus";
import { alertaPersonalizado } from "@/utils/alertaPersonalizado";
import FormFieldProduct from "@/components/FormFieldProduct";
import { NotificationService } from "@/services/notificationService";

// Criar uma instância global do EventEmitter
export const cartEvents = new EventEmitter();

const VIEW_MODE_KEY = "cart_view_mode";

export default function Cart() {
  const router = useRouter();
  const [items, setItems] = useState<ICartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCompactView, setIsCompactView] = useState(false);
  const [nomeCliente, setnomeCliente] = useState("");

  useEffect(() => {
    const loadViewMode = async () => {
      try {
        const savedViewMode = await AsyncStorage.getItem(VIEW_MODE_KEY);
        if (savedViewMode !== null) {
          setIsCompactView(savedViewMode === "compact");
        }
      } catch (error) {
        console.error("Erro ao carregar modo de visualização:", error);
      }
    };
    loadViewMode();
  }, []);

  const loadCart = async () => {
    try {
      const cartItems = await CartService.getItems();
      setItems(cartItems);
    } catch (error) {
      alertaPersonalizado({
        message: "Erro",
        description: "Falha ao carregar o carrinho",
        type: "danger",
      });
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
        cartEvents.emit("quantityChanged", { id, quantity: 0 });
      } else {
        await CartService.updateItem(id, { quantity });
        cartEvents.emit("quantityChanged", { id, quantity });
      }
      await loadCart();
    } catch (error) {
      alertaPersonalizado({
        message: "Erro",
        description: "Falha ao atualizar quantidade",
        type: "danger",
      });
    }
  };

  const handleRemoveItem = async (id: string) => {
    try {
      await CartService.removeItem(id);
      cartEvents.emit("quantityChanged", { id, quantity: 0 });
      await loadCart();
    } catch (error) {
      alertaPersonalizado({
        message: "Erro",
        description: "Falha ao remover item",
        type: "danger",
      });
    }
  };

  const handleUpdateObservations = async (id: string, observations: string) => {
    try {
      await CartService.updateItem(id, { observations });
      await loadCart();
    } catch (error) {
      alertaPersonalizado({
        message: "Erro",
        description: "Falha ao atualizar observações",
        type: "danger",
      });
    }
  };

  const handleOrder = async (status: "completed" | "pending") => {
    try {
      // Make sure items include category information when creating order
      const itemsWithCategory = items.map((item) => ({
        ...item,
        categoryId: item.categoryId || "sem categoria", // Provide default if category is missing
      }));

      const { orderRefId, idOrder } = await OrderService.createOrder(
        itemsWithCategory,
        total,
        status,
        nomeCliente
      );

      // Envia notificação de novo pedido
      await NotificationService.sendOrderCreatedNotification();

      await CartService.clearCart();
      cartEvents.emit("cartCleared");
      const statusText = status === "completed" ? "finalizado" : "em aberto";
      alertaPersonalizado({
        message: "Sucesso",
        description: `Pedido #${idOrder} ${statusText}!`,
        type: "success",
      });
      eventBus.emit("pedidoAtualizado");
      router.back();
    } catch (error) {
      alertaPersonalizado({
        message: "Erro",
        description: error.message || error,
        type: "danger",
      });
    }
  };

  const total = items.reduce(
    (sum, item) => sum + item.value * item.quantity,
    0
  );

  const toggleViewMode = async () => {
    const newMode = isCompactView ? "full" : "compact";
    setIsCompactView(!isCompactView);
    try {
      await AsyncStorage.setItem(VIEW_MODE_KEY, newMode);
    } catch (error) {
      console.error("Erro ao salvar modo de visualização:", error);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-primaria">
      <Header
        title="Carrinho"
        onGoBack={handleGoBack}
        isCompactView={isCompactView}
        onToggleView={toggleViewMode}
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
        <FormFieldProduct
          title="Nome do Cliente"
          value={nomeCliente}
          handleChangeText={setnomeCliente}
          placeholder="Digite o nome do cliente"
        />
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
