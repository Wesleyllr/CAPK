import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

const SalesByMonthChart = ({
  salesData,
  selectedMonths,
  handleMonthChange,
  filteredSalesData,
}) => {
  return (
    <View>
      <View className="flex flex-row mb-4 mx-4 flex-wrap">
        {salesData.vendasPorMes.map((data) => (
          <TouchableOpacity
            key={data.mes}
            className={`mr-4 mb-2 px-4 py-2 rounded-full ${
              selectedMonths.includes(data.mes)
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-black"
            }`}
            onPress={() => handleMonthChange(data.mes)}
          >
            <Text>{data.mes}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={filteredSalesData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="mes" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="total" fill="#2563eb" />
          </BarChart>
        </ResponsiveContainer>
      </View>
    </View>
  );
};

export default SalesByMonthChart;
