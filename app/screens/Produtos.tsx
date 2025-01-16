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
import CardProdutoSimples from "@/components/CardProdutoSimples";
import Header from "@/components/CustomHeader";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ModalProduto from "@/components/ModalProduto";

const CACHE_KEY = "user_products_cache";
const CACHE_DURATION = 1000 * 60 * 5; // 5 minutes
const VIEW_MODE_KEY = "products_view_mode";

const Produtos = () => {
  const [products, setProducts] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("grid"); // "grid" ou "list"
  const router = useRouter();
  const { width } = useWindowDimensions();

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const getNumColumns = () => {
    if (viewMode === "list") return 1;

    if (Platform.OS === "web") {
      if (width > 1400) return 6;
      if (width > 1100) return 5;
      if (width > 800) return 4;
      return 3;
    }
    return 3;
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

  // Carregar preferência de visualização
  useEffect(() => {
    const loadViewMode = async () => {
      try {
        const savedViewMode = await AsyncStorage.getItem(VIEW_MODE_KEY);
        if (savedViewMode) {
          setViewMode(savedViewMode);
        }
      } catch (error) {
        console.error("Erro ao carregar modo de visualização:", error);
      }
    };
    loadViewMode();
  }, []);

  // Salvar preferência de visualização
  const toggleViewMode = async () => {
    const newMode = viewMode === "grid" ? "list" : "grid";
    setViewMode(newMode);
    try {
      await AsyncStorage.setItem(VIEW_MODE_KEY, newMode);
    } catch (error) {
      console.error("Erro ao salvar modo de visualização:", error);
    }
  };

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

  const handleProductPress = (product) => {
    setSelectedProduct(product);
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setSelectedProduct(null);
  };

  const renderProduct = ({ item, index }) => {
    if (viewMode === "list") {
      return (
        <View className="mb-2">
          <CardProdutoSimples
            title={item.title}
            price={item.value}
            imageSource={item.imageUrl ? { uri: item.imageUrl } : null}
            backgroundColor={item.backgroundColor}
            onPress={() => handleProductPress(item)}
          />
        </View>
      );
    }

    return (
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
          onPress={() => handleProductPress(item)}
        />
      </View>
    );
  };

  const ViewModeButton = () => (
    <TouchableOpacity
      onPress={toggleViewMode}
      className="px-4 py-2 bg-white rounded-lg mr-2"
    >
      <Text className="text-primaria font-medium">
        {viewMode === "grid" ? "Lista" : "Grade"}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-primaria">
      <Header
        title="Meus Produtos"
        onGoBack={() => router.back()}
        isCompactView={viewMode === "list"}
        onToggleView={toggleViewMode}
      />

      <FlatList
        data={products}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        numColumns={numColumns}
        key={numColumns}
        className="mt-4"
        columnWrapperStyle={
          viewMode === "grid" ? columnWrapperStyle : undefined
        }
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
      <ModalProduto
        isVisible={isModalVisible}
        produto={selectedProduct}
        onClose={handleCloseModal}
        onEdit={() => {
          handleCloseModal();
          handleEditProduct(selectedProduct);
        }}
      />
    </SafeAreaView>
  );
};

export default Produtos;
