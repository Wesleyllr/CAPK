import React, { useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/CardComponents";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Text } from "react-native";

const Dashboard2 = ({ data }) => {
  // Cores do tema
  const COLORS = [
    "#E798A7", // terceira.DEFAULT
    "#C1AAA8", // secundaria.DEFAULT
    "#e07c8f", // terceira.550
    "#d85a71", // terceira.600
    "#a4817e", // secundaria.600
  ];

  const metrics = useMemo(() => {
    if (!data?.length) return null;

    // Total de vendas
    const totalSales = data.reduce((acc, item) => {
      const totalValue = parseFloat(
        item.productTotalValue
          ?.replace("R$", "")
          .replace(".", "")
          .replace(",", ".") || 0
      );
      return acc + totalValue;
    }, 0);

    // Vendas por categoria
    const salesByCategory = data.reduce((acc, item) => {
      const category = item.categoryName;
      const totalValue = parseFloat(
        item.productTotalValue
          ?.replace("R$", "")
          .replace(".", "")
          .replace(",", ".") || 0
      );
      if (!acc[category]) acc[category] = 0;
      acc[category] += totalValue;
      return acc;
    }, {});

    // Vendas por produto
    const salesByProduct = data.reduce((acc, item) => {
      const product = item.productTitle;
      if (!acc[product]) acc[product] = 0;
      acc[product] += item.productQuantity;
      return acc;
    }, {});

    // Lucro por produto (Preço - Custo)
    const profitByProduct = data.reduce((acc, item) => {
      const product = item.productTitle;
      const price = parseFloat(
        item.productValue
          ?.replace("R$", "")
          .replace(".", "")
          .replace(",", ".") || 0
      );
      const cost = parseFloat(
        item.productCusto
          ?.replace("R$", "")
          .replace(".", "")
          .replace(",", ".") || 0
      );
      const profit = (price - cost) * item.productQuantity;

      if (!acc[product]) acc[product] = 0;
      acc[product] += profit;
      return acc;
    }, {});

    return {
      totalSales,
      salesByCategory: Object.entries(salesByCategory).map(([name, value]) => ({
        name,
        value,
      })),
      salesByProduct: Object.entries(salesByProduct)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5),
      profitByProduct: Object.entries(profitByProduct)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5),
    };
  }, [data]);

  if (!metrics)
    return (
      <div className="p-4">
        <Text style={styles.loadingText}>Carregando dados...</Text>
      </div>
    );

  return (
    <div className="p-4 space-y-4">
      {/* Total de Vendas */}
      <Card style={styles.card}>
        <CardHeader>
          <CardTitle style={styles.cardTitle}>Total de Vendas</CardTitle>
        </CardHeader>
        <CardContent>
          <Text style={styles.totalValue}>
            {new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(metrics.totalSales)}
          </Text>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Top 5 Produtos Mais Vendidos */}
        <Card style={styles.card}>
          <CardHeader>
            <CardTitle style={styles.cardTitle}>
              Top 5 Produtos Mais Vendidos
            </CardTitle>
          </CardHeader>
          <CardContent style={styles.chartContainer}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.salesByProduct} layout="vertical">
                <XAxis type="number" stroke="#2B2B2B" />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={150}
                  stroke="#2B2B2B"
                />
                <Tooltip
                  contentStyle={styles.tooltipContent}
                  labelStyle={styles.tooltipLabel}
                />
                <Bar dataKey="value" fill={COLORS[0]}>
                  {metrics.salesByProduct.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top 5 Produtos por Lucro */}
        <Card style={styles.card}>
          <CardHeader>
            <CardTitle style={styles.cardTitle}>
              Top 5 Produtos por Lucro
            </CardTitle>
          </CardHeader>
          <CardContent style={styles.chartContainer}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.profitByProduct} layout="vertical">
                <XAxis
                  type="number"
                  tickFormatter={(value) =>
                    new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(value)
                  }
                  stroke="#2B2B2B"
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={150}
                  stroke="#2B2B2B"
                />
                <Tooltip
                  formatter={(value) =>
                    new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(value)
                  }
                  contentStyle={styles.tooltipContent}
                  labelStyle={styles.tooltipLabel}
                />
                <Bar dataKey="value">
                  {metrics.profitByProduct.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const styles = {
  card: {
    backgroundColor: "#ffffff", // primaria
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    color: "#2B2B2B", // quarta
    fontSize: 18,
    fontWeight: "600",
  },
  totalValue: {
    color: "#E798A7", // terceira.DEFAULT
    fontSize: 32,
    fontWeight: "bold",
  },
  chartContainer: {
    height: 300,
    paddingVertical: 16,
  },
  loadingText: {
    color: "#6d6d6d", // quinta
    fontSize: 16,
    textAlign: "center",
  },
  tooltipContent: {
    backgroundColor: "#ffffff",
    border: "1px solid #f3eeee", // secundaria.100
    borderRadius: 4,
    padding: 8,
  },
  tooltipLabel: {
    color: "#2B2B2B", // quarta
    fontWeight: "600",
  },
};

export default Dashboard2;
