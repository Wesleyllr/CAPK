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

import { ScrollView, View, Text, TouchableOpacity } from "react-native"; // Import Text from react-native
import { Checkbox } from "react-native-paper"; // Import Checkbox from react-native-paper
import BestSellingProducts from "@/components/dashboard/BestSellingProducts"; // Import the new component
import CardDash from "@/components/dashboard/CardDash"; // Import the new component
import SalesByMonthChart from "@/components/dashboard/SalesByMonthChart"; // Import the new component

const renderActiveShape = (props) => {
  const RADIAN = Math.PI / 180;
  const {
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
    fill,
    payload,
    percent,
    value,
  } = props;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 10) * cos;
  const sy = cy + (outerRadius + 10) * sin;
  const mx = cx + (outerRadius + 30) * cos;
  const my = cy + (outerRadius + 30) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 22;
  const ey = my;
  const textAnchor = cos >= 0 ? "start" : "end";

  return (
    <g>
      <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill}>
        {payload.name}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 6}
        outerRadius={outerRadius + 10}
        fill={fill}
      />
      <path
        d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`}
        stroke={fill}
        fill="none"
      />
      <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
      <text
        x={ex + (cos >= 0 ? 1 : -1) * 12}
        y={ey}
        textAnchor={textAnchor}
        fill="#333"
      >{`Qtd: ${value}`}</text>
      <text
        x={ex + (cos >= 0 ? 1 : -1) * 12}
        y={ey}
        dy={18}
        textAnchor={textAnchor}
        fill="#999"
      >
        {`(${(percent * 100).toFixed(2)}%)`}
      </text>
    </g>
  );
};

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"]; // Define the COLORS array

const Dashboard = () => {
  const [salesData, setSalesData] = useState({
    totalVendas: 0,
    faturamentoTotal: 0,
    pedidosPendentes: 0,
    produtosMaisVendidos: [], // Initialize produtosMaisVendidos
    categoriasMaisVendidas: [],
    vendasPorMes: [],
  });

  const [overallSalesData, setOverallSalesData] = useState([]);

  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(2023);
  const [availableYears, setAvailableYears] = useState<number[]>([]);

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

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const userId = auth.currentUser?.uid;
        if (!userId) {
          console.log("Usuário não autenticado");
          return;
        }

        // 1. First, fetch all categories
        const categoriesRef = collection(db, `users/${userId}/category`);
        const categoriesSnapshot = await getDocs(categoriesRef);
        const categoriesMap = {};
        categoriesSnapshot.docs.forEach((doc) => {
          categoriesMap[doc.id] = doc.data().name;
        });

        // 2. Fetch products to get their categories and values
        const productsRef = collection(db, `users/${userId}/products`);
        const productsSnapshot = await getDocs(productsRef);
        const productsMap = {};
        productsSnapshot.docs.forEach((doc) => {
          const data = doc.data();
          productsMap[doc.id] = {
            title: data.title,
            categoryId: data.category,
            value: parseFloat(data.value || 0),
          };
        });

        // 3. Fetch sales
        const vendasRef = collection(db, `orders/${userId}/vendas`);
        const vendasSnapshot = await getDocs(vendasRef);
        const vendas = vendasSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Filter completed sales
        const completedVendas = vendas.filter(
          (venda) => venda.status === "completed"
        );

        // Calculate basic stats
        const faturamentoTotal = completedVendas.reduce(
          (acc, venda) => acc + venda.total,
          0
        );
        const pedidosPendentes = vendas.filter(
          (venda) => venda.status === "pending"
        ).length;

        // Initialize produtosMaisVendidos
        const produtosContagem = {};

        // Process products and categories with total values
        const categoriasContagem = {};
        const categoriasTotais = {};

        // Process all completed sales at once
        completedVendas.forEach((venda) => {
          venda.items.forEach((item) => {
            const productId = item.id;
            const categoryId = item.categoryId || item.category;

            if (productId && productsMap[productId]) {
              const productTitle = productsMap[productId].title;

              // Count product quantities
              produtosContagem[productTitle] =
                (produtosContagem[productTitle] || 0) + item.quantity;
            }

            if (categoryId && categoriesMap[categoryId]) {
              const categoryName = categoriesMap[categoryId];

              // Count category quantities
              categoriasContagem[categoryName] =
                (categoriasContagem[categoryName] || 0) + item.quantity;

              // Sum total values
              const itemTotal = item.value * item.quantity;
              categoriasTotais[categoryName] =
                (categoriasTotais[categoryName] || 0) + itemTotal;
            }
          });
        });

        // Convert to arrays and sort by quantity
        const produtosMaisVendidos = Object.entries(produtosContagem)
          .map(([title, quantidade]) => ({
            title,
            quantidade,
          }))
          .sort((a, b) => b.quantidade - a.quantidade)
          .slice(0, 5);

        const categoriasMaisVendidas = Object.entries(categoriasContagem)
          .map(([name, quantidade]) => ({
            name,
            quantidade,
            valorTotal: categoriasTotais[name] || 0,
          }))
          .sort((a, b) => b.quantidade - a.quantidade)
          .slice(0, 5);

        // Group sales by month
        const vendasPorMes = completedVendas.reduce((acc, venda) => {
          const data = venda.createdAt.toDate();
          const mes = data.toLocaleString("pt-BR", { month: "short" });
          const ano = data.getFullYear();
          const existingMonth = acc.find(
            (item) => item.mes === mes && item.ano === ano
          );

          if (existingMonth) {
            existingMonth.total += venda.total;
          } else {
            acc.push({ mes, ano, total: venda.total });
          }
          return acc;
        }, []);

        // Extract unique years from vendasPorMes
        const uniqueYears = [...new Set(vendasPorMes.map((item) => item.ano))];
        setAvailableYears(uniqueYears);

        // Group overall sales
        const overallSales = completedVendas.reduce((acc, venda) => {
          const data = venda.createdAt.toDate();
          const date = data.toLocaleDateString("pt-BR");
          const existingDate = acc.find((item) => item.date === date);

          if (existingDate) {
            existingDate.total += venda.total;
            existingDate.items.push(...venda.items);
          } else {
            acc.push({ date, total: venda.total, items: venda.items });
          }
          return acc;
        }, []);

        // Sort overall sales by date
        overallSales.sort((a, b) => new Date(a.date) - new Date(b.date));

        setSalesData({
          totalVendas: completedVendas.length,
          faturamentoTotal,
          pedidosPendentes,
          produtosMaisVendidos, // Set produtosMaisVendidos
          categoriasMaisVendidas,
          vendasPorMes,
        });

        setOverallSalesData(overallSales);
      } catch (error) {
        console.error("Erro ao buscar dados do dashboard:", error);
      }
    };

    fetchDashboardData();
  }, []);

  useEffect(() => {
    const handleTouchMove = (event) => {
      // Your touchmove event logic here
    };

    window.addEventListener("touchmove", handleTouchMove, { passive: true });

    return () => {
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, []);

  const [activeIndex, setActiveIndex] = useState(0);

  const onPieEnter = (_, index) => {
    setActiveIndex(index);
  };

  return (
    <ScrollView className="p-4 space-y-4">
      <Text className="text-2xl font-bold mb-6">Dashboard</Text>

      {/* Cards principais */}
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
          icon={<AlertCircle className="h-8 w-8 text-yellow-500" />}
          title="Pedidos Pendentes"
          value={salesData.pedidosPendentes}
        />
      </View>

      {/* Gráfico de vendas */}
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

      {/* Gráfico de vendas gerais */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Vendas Gerais</CardTitle>
        </CardHeader>
        <CardContent>
          <View className="flex flex-row mb-4 mx-4">
            {salesData.categoriasMaisVendidas.map((data) => (
              <TouchableOpacity
                key={data.name}
                className={`mr-4 mb-2 px-4 py-2 rounded-full ${
                  selectedCategories.includes(data.name)
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-black"
                }`}
                onPress={() => handleCategoryChange(data.name)}
              >
                <Text>{data.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={filteredOverallSalesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#82ca9d"
                  fill="#82ca9d"
                />
              </AreaChart>
            </ResponsiveContainer>
          </View>
        </CardContent>
      </Card>

      {/* Lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <BestSellingProducts
          produtosMaisVendidos={salesData.produtosMaisVendidos}
        />
        <CategoriesChart
          categoriasMaisVendidas={salesData.categoriasMaisVendidas}
        />
      </div>
    </ScrollView>
  );
};

export default Dashboard;
