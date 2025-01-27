import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Alert,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { signOut } from "firebase/auth";
import { auth, db } from "@/firebaseConfig";
import { router, useRouter } from "expo-router";
import { getUserInfo } from "@/userService";
import { Ionicons } from "@expo/vector-icons";
import { collection, query, where, getDocs } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
const CACHE_KEY = "user_products_cache";
const VIEW_MODE_KEY = "products_view_mode";

const Perfil = () => {
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState({
    name: "",
    email: "",
    phone: "",
    photoURL: null,
    username: "",
    createdAt: null,
    totalProducts: 0,
    recentSales: [],
  });
  const [refreshing, setRefreshing] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const user = auth.currentUser;
  const userId = user.uid;

  useEffect(() => {
    loadUserInfo();
  }, []);

  const loadUserInfo = async () => {
    try {
      setLoading(true);
      const [name, phone, username] = await Promise.all([
        getUserInfo("name"),
        getUserInfo("phone"),
        getUserInfo("username"),
      ]);

      const email = auth.currentUser?.email;
      const photoURL = auth.currentUser?.photoURL;
      const createdAt = auth.currentUser?.metadata.creationTime;

      const productsQuery = query(collection(db, "orders", userId, "vendas"));
      const productsSnapshot = await getDocs(productsQuery);

      const salesQuery = query(
        collection(db, "orders", userId, "vendas"),
        where("status", "==", "completed")
      );
      const salesSnapshot = await getDocs(salesQuery);
      const recentSales = salesSnapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 2);

      setUserInfo({
        name,
        email,
        phone,
        photoURL,
        username,
        createdAt,
        totalProducts: productsSnapshot.size,
        recentSales,
      });
    } catch (error) {
      console.error("Erro ao carregar informações do usuário:", error);
      Alert.alert("Erro", "Falha ao carregar informações do usuário");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadUserInfo();
  };

  const clearCache = async () => {
    try {
      await AsyncStorage.removeItem(CACHE_KEY); // Limpa o cache de produtos
      await AsyncStorage.removeItem(VIEW_MODE_KEY); // Limpa o modo de visualização
      // Adicione outras chaves que você deseja limpar aqui
    } catch (error) {
      console.error("Erro ao limpar cache:", error);
    }
  };

  const performLogout = async () => {
    try {
      await clearCache(); // Limpa o cache antes de sair
      await signOut(auth);
      router.replace("/login");
    } catch (error) {
      Alert.alert("Erro", "Falha ao realizar logout");
    }
  };

  const handleLogout = async () => {
    // Skip confirmation for web version
    if (Platform.OS === "web") {
      performLogout();
      return;
    }

    // Show confirmation dialog for mobile versions
    if (hasUnsavedChanges) {
      Alert.alert(
        "Alterações não salvas",
        "Você tem alterações não salvas. Deseja sair mesmo assim?",
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Sair", style: "destructive", onPress: performLogout },
        ]
      );
    } else {
      Alert.alert("Sair", "Deseja realmente sair?", [
        { text: "Cancelar", style: "cancel" },
        { text: "Sair", style: "destructive", onPress: performLogout },
      ]);
    }
  };

  const InfoItem = ({ icon, label, value }) => (
    <View className="flex-row items-center mb-4 last:mb-0">
      <Ionicons name={icon} size={20} color="#7f5d5a" className="mr-4" />
      <View className="flex-1 ml-4">
        <Text className="text-quinta text-sm">{label}</Text>
        <Text className="text-secundaria-900">{value || "Não informado"}</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-primaria items-center justify-center">
        <ActivityIndicator size="large" className="color-secundaria-700" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-primaria">
      <ScrollView
        className="flex-1 p-6"
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View className="flex-row justify-between items-center mb-6">
          <Text className="text-2xl font-bold text-secundaria-900">Perfil</Text>
          <TouchableOpacity
            onPress={() => router.push("/screens/editProfile")}
            className="bg-terceira-100 p-2 rounded-full"
          >
            <Ionicons name="pencil" size={20} color="#7f5d5a" />
          </TouchableOpacity>
        </View>

        <View className="items-center mb-6">
          <View className="w-24 h-24 rounded-full bg-secundaria-100 mb-4 overflow-hidden">
            {userInfo.photoURL ? (
              <Image
                source={{ uri: userInfo.photoURL }}
                className="w-full h-full"
              />
            ) : (
              <View className="w-full h-full items-center justify-center">
                <Ionicons name="person" size={40} color="#7f5d5a" />
              </View>
            )}
          </View>
          <Text className="text-xl font-bold text-secundaria-900 mb-1">
            {userInfo.name || "Nome não informado"}
          </Text>
          <Text className="text-sm text-quinta">@{userInfo.username}</Text>
        </View>

        <View className="bg-secundaria-50 rounded-lg p-4 mb-4">
          <InfoItem icon="mail" label="Email" value={userInfo.email} />
          <InfoItem icon="call" label="Telefone" value={userInfo.phone} />
          <InfoItem
            icon="calendar"
            label="Membro desde"
            value={
              userInfo.createdAt
                ? new Date(userInfo.createdAt).toLocaleDateString()
                : null
            }
          />
          <InfoItem
            icon="cube"
            label="Total de Produtos"
            value={userInfo.totalProducts.toString()}
          />
        </View>

        {userInfo.recentSales.length > 0 && (
          <View className="mb-6">
            <Text className="text-lg font-bold text-secundaria-900 mb-2">
              Vendas Recentes
            </Text>
            {userInfo.recentSales.map((sale) => (
              <View
                key={sale.id}
                className="bg-secundaria-50 p-3 rounded-lg mb-2"
              >
                <Text className="text-secundaria-900">
                  Pedido #{sale.id.slice(-6)}
                </Text>
                <Text className="text-quinta text-sm">
                  {new Date(sale.createdAt.toDate()).toLocaleDateString()}
                </Text>
                <Text className="text-secundaria-900 font-bold">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(sale.total)}
                </Text>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity
          onPress={handleLogout}
          className="bg-terceira-500 p-4 rounded-lg my-6"
        >
          <Text className="text-white text-center font-bold">Sair</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Perfil;
