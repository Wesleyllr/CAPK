import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Button,
  ScrollView,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { CSVLink } from "react-csv";
import * as XLSX from "xlsx";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import {
  fetchSales,
  fetchProducts,
  fetchCategories,
} from "@/services/firebaseService";
import { auth } from "@/firebaseConfig";
import {
  formatDate,
  formatCurrency,
  formatDateHour,
  formatHourMinute,
} from "@/utils/formatters";
import Dashboard2 from "./Dashboard2";
import DateTimePicker from "@react-native-community/datetimepicker";

const Relatorio = () => {
  const { categoryId } = useLocalSearchParams();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [startDate, setStartDate] = useState(
    new Date(new Date().setMonth(new Date().getMonth() - 1))
  ); // Default to 1 month ago
  const [endDate, setEndDate] = useState(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  const isValidDateRange = () => {
    return startDate <= endDate;
  };

  const normalizeDate = (date) => {
    if (!date) return null;
    try {
      const normalizedDate = new Date(date);
      if (isNaN(normalizedDate.getTime())) return null;
      return normalizedDate;
    } catch (error) {
      console.error("Erro ao normalizar data:", error);
      return null;
    }
  };

  const adjustDate = (date) => {
    const adjusted = new Date(date);
    adjusted.setDate(adjusted.getDate() + 1);
    return adjusted;
  };

  const onStartDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || startDate;
    setShowStartDatePicker(false);
    setStartDate(adjustDate(currentDate));
  };

  const onEndDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || endDate;
    setShowEndDatePicker(false);
    setEndDate(adjustDate(currentDate));
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!isValidDateRange()) {
          console.error("Data inicial deve ser anterior ou igual à data final");
          return;
        }

        const userId = auth.currentUser?.uid;
        if (!userId) throw new Error("Usuário não autenticado.");

        const [sales, products, categories] = await Promise.all([
          fetchSales(userId),
          fetchProducts(userId),
          fetchCategories(userId),
        ]);

        console.log("Fetched sales:", sales.length);

        const formattedData = sales.flatMap((sale) => {
          let saleDate = normalizeDate(
            sale.createdAt?.toDate?.() || sale.createdAt
          );
          if (!saleDate) return [];

          const startOfDay = new Date(startDate);
          startOfDay.setHours(0, 0, 0, 0);

          const endOfDay = new Date(endDate);
          endOfDay.setHours(23, 59, 59, 999);

          const saleYear = saleDate.getFullYear();
          const saleMonth = saleDate.getMonth();
          const saleDay = saleDate.getDate();
          const normalizedSaleDate = new Date(
            saleYear,
            saleMonth,
            saleDay,
            saleDate.getHours(),
            saleDate.getMinutes(),
            saleDate.getSeconds()
          );

          const isInDateRange =
            normalizedSaleDate >= startOfDay && normalizedSaleDate <= endOfDay;

          if (!isInDateRange) return [];

          return sale.items
            .filter((item) => {
              const matchesCategory = item.categoryId === categoryId;
              const isCompleted = sale.status === "completed";
              return matchesCategory && isCompleted;
            })
            .map((item) => {
              const product = products[item.id] || {};
              const category = categories[item.categoryId] || {};

              // Usar o valor da venda ao invés do valor do produto
              const itemValue = item.value || product.value;

              return {
                idOrder: sale.idOrder,
                nomeCliente: sale.nomeCliente,
                status: sale.status,
                createdAt: sale.createdAt ? formatDate(sale.createdAt) : "N/A",
                hora: sale.createdAt ? formatHourMinute(sale.createdAt) : "N/A",
                total: sale.total,
                productObservations: item.observations || "N/A",
                totalItems: sale.items.length,
                productQuantity: item.quantity,
                productTitle: product.title,
                productValue: formatCurrency(itemValue),
                productTotalValue: formatCurrency(item.quantity * itemValue),
                productCusto: formatCurrency(product.custo),
                productCodeBar: product.codeBar,
                productIsVariablePrice: product.isVariablePrice,
                categoryName: category.name,
              };
            });
        });

        console.log("Formatted data length:", formattedData.length);
        setData(formattedData);
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [categoryId, startDate, endDate]);

  const prepareExportData = (rawData) => {
    console.log("Raw data length:", rawData.length);

    // Removemos o filtro de data pois os dados já estão filtrados corretamente
    const filteredData = rawData;

    console.log("Filtered data length:", filteredData.length);

    return filteredData.map((item) => ({
      "Número do Pedido": item.idOrder,
      "Nome do Cliente": item.nomeCliente,
      Status: item.status,
      "Data de Criação": item.createdAt,
      Hora: item.hora,
      "Total do Pedido":
        typeof item.total === "number" ? item.total.toFixed(2) : item.total,
      Observações: item.productObservations,
      "Total de Itens Different": item.totalItems,
      Quantidade: item.productQuantity,
      Produto: item.productTitle,
      "Preço Unitário": item.productValue?.replace("R$", "").trim(),
      "Preço Total Produto": item.productTotalValue?.replace("R$", "").trim(),
      "Custo Unitário": item.productCusto?.replace("R$", "").trim(),
      "Código de Barras": item.productCodeBar,
      "Preço Variável": item.productIsVariablePrice ? "Sim" : "Não",
      Categoria: item.categoryName,
    }));
  };

  const columnHelper = createColumnHelper();

  const columns = useMemo(
    () => [
      columnHelper.accessor("idOrder", {
        header: "Nº Pedido",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("nomeCliente", {
        header: "Nome Cliente",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("createdAt", {
        header: "Criado em",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("hora", {
        header: "Hora",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("total", {
        header: "Total ordem (R$)",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("productObservations", {
        header: "Observação",
        cell: (info) => info.getValue() || "N/A",
      }),
      columnHelper.accessor("totalItems", {
        header: "Prod. Diferentes",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("productQuantity", {
        header: "Qtd. Produtos",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("productTitle", {
        header: "Título",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("productValue", {
        header: "Preço Unit.",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("productTotalValue", {
        header: "Preço total prod.",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("productCusto", {
        header: "Custo Unit.",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("productCodeBar", {
        header: "Código de Barra",
        cell: (info) => info.getValue() || "N/A",
      }),
      columnHelper.accessor("productIsVariablePrice", {
        header: "Preço Variável",
        cell: (info) => (info.getValue() ? "Sim" : "Não"),
      }),
      columnHelper.accessor("categoryName", {
        header: "Categoria",
        cell: (info) => info.getValue(),
      }),
    ],
    []
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
    },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const ColumnSelector = () => (
    <View className="absolute right-5 top-20 bg-white p-4 rounded-lg shadow-lg z-50 max-h-[60%]">
      <View className="flex-row justify-between items-center mb-3 border-b border-gray-100 pb-2">
        <Text className="text-base font-semibold text-gray-800">
          Colunas Visíveis
        </Text>
        <TouchableOpacity
          className="p-1"
          onPress={() => setShowColumnSelector(false)}
        >
          <Text className="text-lg text-gray-600">✕</Text>
        </TouchableOpacity>
      </View>
      {table.getAllLeafColumns().map((column) => (
        <TouchableOpacity
          key={column.id}
          className="flex-row items-center py-2"
          onPress={() => column.toggleVisibility()}
        >
          <View
            className={`w-5 h-5 border-2 border-[#e798a7] rounded mr-2 justify-center items-center ${
              column.getIsVisible() ? "bg-[#e798a7]" : "bg-white"
            }`}
          >
            {column.getIsVisible() && (
              <Text className="text-white text-sm">✓</Text>
            )}
          </View>
          <Text className="text-gray-800 text-sm">
            {column.columnDef.header}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderDatePicker = () => {
    if (Platform.OS === "web") {
      return (
        <View className="flex-row gap-3">
          <input
            type="date"
            value={
              new Date(startDate.getTime() - 86400000)
                .toISOString()
                .split("T")[0]
            }
            onChange={(e) => setStartDate(adjustDate(new Date(e.target.value)))}
            className="border border-[#e798a7] rounded px-3 py-2"
          />
          <input
            type="date"
            value={
              new Date(endDate.getTime() - 86400000).toISOString().split("T")[0]
            }
            onChange={(e) => setEndDate(adjustDate(new Date(e.target.value)))}
            className="border border-[#e798a7] rounded px-3 py-2"
          />
        </View>
      );
    }

    return (
      <View className="flex-row gap-3">
        <View>
          <TouchableOpacity
            className="bg-[#e798a7] px-4 py-2 rounded"
            onPress={() => setShowStartDatePicker(true)}
          >
            <Text className="text-white font-medium text-sm">
              {new Date(startDate.getTime() - 86400000).toLocaleDateString()}
            </Text>
          </TouchableOpacity>
          {showStartDatePicker && (
            <DateTimePicker
              testID="startDatePicker"
              value={new Date(startDate.getTime() - 86400000)}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={(event, selectedDate) => {
                setShowStartDatePicker(false);
                if (selectedDate) {
                  setStartDate(adjustDate(selectedDate));
                }
              }}
            />
          )}
        </View>
        <View>
          <TouchableOpacity
            className="bg-[#e798a7] px-4 py-2 rounded"
            onPress={() => setShowEndDatePicker(true)}
          >
            <Text className="text-white font-medium text-sm">
              {new Date(endDate.getTime() - 86400000).toLocaleDateString()}
            </Text>
          </TouchableOpacity>
          {showEndDatePicker && (
            <DateTimePicker
              testID="endDatePicker"
              value={new Date(endDate.getTime() - 86400000)}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={(event, selectedDate) => {
                setShowEndDatePicker(false);
                if (selectedDate) {
                  setEndDate(adjustDate(selectedDate));
                }
              }}
            />
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <Text className="text-lg text-gray-600 text-center">
          Carregando dados...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1 px-5">
        <View className="mb-6">
          <Text className="text-2xl font-bold text-gray-800 mb-4 pt-4">
            Relatório de Vendas
          </Text>
          <View className="flex-row justify-end items-center gap-3">
            {renderDatePicker()}
            <TouchableOpacity
              className="bg-[#e798a7] px-4 py-2 rounded"
              onPress={() => setShowColumnSelector(!showColumnSelector)}
            >
              <Text className="text-white font-medium text-sm">
                Selecionar Colunas
              </Text>
            </TouchableOpacity>
            <View className="min-w-[120px]">
              <CSVLink
                data={prepareExportData(data)}
                filename={"relatorio.csv"}
                enclosure={'"'}
                separator={";"}
              >
                <Button title="Exportar CSV" color="#e798a7" />
              </CSVLink>
            </View>
            <View className="min-w-[120px]">
              <Button
                title="Exportar Excel"
                color="#c1aaa8"
                onPress={() => {
                  const exportData = prepareExportData(data);
                  const worksheet = XLSX.utils.json_to_sheet(exportData, {
                    header: Object.keys(exportData[0] || {}),
                  });

                  // Ajustar largura das colunas
                  const columnWidths = Object.keys(exportData[0] || {}).reduce(
                    (acc, key) => {
                      acc[key] = { wch: Math.max(key.length, 15) };
                      return acc;
                    },
                    {}
                  );
                  worksheet["!cols"] = Object.values(columnWidths);

                  const workbook = XLSX.utils.book_new();
                  XLSX.utils.book_append_sheet(
                    workbook,
                    worksheet,
                    "Relatorio"
                  );
                  XLSX.writeFile(workbook, "relatorio.xlsx");
                }}
              />
            </View>
          </View>
        </View>

        {showColumnSelector && <ColumnSelector />}

        <Dashboard2 data={data} />

        <ScrollView horizontal className="flex-1">
          <View style={styles.table}>
            <View style={styles.thead}>
              {table.getHeaderGroups().map((headerGroup) => (
                <View key={headerGroup.id} style={styles.tr}>
                  {headerGroup.headers.map((header) => (
                    <View
                      key={header.id}
                      style={[styles.th, styles[`${header.id}Cell`]]}
                    >
                      <Text
                        style={styles.headerText}
                        onPress={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {{ asc: " 🔼", desc: " 🔽" }[
                          header.column.getIsSorted()
                        ] ?? ""}
                      </Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
            <View style={styles.tbody}>
              {table.getRowModel().rows.map((row, index) => (
                <View
                  key={row.id}
                  style={[
                    styles.tr,
                    index % 2 === 0 ? styles.evenRow : styles.oddRow,
                    index === table.getRowModel().rows.length - 1
                      ? styles.lastRow
                      : null, // Adicione esta linha
                  ]}
                >
                  {row.getVisibleCells().map((cell) => (
                    <View
                      key={cell.id}
                      style={[styles.td, styles[`${cell.column.id}Cell`]]}
                    >
                      <Text style={styles.cellText}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
        <View className="w-full h-8" />
      </ScrollView>
    </SafeAreaView>
  );
};

// Keep only necessary styles that can't be handled by Tailwind
const styles = StyleSheet.create({
  table: {
    borderRadius: 8,
    overflow: "hidden",
  },
  thead: {
    backgroundColor: "#e798a7",
  },
  tbody: {
    backgroundColor: "#ffffff",
  },
  tr: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f3eeee",
  },
  th: {
    padding: 12,
    backgroundColor: "#e798a7",
  },
  td: {
    padding: 12,
  },
  lastRow: {
    borderBottomWidth: 8, // ou qualquer espessura que você desejar
    borderBottomColor: "#e798a7", // cor da borda
  },
  // Tamanhos específicos para cada coluna
  idOrderCell: { width: 80 },
  nomeClienteCell: { width: 150 },
  statusCell: { width: 100 },
  createdAtCell: { width: 100 },
  horaCell: { width: 80 },
  totalCell: { width: 120 },
  productObservationsCell: { width: 200 },
  totalItemsCell: { width: 80 },
  productQuantityCell: { width: 80 },
  productTitleCell: { width: 200 },
  productValueCell: { width: 120 },
  productCustoCell: { width: 120 },
  productCodeBarCell: { width: 120 },
  productIsVariablePriceCell: { width: 100 },
  categoryNameCell: { width: 120 },
});

export default Relatorio;
