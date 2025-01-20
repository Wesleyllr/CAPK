import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator, Button } from "react-native";
import {
  VictoryBar,
  VictoryChart,
  VictoryAxis,
  VictoryTheme,
  VictoryPie,
  VictoryLabel,
  VictoryLegend,
} from "victory-native";
import { collection, getDocs, query, where, Timestamp } from "firebase/firestore";
import { db, auth } from "@/firebaseConfig";
import DateTimePicker from '@react-native-community/datetimepicker';

const Dashboard2 = () => {
  const [loading, setLoading] = useState(true);
  const [salesData, setSalesData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [totalSales, setTotalSales] = useState(0);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [filterType, setFilterType] = useState('weekly');

  useEffect(() => {
    fetchData();
  }, [filterType, selectedDate]);

  const fetchData = async () => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    try {
      let salesRef = collection(db, `orders/${userId}/vendas`);
      const now = new Date();
      let startDate;

      switch (filterType) {
        case 'weekly':
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'monthly':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'yearly':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        case 'custom':
          startDate = selectedDate;
          break;
        default:
          startDate = new Date(now.setDate(now.getDate() - 7));
      }

      salesRef = query(salesRef, where('createdAt', '>=', Timestamp.fromDate(startDate)));

      const salesSnapshot = await getDocs(salesRef);
      const sales = salesSnapshot.docs.map(doc => doc.data());
      setSalesData(sales);

      const total = sales.reduce((sum, sale) => sum + sale.total, 0);
      setTotalSales(total);

      const categoryRef = collection(db, `users/${userId}/category`);
      const categorySnapshot = await getDocs(categoryRef);
      const categories = categorySnapshot.docs.map(doc => ({
        x: doc.data().name,
        y: sales.filter(sale => sale.category === doc.data().name).length,
      }));
      setCategoryData(categories);

      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || new Date();
    setShowDatePicker(false);
    setSelectedDate(currentDate);
  };

  if (loading) {
    return <ActivityIndicator size="large" />;
  }

  return (
    <ScrollView>
      <View style={{ padding: 20 }}>
        <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 20 }}>
          Dashboard
        </Text>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
          <Button title="Weekly" onPress={() => setFilterType('weekly')} />
          <Button title="Monthly" onPress={() => setFilterType('monthly')} />
          <Button title="Yearly" onPress={() => setFilterType('yearly')} />
          <Button title="Custom Date" onPress={() => setShowDatePicker(true)} />
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="default"
            onChange={handleDateChange}
          />
        )}

        <Text style={{ fontSize: 18, marginBottom: 10 }}></Text>
          Total Sales: ${totalSales.toFixed(2)}
        </Text>

        <VictoryChart theme={VictoryTheme.material} domainPadding={20}>
          <VictoryAxis
            tickFormat={(x) => `${x}`}
            style={{ tickLabels: { fontSize: 10, angle: 45 } }}
          />
          <VictoryAxis dependentAxis tickFormat={(x) => `$${x}`} />
          <VictoryBar
            data={salesData.map((sale, index) => ({
              x: `Order ${index + 1}`,
              y: sale.total,
            }))}
            style={{ data: { fill: "#c43a31" } }}
          />
        </VictoryChart>

        <VictoryPie
          data={categoryData}
          colorScale={["tomato", "orange", "gold", "cyan", "navy"]}
          labels={({ datum }) => `${datum.x}: ${datum.y}`}
          labelComponent={<VictoryLabel angle={0} />}
          style={{ labels: { fontSize: 12, fill: "black" } }}
        />

        <VictoryLegend
          x={125}
          y={50}
          title="Categories"
          centerTitle
          orientation="horizontal"
          gutter={20}
          style={{ title: { fontSize: 20 }, labels: { fontSize: 12 } }}
          data={categoryData.map((category) => ({
            name: category.x,
            symbol: { fill: "tomato" },
          }))}
        />
      </View>
    </ScrollView>
  );
};

export default Dashboard2;
