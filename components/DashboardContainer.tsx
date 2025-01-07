import React from "react";
import { View } from "react-native";
import { LineChart, BarChart } from "recharts";

export const SalesOverTimeChart = ({ data }) => (
  <View className="h-64 w-full bg-secundaria-50 rounded-lg p-4 mb-4">
    <LineChart data={data} height={200} width={300}>
      <XAxis dataKey="date" />
      <YAxis />
      <Line type="monotone" dataKey="value" stroke="#7f5d5a" />
    </LineChart>
  </View>
);

export const RevenueMetricsCard = ({ metrics }) => (
  <View className="bg-secundaria-50 p-4 rounded-lg mb-4">
    <Text className="text-lg font-bold mb-2">Métricas de Receita</Text>
    <View className="flex-row justify-between">
      <View>
        <Text className="text-quinta">Receita Total</Text>
        <Text className="font-bold">
          {new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
          }).format(metrics.totalRevenue)}
        </Text>
      </View>
      <View>
        <Text className="text-quinta">Ticket Médio</Text>
        <Text className="font-bold">
          {new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
          }).format(metrics.averageOrderValue)}
        </Text>
      </View>
      <View>
        <Text className="text-quinta">Total Pedidos</Text>
        <Text className="font-bold">{metrics.orderCount}</Text>
      </View>
    </View>
  </View>
);
