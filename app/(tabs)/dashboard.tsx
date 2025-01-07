import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import {
  VictoryBar,
  VictoryChart,
  VictoryAxis,
  VictoryTheme,
  VictoryPie,
  VictoryLabel,
  VictoryLegend,
} from "victory-native";
import { ProductSalesService } from "@/services/ProductSalesService";
import { auth } from "@/firebaseConfig";

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [weeklySales, setWeeklySales] = useState<any[]>([]);
  const [productSales, setProductSales] = useState<any[]>([]);
  const [totalSales, setTotalSales] = useState(0);
  const [selectedView, setSelectedView] = useState<"weekly" | "products">(
    "weekly"
  );

  const user = auth.currentUser;
  if (!user) throw new Error("Usuário não autenticado");
  const userId = user.uid;

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [weeklyData, productsData] = await Promise.all([
        ProductSalesService.getWeeklySales(),
        ProductSalesService.getProductSalesCount(),
      ]);
      setWeeklySales(weeklyData.chartData);
      setTotalSales(weeklyData.totalSales);
      setProductSales(productsData);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const ViewSelector = () => (
    <View className="flex-row justify-center space-x-4 mb-4">
      <TouchableOpacity
        onPress={() => setSelectedView("weekly")}
        className={`px-4 py-2 rounded-full ${
          selectedView === "weekly" ? "bg-secundaria-900" : "bg-secundaria-100"
        }`}
      >
        <Text
          className={`${
            selectedView === "weekly" ? "text-white" : "text-secundaria-900"
          }`}
        >
          Vendas Semanais
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => setSelectedView("products")}
        className={`px-4 py-2 rounded-full ${
          selectedView === "products"
            ? "bg-secundaria-900"
            : "bg-secundaria-100"
        }`}
      >
        <Text
          className={`${
            selectedView === "products" ? "text-white" : "text-secundaria-900"
          }`}
        >
          Produtos Vendidos
        </Text>
      </TouchableOpacity>
    </View>
  );

  const WeeklySalesChart = () => (
    <View className="bg-secundaria-50 p-4 rounded-lg">
      <Text className="text-xl font-bold text-secundaria-900 mb-4">
        Vendas da Semana
      </Text>
      <Text className="text-quinta mb-4">
        Total: {formatCurrency(totalSales)}
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
          data={weeklySales}
          x="day"
          y="sales"
          style={{
            data: { fill: "#7f5d5a" },
          }}
          animate={{
            duration: 500,
            onLoad: { duration: 500 },
          }}
        />
      </VictoryChart>
    </View>
  );

  const ProductSalesChart = () => (
    <View className="bg-secundaria-50 p-4 rounded-lg">
      <Text className="text-xl font-bold text-secundaria-900 mb-4">
        Produtos Mais Vendidos
      </Text>
      <VictoryPie
        data={productSales}
        x="title"
        y="quantity"
        colorScale="qualitative"
        height={300}
        labelComponent={
          <VictoryLabel
            style={{ fontSize: 12, fontWeight: "bold", fontSizeAdjust: 0.2 }}
            text={({ datum }) => `${datum.title}\n(${datum.quantity})`}
          />
        }
        animate={{
          duration: 500,
          onLoad: { duration: 500 },
        }}
      />
    </View>
  );

  if (loading) {
    return (
      <View className="h-64 items-center justify-center">
        <ActivityIndicator size="large" color="#7f5d5a" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 p-4 bg-gray-100">
      <Text className="text-2xl font-bold mb-4">Dashboard</Text>
      <ViewSelector />
      {selectedView === "weekly" ? <WeeklySalesChart /> : <ProductSalesChart />}
    </ScrollView>
  );
};

export default Dashboard;
