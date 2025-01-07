import React, { useState, useEffect } from "react";
import { View, ActivityIndicator, Text } from "react-native";
import {
  VictoryBar,
  VictoryChart,
  VictoryAxis,
  VictoryTheme,
} from "victory-native";
import { ProductSalesService } from "@/services/ProductSalesService";

const WeeklySalesChart = () => {
  const [loading, setLoading] = useState(true);
  const [salesData, setSalesData] = useState<any[]>([]);
  const [totalSales, setTotalSales] = useState(0);

  useEffect(() => {
    loadSalesData();
  }, []);

  const loadSalesData = async () => {
    try {
      setLoading(true);
      const { chartData, totalSales } =
        await ProductSalesService.getWeeklySales();
      setSalesData(chartData);
      setTotalSales(totalSales);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View className="h-64 items-center justify-center">
        <ActivityIndicator size="large" color="#7f5d5a" />
      </View>
    );
  }

  return (
    <View className="bg-secundaria-50 p-4 rounded-lg">
      <Text className="text-xl font-bold text-secundaria-900 mb-4">
        Vendas da Semana
      </Text>
      <Text className="text-quinta mb-4">
        Total:{" "}
        {new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL",
        }).format(totalSales)}
      </Text>
      <VictoryChart
        theme={VictoryTheme.material}
        domainPadding={20}
        height={300}
      >
        <VictoryAxis
          tickFormat={(t) => t}
          style={{
            tickLabels: { fontSize: 10, padding: 5 },
          }}
        />
        <VictoryAxis
          dependentAxis
          tickFormat={(x) => `R$${x}`}
          style={{
            tickLabels: { fontSize: 10, padding: 5 },
          }}
        />
        <VictoryBar
          data={salesData}
          x="day"
          y="sales"
          style={{
            data: {
              fill: "#7f5d5a",
            },
          }}
          animate={{
            duration: 500,
            onLoad: { duration: 500 },
          }}
        />
      </VictoryChart>
    </View>
  );
};

export default WeeklySalesChart;
