import React, { memo } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router"; // Import useRouter
import { IOrder } from "@/types/types";
import { OrderStatus } from "@/types/types";
import {
  formatCurrency,
  formatDateHour,
  formatHourMinute,
  formatDate,
} from "@/utils/formatters";
import { CONSTANTS } from "@/constants/constants";

interface OrderCardProps {
  order: IOrder;
  onPress: (order: IOrder) => void;
  onStatusUpdate: (orderId: string, status: OrderStatus) => void;
}

const OrderCard = memo(({ order, onPress, onStatusUpdate }: OrderCardProps) => {
  const router = useRouter(); // Initialize router
  const formattedDate = formatDate(order.createdAt);
  const formattedHour = formatHourMinute(order.createdAt);

  const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <TouchableOpacity
      onPress={() => onPress(order)}
      accessible={true}
      accessibilityLabel={`Pedido ${order.id.slice(-CONSTANTS.SLICE_LENGTH)}`}
      accessibilityHint="Toque para ver detalhes do pedido"
    >
      <View className="bg-secundaria-50 p-4 rounded-lg mb-3">
        <View className="flex-row justify-between">
          <Text className="text-secundaria-900 font-bold text-2xl">
            {order.idOrder.slice(-4)} - {order.nomeCliente || "SEM NOME"}
          </Text>
          <Text className="text-quinta text-2xl">
            {formatCurrency(order.total)}
          </Text>
        </View>

        <View>
          <Text className="text-quinta font-bold text-lg">{formattedHour}</Text>
          <Text className="text-quinta">{formattedDate}</Text>
          <Text className="text-quinta">
            {totalItems} {totalItems === 1 ? "item" : "itens"}
          </Text>
        </View>

        <View className="flex-row justify-end gap-4">
          {order.status === "pending" ? (
            <>
              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: "/screens/EditOrder",
                    params: { id: order.id },
                  })
                }
                className="bg-blue-600 px-4 py-2 rounded"
                accessibilityLabel="Editar pedido"
              >
                <Text className="text-primaria text-lg">Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => onStatusUpdate(order.id, "canceled")}
                className="bg-sexta px-4 py-2 rounded"
                accessibilityLabel="Cancelar pedido"
              >
                <Text className="text-primaria text-lg">Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => onStatusUpdate(order.id, "completed")}
                className="bg-green-600 px-4 py-2 rounded"
                accessibilityLabel="Finalizar pedido"
              >
                <Text className="text-primaria text-lg">Finalizar</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              onPress={() => onStatusUpdate(order.id, "canceled")}
              className="bg-sexta px-4 py-2 rounded"
              accessibilityLabel="Estornar pedido"
            >
              <Text className="text-primaria text-lg">Estornar</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
});

OrderCard.displayName = "OrderCard";

export default OrderCard;
