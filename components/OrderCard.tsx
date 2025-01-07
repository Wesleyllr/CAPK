import React, { memo } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { IOrder } from "@/types/types";
import { OrderStatus } from "@/types/types";
import { formatCurrency, formatDateHour } from "@/utils/formatters";
import { CONSTANTS } from "@/constants/constants";

interface OrderCardProps {
  order: IOrder;
  onPress: (order: IOrder) => void;
  onStatusUpdate: (orderId: string, status: OrderStatus) => void;
}

const OrderCard = memo(({ order, onPress, onStatusUpdate }: OrderCardProps) => {
  const formattedDate = formatDateHour(order.createdAt);
  const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <TouchableOpacity
      onPress={() => onPress(order)}
      accessible={true}
      accessibilityLabel={`Pedido ${order.id.slice(-CONSTANTS.SLICE_LENGTH)}`}
      accessibilityHint="Toque para ver detalhes do pedido"
    >
      <View className="bg-secundaria-50 p-4 rounded-lg mb-3">
        <View className="flex-row justify-between mb-2">
          <Text className="text-secundaria-900 font-bold">
            Pedido #{order.id.slice(-CONSTANTS.SLICE_LENGTH)}
          </Text>
          <Text className="text-quinta">{formatCurrency(order.total)}</Text>
        </View>

        <View className="mb-2">
          <Text className="text-quinta">{formattedDate}</Text>
          <Text className="text-quinta">{totalItems} itens</Text>
        </View>

        <View className="flex-row justify-end gap-2">
          {order.status === "pending" ? (
            <>
              <TouchableOpacity
                onPress={() => onStatusUpdate(order.id, "completed")}
                className="bg-quarta px-4 py-2 rounded"
                accessibilityLabel="Completar pedido"
              >
                <Text className="text-primaria">Completar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => onStatusUpdate(order.id, "canceled")}
                className="bg-sexta px-4 py-2 rounded"
                accessibilityLabel="Cancelar pedido"
              >
                <Text className="text-primaria">Cancelar</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              onPress={() => onStatusUpdate(order.id, "canceled")}
              className="bg-sexta px-4 py-2 rounded"
              accessibilityLabel="Cancelar pedido"
            >
              <Text className="text-primaria">Cancelar</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
});

OrderCard.displayName = "OrderCard";

export default OrderCard;
