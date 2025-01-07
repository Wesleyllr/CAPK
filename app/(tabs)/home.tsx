import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  collection,
  query,
  where,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { db, auth } from "@/firebaseConfig";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { images } from "@/constants";
import { getUserInfo } from "@/userService"; // Importando o serviço para obter o username

const Home = () => {
  const router = useRouter();
  const [salesData, setSalesData] = useState({
    daily: 0,
    weekly: 0,
    monthly: 0,
  });
  const [pendingOrders, setPendingOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userInfo, setUserInfo] = useState({
    name: "",
    photoURL: null,
  });

  const fetchData = useCallback(async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userId = user.uid;

      // Recuperar username e foto do usuário
      const username = await getUserInfo("username");
      const photoURL = user.photoURL || null;

      setUserInfo({ name: username, photoURL });

      // Datas de referência
      const now = new Date();
      const dayStart = new Date(now.setHours(0, 0, 0, 0));
      const weekStart = new Date(now.setDate(now.getDate() - 7));
      const monthStart = new Date(now.setDate(1));

      // Referência à subcoleção 'vendas'
      const vendasRef = collection(db, "orders", userId, "vendas");
      const q = query(
        vendasRef,
        where("createdAt", ">=", Timestamp.fromDate(monthStart))
      );

      const querySnapshot = await getDocs(q);

      let daily = 0,
        weekly = 0,
        monthly = 0;
      const pending = [];

      querySnapshot.forEach((doc) => {
        const order = { id: doc.id, ...doc.data() };
        const orderDate = order.createdAt.toDate();

        if (orderDate >= dayStart) daily += order.total;
        if (orderDate >= weekStart) weekly += order.total;
        monthly += order.total;

        if (order.status === "pending") {
          pending.push(order);
        }
      });

      setSalesData({ daily, weekly, monthly });
      setPendingOrders(pending);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      Alert.alert("Erro", "Falha ao carregar dados");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const StatCard = ({ title, value }) => (
    <View className="bg-secundaria-50 p-4 rounded-lg flex-1 mx-1">
      <Text className="text-quinta text-sm ">{title}</Text>
      <Text className="text-secundaria-900 text-lg font-bold">
        {new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL",
        }).format(value)}
      </Text>
    </View>
  );

  const QuickAction = ({ icon, title, onPress, badgeCount }) => (
    <TouchableOpacity
      onPress={onPress}
      className="bg-secundaria-100 p-2 rounded-lg flex items-center justify-center w-18 h-18 m-2"
    >
      <View className="relative">
        {icon}
        {badgeCount > 0 && (
          <View className="absolute -top-2 -right-4 bg-red-500 rounded-full min-w-5 h-5 flex items-center justify-center">
            <Text className="text-white text-xs font-bold">
              {badgeCount > 99 ? "99+" : badgeCount}
            </Text>
          </View>
        )}
      </View>
      <Text className="text-secundaria-700 text-sm mt-2 text-center">
        {title}
      </Text>
    </TouchableOpacity>
  );

  const formatDateTime = (timestamp) => {
    const date = timestamp.toDate();
    return {
      date: date.toLocaleDateString("pt-BR"),
      time: date.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  };

  const OrderCard = ({ order }) => {
    const { date, time } = formatDateTime(order.createdAt);
    const totalQuantity = order.items.reduce(
      (sum, item) => sum + item.quantity,
      0
    );

    return (
      <View className="bg-secundaria-50 p-4 rounded-lg mb-2">
        <View className="flex-row justify-between mb-2">
          <Text className="flex-1 text-secundaria-900 font-bold">
            Pedido #{order.id.slice(-6)}
          </Text>
          <Text className="text-quinta font-bold">
            {new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(order.total)}
          </Text>
        </View>

        <View className="flex-row justify-between">
          <View>
            <Text className="text-quinta text-sm">{date}</Text>
            <Text className="text-quinta text-sm">{time}</Text>
          </View>
          <View className="items-end">
            <Text className="text-quinta text-sm">
              {totalQuantity} unidades
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-primaria">
      <ScrollView
        className="flex-1 p-6"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View className="w-full h-16">
          {loading ? (
            <ActivityIndicator size="large" className="color-secundaria-700" />
          ) : (
            <View className="flex-1 flex-row px-2 py-2 gap-2">
              <Text className="flex-1 font-thin text-2xl text-secundaria-900">
                Olá, {userInfo.name}
              </Text>
              <TouchableOpacity onPress={() => router.push("/perfil")}>
                <Image
                  className="w-12 h-12 border-2 border-secundaria-700 rounded-full"
                  source={
                    userInfo.photoURL
                      ? { uri: userInfo.photoURL }
                      : images.profile
                  }
                  contentFit="cover"
                  transition={500}
                  cachePolicy="memory-disk"
                />
              </TouchableOpacity>
            </View>
          )}
        </View>
        <View className="w-full h-[2px] bg-secundaria-700 mb-2" />
        <View className="flex-row items-center justify-between mb-6">
          <Text className="text-2xl font-bold text-secundaria-900">
            Dashboard
          </Text>
          <TouchableOpacity
            onPress={() => {}}
            className="bg-terceira-100 p-2 rounded-full"
          >
            <Ionicons name="notifications-outline" size={20} color="#7f5d5a" />
          </TouchableOpacity>
        </View>
        <View className="flex-row mb-6">
          <StatCard title="Hoje" value={salesData.daily} />
          <StatCard title="Semana" value={salesData.weekly} />
          <StatCard title="Mês" value={salesData.monthly} />
        </View>

        <View className="mb-6">
          <Text className="text-xl font-bold text-secundaria-900 mb-4">
            Ações Rápidas
          </Text>
          <View className="flex-row justify-start">
            <QuickAction
              icon={
                <Ionicons name="storefront-outline" size={20} color="#7f5d5a" />
              }
              title="Produtos"
              onPress={() => router.push("/vender")}
            />
            <QuickAction
              icon={<Ionicons name="cube-outline" size={20} color="#7f5d5a" />}
              title="Pedidos"
              onPress={() => router.push("/screens/pedidos")}
              badgeCount={pendingOrders.length} // Usando o length dos pedidos pendentes
            />
            <QuickAction
              icon={
                <Ionicons name="archive-outline" size={20} color="#7f5d5a" />
              }
              title="Histórico"
              onPress={() => router.push("/dashboard")}
            />
            <QuickAction
              icon={
                <Ionicons name="settings-outline" size={20} color="#7f5d5a" />
              }
              title="Configurações"
              onPress={() => router.push("/config")}
            />
          </View>
        </View>
        <View className="mb-6">
          <Text className="text-xl font-bold text-secundaria-900 mb-4">
            Pedidos Pendentes
          </Text>
          {pendingOrders.length > 0 ? (
            pendingOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))
          ) : (
            <Text className="text-quinta text-center p-4">
              Nenhum pedido pendente
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Home;
