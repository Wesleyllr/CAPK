import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  getDocs,
  where,
  doc,
  getDoc,
} from "firebase/firestore";
import { db, auth } from "@/firebaseConfig";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/CardComponents";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Sector,
  Cell,
} from "recharts";
import {
  Package,
  DollarSign,
  ShoppingCart,
  AlertCircle,
  BarChart,
} from "lucide-react";
import CategoriesChart from "@/components/dashboard/CategoriesChart";
import { ScrollView, View, Text } from "react-native";
import BestSellingProducts from "@/components/dashboard/BestSellingProducts";
import CardDash from "@/components/dashboard/CardDash";
import SalesByMonthChart from "@/components/dashboard/SalesByMonthChart";
import DashboardPinVerification from "@/components/DashboardPinVerification";
import { useFocusEffect } from "@react-navigation/native";
import { getUserUid } from "@/userService";

const Dashboard = () => {
  const [pinVerified, setPinVerified] = useState(false);
  const [userPin, setUserPin] = useState(null);
  const [isPinEnabled, setIsPinEnabled] = useState(false);
  const [salesData, setSalesData] = useState({
    totalVendas: 0,
    faturamentoTotal: 0,
    pedidosPendentes: 0,
    produtosMaisVendidos: [],
    categoriasMaisVendidas: [],
    vendasPorMes: [],
  });
  const [overallSalesData, setOverallSalesData] = useState([]);
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(2023);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [currentMonthRevenue, setCurrentMonthRevenue] = useState(0);

  useFocusEffect(
    React.useCallback(() => {
      setPinVerified(false);
    }, [])
  );

  useEffect(() => {
    const checkPinRequirement = async () => {
      try {
        const userId = auth.currentUser?.uid;
        if (!userId) return;

        const configDoc = await getDoc(
          doc(db, `users/${userId}/config/config`)
        );
        const configData = configDoc.data();

        if (configData?.dashboardPinEnabled) {
          setIsPinEnabled(true);
          setUserPin(configData.dashboardPin);
        } else {
          setPinVerified(true);
        }
      } catch (error) {
        console.error("Error checking PIN requirement:", error);
        Alert.alert("Erro", "Falha ao verificar requisitos de PIN");
      }
    };

    checkPinRequirement();
  }, []);

  useEffect(() => {
    if (!pinVerified) return;

    const fetchDashboardData = async () => {
      try {
        const userId = await getUserUid();
        if (!userId) {
          console.log("Usuário não autenticado");
          return;
        }

        const categoriesRef = collection(db, `users/${userId}/category`);
        const categoriesSnapshot = await getDocs(categoriesRef);
        console.log(`Categorias lidas: ${categoriesSnapshot.size}`);

        const categories = categoriesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const totalVendas = categories.reduce(
          (acc, category) => acc + (category.produtosVendidos || 0),
          0
        );
        const faturamentoTotal = categories.reduce(
          (acc, category) => acc + (category.totalVendido || 0),
          0
        );

        const categoriasMaisVendidas = categories
          .map((category) => ({
            name: category.name,
            quantidade: category.produtosVendidos || 0,
            valorTotal: category.totalVendido || 0,
            categoryId: category.id,
          }))
          .sort((a, b) => b.quantidade - a.quantidade)
          .slice(0, 5);

        const currentDate = new Date();
        const monthYear = `${
          currentDate.getMonth() + 1
        }-${currentDate.getFullYear()}`;
        const dashboardRef = doc(db, `users/${userId}/dashboard/${monthYear}`);
        const dashboardDoc = await getDoc(dashboardRef);
        console.log(
          `Dashboard documento lido: ${dashboardDoc.exists() ? "Sim" : "Não"}`
        );

        let currentMonthRevenue = 0;
        if (dashboardDoc.exists()) {
          const dashboardData = dashboardDoc.data();
          currentMonthRevenue = Object.values(dashboardData).reduce(
            (acc, dayData) => acc + dayData.total,
            0
          );
        }

        setSalesData({
          totalVendas,
          faturamentoTotal,
          pedidosPendentes: 0,
          produtosMaisVendidos: [],
          categoriasMaisVendidas,
          vendasPorMes: [],
        });

        setCurrentMonthRevenue(currentMonthRevenue);
      } catch (error) {
        console.error("Erro ao buscar dados do dashboard:", error);
      }
    };

    fetchDashboardData();
  }, [pinVerified]);

  useEffect(() => {
    const handleTouchMove = (event) => {
      // Your touchmove event logic here
    };

    window.addEventListener("touchmove", handleTouchMove, { passive: true });

    return () => {
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, []);

  useEffect(() => {
    setPinVerified(false);
  }, []);

  const handleMonthChange = (selected: string[]) => {
    console.log("Selected months in Dashboard:", selected);
    setSelectedMonths(selected);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const handleYearChange = (year: number) => {
    console.log("Selected year in Dashboard:", year);
    setSelectedYear(year);
  };

  const monthLabels = [
    "jan.",
    "fev.",
    "mar.",
    "abr.",
    "mai.",
    "jun.",
    "jul.",
    "ago.",
    "set.",
    "out.",
    "nov.",
    "dez.",
  ];

  const filteredSalesData = salesData.vendasPorMes
    .filter((data) => {
      const result =
        (selectedMonths.length === 0 || selectedMonths.includes(data.mes)) &&
        data.ano === selectedYear;
      console.log("Filtering data:", data, "Result:", result);
      return result;
    })
    .sort((a, b) => monthLabels.indexOf(a.mes) - monthLabels.indexOf(b.mes));

  const filteredOverallSalesData = overallSalesData.filter((data) =>
    selectedCategories.length
      ? data.items.some((item) => selectedCategories.includes(item.categoryId))
      : true
  );

  const filteredCategorySalesData = salesData.vendasPorMes
    .filter((data) => {
      const result =
        (selectedMonths.length === 0 || selectedMonths.includes(data.mes)) &&
        data.ano === selectedYear;
      return result;
    })
    .map((data) => {
      const monthData = { mes: data.mes };
      salesData.categoriasMaisVendidas.forEach((category) => {
        const categorySales = overallSalesData
          .filter(
            (sale) =>
              new Date(sale.date).getMonth() ===
                monthLabels.indexOf(data.mes) &&
              sale.items.some((item) => item.categoryId === category.name)
          )
          .reduce((acc, sale) => {
            const categoryItem = sale.items.find(
              (item) => item.categoryId === category.name
            );
            return (
              acc +
              (categoryItem ? categoryItem.value * categoryItem.quantity : 0)
            );
          }, 0);
        monthData[category.name] = categorySales;
      });
      return monthData;
    });

  const handlePinVerification = (success: boolean) => {
    setPinVerified(success);
  };

  if (isPinEnabled && !pinVerified) {
    return (
      <DashboardPinVerification
        onVerify={handlePinVerification}
        correctPin={userPin}
      />
    );
  }

  return (
    <ScrollView className="p-4 space-y-4 bg-gray-100">
      <Text className="text-2xl font-bold mb-6">Dashboard</Text>

      <View className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <CardDash
          icon={<ShoppingCart className="h-8 w-8 text-blue-500" />}
          title="Total de Vendas"
          value={salesData.totalVendas}
        />
        <CardDash
          icon={<DollarSign className="h-8 w-8 text-green-500" />}
          title="Faturamento Total"
          value={salesData.faturamentoTotal.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          })}
        />
        <CardDash
          icon={<DollarSign className="h-8 w-8 text-green-500" />}
          title="Faturamento Mês Atual"
          value={currentMonthRevenue.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          })}
        />
        <CardDash
          icon={<AlertCircle className="h-8 w-8 text-yellow-500" />}
          title="Pedidos Pendentes"
          value={salesData.pedidosPendentes}
        />
      </View>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <BestSellingProducts
          produtosMaisVendidos={salesData.produtosMaisVendidos}
        />
        <CategoriesChart
          categoriasMaisVendidas={salesData.categoriasMaisVendidas}
        />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Vendas por Mês</CardTitle>
        </CardHeader>
        <CardContent>
          <SalesByMonthChart
            salesData={salesData}
            selectedMonths={selectedMonths}
            selectedYear={selectedYear}
            availableYears={availableYears}
            handleMonthChange={handleMonthChange}
            handleYearChange={handleYearChange}
            filteredSalesData={filteredSalesData}
          />
        </CardContent>
      </Card>
    </ScrollView>
  );
};

export default Dashboard;
