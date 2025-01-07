import React from "react";
import { View, Text, Dimensions } from "react-native";
import { LineChart, BarChart } from "react-native-chart-kit";

interface SalesData {
  daily: number;
  weekly: number;
  monthly: number;
}

interface SalesChartsProps {
  salesData: SalesData;
}

const SalesCharts = ({ salesData }: SalesChartsProps) => {
  const screenWidth = Dimensions.get("window").width - 32; // 16px padding em cada lado

  const lineChartData = {
    labels: ["D-6", "D-5", "D-4", "D-3", "D-2", "D-1", "Hoje"],
    datasets: [
      {
        data: [
          salesData.weekly * 0.8,
          salesData.weekly * 0.85,
          salesData.weekly * 0.75,
          salesData.weekly * 0.9,
          salesData.weekly * 0.95,
          salesData.weekly * 0.85,
          salesData.daily,
        ],
        color: (opacity = 1) => `rgba(127, 93, 90, ${opacity})`, // Usando a cor secundaria-700
        strokeWidth: 2,
      },
    ],
  };

  const barChartData = {
    labels: ["Mês-2", "Mês-1", "Atual"],
    datasets: [
      {
        data: [
          salesData.monthly * 0.85,
          salesData.monthly * 0.92,
          salesData.monthly,
        ],
      },
    ],
  };

  const chartConfig = {
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    color: (opacity = 1) => `rgba(127, 93, 90, ${opacity})`, // Usando a cor secundaria-700
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
    decimalPlaces: 0,
    formatYLabel: (value: string) =>
      `R$${parseInt(value).toLocaleString("pt-BR")}`,
  };

  return (
    <View className="mb-6">
      <Text className="text-xl font-bold text-secundaria-900 mb-4">
        Vendas da Semana
      </Text>
      <LineChart
        data={lineChartData}
        width={screenWidth}
        height={220}
        chartConfig={chartConfig}
        bezier
        style={{
          marginVertical: 8,
          borderRadius: 16,
        }}
      />

      <Text className="text-xl font-bold text-secundaria-900 mb-4 mt-6">
        Comparativo Mensal
      </Text>
      <BarChart
        data={barChartData}
        width={screenWidth}
        height={220}
        chartConfig={chartConfig}
        style={{
          marginVertical: 8,
          borderRadius: 16,
        }}
        showValuesOnTopOfBars
      />
    </View>
  );
};

export default SalesCharts;
