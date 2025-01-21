import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, Button } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { CSVLink } from "react-csv";
import * as XLSX from "xlsx";
import {
  fetchSales,
  fetchProducts,
  fetchCategories,
} from "@/services/firebaseService";
import { auth } from "@/firebaseConfig";
import { formatDate, formatCurrency } from "@/utils/formatters";

const Relatorio = () => {
  const { categoryId } = useLocalSearchParams();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userId = auth.currentUser?.uid;
        if (!userId) throw new Error("Usuário não autenticado.");

        const [sales, products, categories] = await Promise.all([
          fetchSales(userId),
          fetchProducts(userId),
          fetchCategories(userId),
        ]);

        const formattedData = sales.flatMap((sale) => {
          return sale.items
            .filter(
              (item) =>
                item.categoryId === categoryId && sale.status === "completed"
            ) // Filter by categoryId and status
            .map((item) => {
              const product = products[item.id] || {};
              const category = categories[item.categoryId] || {};

              return {
                // Informações do pedido (pai)
                idOrder: sale.idOrder,
                nomeCliente: sale.nomeCliente,
                status: sale.status,
                createdAt: sale.createdAt ? formatDate(sale.createdAt) : "N/A",
                total: sale.total,
                productObservations: item.observations || "N/A", // Ensure observations are captured
                totalItems: sale.items.length,
                // Informações do item
                productQuantity: item.quantity,
                productTitle: product.title,
                productValue: formatCurrency(product.value),
                productCusto: formatCurrency(product.custo),
                productCodeBar: product.codeBar,
                productIsVariablePrice: product.isVariablePrice,
                categoryName: category.name,
              };
            });
        });

        setData(formattedData);
      } catch (error) {
        console.error("Erro ao buscar dados:", error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [categoryId]);

  const renderItem = ({ item }) => (
    <View style={styles.row}>
      <Text style={styles.cell}>{item.idOrder}</Text>
      <Text style={styles.cell}>{item.nomeCliente}</Text>
      <Text style={styles.cell}>{item.status}</Text>
      <Text style={styles.cell}>{item.createdAt}</Text>
      <Text style={styles.cell}>{item.total}</Text>
      <Text style={styles.cell}>{item.productObservations}</Text>
      <Text style={styles.cell}>{item.totalItems}</Text>
      <Text style={styles.cell}>{item.productQuantity}</Text>
      <Text style={styles.cell}>{item.productTitle}</Text>
      <Text style={styles.cell}>{item.productValue}</Text>
      <Text style={styles.cell}>{item.productCusto}</Text>
      <Text style={styles.cell}>{item.productCodeBar}</Text>
      <Text style={styles.cell}>
        {item.productIsVariablePrice ? "Sim" : "Não"}
      </Text>
      <Text style={styles.cell}>{item.categoryName}</Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Carregando dados...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.buttonContainer}>
        <CSVLink data={data} filename={"relatorio.csv"}>
          <Button title="Exportar para CSV" />
        </CSVLink>
        <Button
          title="Exportar para Excel"
          onPress={() => {
            const worksheet = XLSX.utils.json_to_sheet(data);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Relatorio");
            XLSX.writeFile(workbook, "relatorio.xlsx");
          }}
        />
      </View>
      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={(item, index) => `${item.idOrder}-${index}`}
        ListHeaderComponent={() => (
          <View style={styles.header}>
            <Text style={styles.headerCell}>Nº Pedido</Text>
            <Text style={styles.headerCell}>Nome Cliente</Text>
            <Text style={styles.headerCell}>Status</Text>
            <Text style={styles.headerCell}>Criado em</Text>
            <Text style={styles.headerCell}>Total ordem (R$)</Text>
            <Text style={styles.headerCell}>Observação</Text>
            <Text style={styles.headerCell}>Prod. Diferentes (Pedido)</Text>
            <Text style={styles.headerCell}>Qtd. Produtos</Text>
            <Text style={styles.headerCell}>Título</Text>
            <Text style={styles.headerCell}>Preço Unit.</Text>
            <Text style={styles.headerCell}>Custo Unit.</Text>
            <Text style={styles.headerCell}>Código de Barra</Text>
            <Text style={styles.headerCell}>Preço Variável</Text>
            <Text style={styles.headerCell}>Categoria</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f9fafb",
    minWidth: "100%",
    minHeight: "100%",
  },
  buttonContainer: {
    marginBottom: 16,
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    backgroundColor: "#e5e7eb",
    padding: 8,
  },
  headerCell: {
    flex: 1,
    fontWeight: "bold",
    textAlign: "center",
    width: 100,
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#d1d5db",
    padding: 8,
  },
  cell: {
    flex: 1,
    textAlign: "center",
    width: 100,
  },
});

export default Relatorio;
