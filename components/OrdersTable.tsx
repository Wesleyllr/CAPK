import React from "react";
import { View, Text, ScrollView } from "react-native";

interface OrdersTableProps {
  orders: OrderMetric[];
}

export const OrdersTable: React.FC<OrdersTableProps> = ({ orders }) => {
  return (
    <ScrollView horizontal className="w-full bg-secundaria-50 rounded-lg p-4">
      <View>
        <View className="flex-row">
          <Text className="w-24 font-bold">ID</Text>
          <Text className="w-24 font-bold">Total</Text>
          <Text className="w-24 font-bold">Items</Text>
          <Text className="w-32 font-bold">Data</Text>
        </View>
        {orders.map((order) => (
          <View key={order.id} className="flex-row">
            <Text className="w-24">{order.id.slice(-6)}</Text>
            <Text className="w-24">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(order.total)}
            </Text>
            <Text className="w-24">
              {order.items.reduce((sum, item) => sum + item.quantity, 0)}
            </Text>
            <Text className="w-32">
              {order.createdAt.toLocaleDateString("pt-BR")}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};
