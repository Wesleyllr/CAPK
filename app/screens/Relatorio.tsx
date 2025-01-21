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
          return sale.items.map((item) => {
            const product = products[item.id] || {};
            const category = categories[item.categoryId] || {};
            console.log("Category:", category);
            return {
              // Informações do pedido (pai)
              idOrder: sale.idOrder,
              nomeCliente: sale.nomeCliente,
              status: sale.status,
              createdAt: sale.createdAt ? formatDate(sale.createdAt) : "N/A",
              total: sale.total,
              totalItems: sale.items.length,
              // Informações do item
              productTitle: product.title,
              productValue: formatCurrency(product.value),
              productCusto: formatCurrency(product.custo),
              productCodeBar: product.codeBar,
              productIsVariablePrice: product.isVariablePrice,
              categoryName: category.name,
              categoryCreatedAt: category.createdAt
                ? formatDate(category.createdAt)
                : "N/A",
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
      <Text style={styles.cell}>{item.totalItems}</Text>
      <Text style={styles.cell}>{item.productTitle}</Text>
      <Text style={styles.cell}>{item.productValue}</Text>
      <Text style={styles.cell}>{item.productCusto}</Text>
      <Text style={styles.cell}>{item.productCodeBar}</Text>
      <Text style={styles.cell}>
        {item.productIsVariablePrice ? "Sim" : "Não"}
      </Text>
      <Text style={styles.cell}>{item.categoryName}</Text>
      <Text style={styles.cell}>{item.categoryCreatedAt}</Text>
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
            <Text style={styles.headerCell}>Order ID</Text>
            <Text style={styles.headerCell}>Nome Cliente</Text>
            <Text style={styles.headerCell}>Status</Text>
            <Text style={styles.headerCell}>Created At</Text>
            <Text style={styles.headerCell}>Total</Text>
            <Text style={styles.headerCell}>Total Items</Text>
            <Text style={styles.headerCell}>Produto - Title</Text>
            <Text style={styles.headerCell}>Produto - Value</Text>
            <Text style={styles.headerCell}>Produto - Custo</Text>
            <Text style={styles.headerCell}>Produto - CodeBar</Text>
            <Text style={styles.headerCell}>Produto - IsVariablePrice</Text>
            <Text style={styles.headerCell}>Categoria - Name</Text>
            <Text style={styles.headerCell}>Categoria - CreatedAt</Text>
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
