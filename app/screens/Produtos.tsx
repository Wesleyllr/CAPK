import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  Alert,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { getUserProducts } from "@/scripts/productService";
import CardProduto1 from "@/components/CardProduto1";
import Header from "@/components/CustomHeader";
import AsyncStorage from "@react-native-async-storage/async-storage";

const CACHE_KEY = "user_products_cache";
const CACHE_DURATION = 1000 * 60 * 5; // 5 minutes

const Produtos = () => {
  const [products, setProducts] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { width } = useWindowDimensions();

  const getNumColumns = () => {
    if (Platform.OS === "web") {
      if (width > 1400) return 6; // Telas muito grandes
      if (width > 1100) return 5; // Telas grandes
      if (width > 800) return 4; // Telas médias
      return 3; // Telas pequenas
    }
    return 3; // Mobile (iOS/Android)
  };

  const numColumns = getNumColumns();

  const columnWrapperStyle = useMemo(
    () => ({
      justifyContent:
        Platform.OS === "web"
          ? ("flex-start" as "flex-start")
          : ("space-around" as "space-around"),
      marginBottom: 16,
      gap: 16,
      paddingHorizontal: Platform.OS === "web" ? 16 : 8,
    }),
    []
  );

  const loadCachedProducts = async () => {
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_DURATION) {
          setProducts(data);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error("Erro ao carregar cache:", error);
      return false;
    }
  };

  const cacheProducts = async (data) => {
    try {
      await AsyncStorage.setItem(
        CACHE_KEY,
        JSON.stringify({
          data,
          timestamp: Date.now(),
        })
      );
    } catch (error) {
      console.error("Erro ao salvar cache:", error);
    }
  };

  const fetchProducts = async () => {
    try {
      const userProducts = await getUserProducts();
      setProducts(userProducts);
      cacheProducts(userProducts);
    } catch (error) {
      Alert.alert("Erro", "Falha ao carregar produtos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadProducts = async () => {
      const cachedLoaded = await loadCachedProducts();
      if (!cachedLoaded) {
        await fetchProducts();
      } else {
        setLoading(false);
      }
    };
    loadProducts();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchProducts();
    setIsRefreshing(false);
  };

  const handleEditProduct = (product) => {
    router.push({
      pathname: "/screens/EditarProduto",
      params: { productId: product.id },
    });
  };

  const renderProduct = ({ item, index }) => (
    <View
      style={{
        flex: Platform.OS === "web" ? 1 : undefined,
        maxWidth: Platform.OS === "web" ? `${100 / numColumns}%` : undefined,
      }}
    >
      <CardProduto1
        title={item.title}
        price={item.value}
        imageSource={item.imageUrl ? { uri: item.imageUrl } : null}
        backgroundColor={item.backgroundColor}
        onPress={() => handleEditProduct(item)}
      />
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-primaria">
      <Header title="Meus Produtos" onGoBack={() => router.back()}  />

      <FlatList
        data={products}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        numColumns={numColumns}
        key={numColumns}
        className="mt-4"
        columnWrapperStyle={columnWrapperStyle}
        contentContainerStyle={{
          padding: Platform.OS === "web" ? 16 : 2,
        }}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={() => (
          <Text className="text-center mt-4">
            {loading ? "Carregando..." : "Nenhum produto encontrado."}
          </Text>
        )}
      />
    </SafeAreaView>
  );
};

export default Produtos;
