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
import CategoriesChart from "@/components/charts/CategoriesChart";

import { ScrollView, View, Text } from "react-native"; // Import Text from react-native
import { Checkbox } from "react-native-paper"; // Import Checkbox from react-native-paper

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
    produtosMaisVendidos: [],
    categoriasMaisVendidas: [],
    vendasPorMes: [],
  });

  const [overallSalesData, setOverallSalesData] = useState([]);

  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);

  const handleMonthChange = (month: string) => {
    setSelectedMonths((prev) =>
      prev.includes(month) ? prev.filter((m) => m !== month) : [...prev, month]
    );
  };

  const filteredSalesData = salesData.vendasPorMes.filter((data) =>
    selectedMonths.length ? selectedMonths.includes(data.mes) : true
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

        // Calculate basic stats
        const faturamentoTotal = vendas.reduce((acc, venda) => acc + venda.total, 0);
        const pedidosPendentes = vendas.filter(
          (venda) => venda.status === "pending"
        ).length;

        // Initialize produtosMaisVendidos
        const produtosMaisVendidos = [];

        // Process products and categories with total values
        const categoriasContagem = {};
        const categoriasTotais = {};

        // Process all sales at once
        vendas.forEach((venda) => {
          venda.items.forEach((item) => {
            const categoryId = item.categoryId || item.category;
            
            if (categoryId && categoriesMap[categoryId]) {
              const categoryName = categoriesMap[categoryId];
              
              // Count quantities
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
        const categoriasMaisVendidas = Object.entries(categoriasContagem)
          .map(([name, quantidade]) => ({
            name,
            quantidade,
            valorTotal: categoriasTotais[name] || 0,
          }))
          .sort((a, b) => b.quantidade - a.quantidade)
          .slice(0, 5);

        // Group sales by month
        const vendasPorMes = vendas.reduce((acc, venda) => {
          const data = venda.createdAt.toDate();
          const mes = data.toLocaleString("pt-BR", { month: "short" });
          const existingMonth = acc.find((item) => item.mes === mes);

          if (existingMonth) {
            existingMonth.total += venda.total;
          } else {
            acc.push({ mes, total: venda.total });
          }
          return acc;
        }, []);

        // Group overall sales
        const overallSales = vendas.reduce((acc, venda) => {
          const data = venda.createdAt.toDate();
          const date = data.toLocaleDateString("pt-BR");
          const existingDate = acc.find((item) => item.date === date);

          if (existingDate) {
            existingDate.total += venda.total;
          } else {
            acc.push({ date, total: venda.total });
          }
          return acc;
        }, []);

        // Sort overall sales by date
        overallSales.sort((a, b) => new Date(a.date) - new Date(b.date));

        setSalesData({
          totalVendas: vendas.length,
          faturamentoTotal,
          pedidosPendentes,
          produtosMaisVendidos,
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

  const [activeIndex, setActiveIndex] = useState(0);

  const onPieEnter = (_, index) => {
    setActiveIndex(index);
  };

  return (
    <ScrollView className="p-4 space-y-4">
      <Text className="text-2xl font-bold mb-6">Dashboard</Text>

      {/* Cards principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <ShoppingCart className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Total de Vendas
                </p>
                <h3 className="text-2xl font-bold">{salesData.totalVendas}</h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <DollarSign className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Faturamento Total
                </p>
                <h3 className="text-2xl font-bold">
                  {salesData.faturamentoTotal.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <AlertCircle className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Pedidos Pendentes
                </p>
                <h3 className="text-2xl font-bold">
                  {salesData.pedidosPendentes}
                </h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de vendas */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Vendas por Mês</CardTitle>
        </CardHeader>
        <CardContent>
          <View className="flex flex-row mb-4 mx-4">
            {salesData.vendasPorMes.map((data) => (
              <View key={data.mes} className="mr-4 mb-2">
                <Checkbox
                  status={
                    selectedMonths.includes(data.mes) ? "checked" : "unchecked"
                  }
                  onPress={() => handleMonthChange(data.mes)}
                />
                <Text>{data.mes}</Text>
              </View>
            ))}
          </View>
          <View className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={filteredSalesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="total" stroke="#2563eb" />
              </LineChart>
            </ResponsiveContainer>
          </View>
        </CardContent>
      </Card>

      {/* Gráfico de vendas gerais */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Vendas Gerais</CardTitle>
        </CardHeader>
        <CardContent>
          <View className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={overallSalesData}>
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
        <Card>
          <CardHeader>
            <CardTitle>Produtos Mais Vendidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {salesData.produtosMaisVendidos.map((produto, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="font-medium">{produto.title}</span>
                  <span className="text-gray-600">
                    {produto.quantidade} unidades
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <CategoriesChart
          categoriasMaisVendidas={salesData.categoriasMaisVendidas}
        />
      </div>
    </ScrollView>
  );
};

export default Dashboard;
