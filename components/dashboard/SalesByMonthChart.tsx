import React, { useState } from "react";
import { View } from "react-native";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import * as RadixSlider from "@radix-ui/react-slider";

interface SalesByMonthChartProps {
  salesData: any;
  selectedMonths: string[];
  selectedYear: number;
  availableYears: number[];
  handleMonthChange: (values: number[]) => void;
  handleYearChange: (year: number) => void;
  filteredSalesData: any[];
}

const SalesByMonthChart: React.FC<SalesByMonthChartProps> = ({
  salesData,
  selectedMonths,
  selectedYear,
  availableYears,
  handleMonthChange,
  handleYearChange,
  filteredSalesData,
}) => {
  const [sliderValue, setSliderValue] = useState([0, 11]);

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

  const handleSliderChange = (value: number[]) => {
    setSliderValue(value);
    const selected = [];
    for (let i = value[0]; i <= value[1]; i++) {
      selected.push(monthLabels[i]);
    }
    handleMonthChange(selected);
  };

  return (
    <div className="w-full space-y-4">
      <div className="px-4">
        <select
          value={selectedYear}
          onChange={(e) => handleYearChange(Number(e.target.value))}
          className="mb-4 p-2 border rounded"
        >
          {availableYears.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>

        <RadixSlider.Root
          value={sliderValue}
          onValueChange={handleSliderChange}
          min={0}
          max={11}
          step={1}
          className="relative flex items-center w-full h-4"
        >
          <RadixSlider.Track className="relative bg-gray-300 rounded-full h-1 grow">
            <RadixSlider.Range className="absolute bg-blue-500 rounded-full h-full" />
          </RadixSlider.Track>
          <RadixSlider.Thumb
            className="block w-4 h-4 bg-blue-500 rounded-full cursor-pointer"
            aria-label="Month"
          />
          <RadixSlider.Thumb
            className="block w-4 h-4 bg-blue-500 rounded-full cursor-pointer"
            aria-label="Month"
          />
        </RadixSlider.Root>

        <div className="flex justify-between mt-2">
          {monthLabels.map((month, index) => (
            <span key={index} className="text-xs">
              {month}
            </span>
          ))}
        </div>
      </div>

      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={filteredSalesData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="mes" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="total" fill="#2563eb" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SalesByMonthChart;
