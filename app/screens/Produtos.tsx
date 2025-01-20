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
  TextInput,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { getUserProducts } from "@/scripts/productService";
import CardProduto1 from "@/components/CardProduto1";
import CardProdutoSimples from "@/components/CardProdutoSimples";
import Header from "@/components/CustomHeader";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ModalProduto from "@/components/ModalProduto";
import eventBus from "@/utils/eventBus";
import { showMessage } from "react-native-flash-message";
import ModalProdutoWeb from "@/components/ModalProdutoWeb";
import { getUserCategories } from "@/userService";
import { Image } from "expo-image";
import { icons } from "@/constants";
import { getColor } from "@/colors";

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
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");

  const getNumColumns = () => {
    if (viewMode === "list") {
      if (Platform.OS === "web") {
        return 2; // Para "LIST" e "WEB", exibe 2 colunas
      }
      return 1; // Para "LIST" e não "WEB", exibe 1 coluna
    }

    // Para os outros casos (não "LIST")
    if (Platform.OS === "web") {
      if (width > 1400) return 7;
      if (width > 1100) return 5;
      if (width > 800) return 4;
      return 3;
    }

    return 3; // Para as plataformas móveis (não "web")
  };

  const numColumns = getNumColumns();

  const columnWrapperStyle = useMemo(
    () => ({
      justifyContent:
        Platform.OS === "web"
          ? "space-around" // Para web, usa justify-around para distribuir os itens
          : "space-between", // Para dispositivos móveis, você pode usar "space-between" ou outro alinhamento
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

  useEffect(() => {
    const handleProdutoAtualizado = () => {
      // Recarrega os produtos
      handleRefresh();
    };

    // Adiciona o listener
    eventBus.on("produtoAtualizado", handleProdutoAtualizado);

    // Cleanup quando o componente for desmontado
    return () => {
      eventBus.off("produtoAtualizado", handleProdutoAtualizado);
    };
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
      showMessage({
        message: "Erro ao carregar produtos.",
        type: "danger",
      });
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
    const isWeb = Platform.OS === "web";

    const path = isWeb ? "/screens/EditarProdutoWeb" : "/screens/EditarProduto";

    router.push({
      pathname: path,
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
        <CardProdutoSimples
          title={item.title}
          price={item.value}
          imageSource={item.imageUrl ? { uri: item.imageUrl } : null}
          backgroundColor={item.backgroundColor}
          onPress={() => handleProductPress(item)}
        />
      );
    }

    return (
      <CardProduto1
        title={item.title}
        price={item.value}
        imageSource={item.imageUrl ? { uri: item.imageUrl } : null}
        backgroundColor={item.backgroundColor}
        onPress={() => handleProductPress(item)}
      />
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

  const fetchCategories = async () => {
    try {
      const userCategories = await getUserCategories();
      setCategories(userCategories);
    } catch (error) {
      showMessage({
        message: "Erro ao carregar categorias.",
        type: "danger",
      });
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const filteredAndSortedProducts = useMemo(() => {
    return products
      .filter((product) => {
        const matchesSearch = product.title
          .toLowerCase()
          .includes(searchText.toLowerCase());
        const matchesCategory = selectedCategory
          ? product.category === selectedCategory
          : true;
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [products, searchText, selectedCategory]);

  const CategoryButton = ({ name, isSelected, onPress }) => (
    <TouchableOpacity
      onPress={onPress}
      className={`px-4 py-3 rounded-3xl mr-2 ${
        isSelected
          ? "bg-terceira-500 shadow-lg border border-terceira-700"
          : "bg-terceira-100 hover:bg-secundaria-200"
      }`}
    >
      <Text
        className={`text-center font-medium ${
          isSelected ? "text-white" : "text-secundaria-700"
        }`}
      >
        {name}
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

      <View className="w-full h-12 mt-2">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="px-4"
        >
          <CategoryButton
            name="Todos"
            isSelected={!selectedCategory}
            onPress={() => setSelectedCategory(null)}
          />
          {categories.map((category) => (
            <CategoryButton
              key={category.id}
              name={category.name}
              isSelected={selectedCategory === category.id}
              onPress={() => setSelectedCategory(category.id)}
            />
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredAndSortedProducts}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        numColumns={numColumns}
        key={numColumns}
        className="mt-1"
        columnWrapperStyle={numColumns > 1 ? columnWrapperStyle : undefined}
        contentContainerStyle={{
          padding: Platform.OS === "web" ? 16 : 2,
        }}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
        ListHeaderComponent={
          <View
            className={`px-4 mb-2 flex-row items-center ${
              Platform.OS === "web" ? "w-full mx-auto" : ""
            }`}
          >
            <TextInput
              className="h-12 px-3 flex-1 mr-2 bg-white rounded border border-gray-300"
              placeholder="Buscar produto..."
              value={searchText}
              onChangeText={setSearchText}
            />
            <TouchableOpacity onPress={toggleViewMode} className="h-10 w-10 ">
              <View
                className={`w-10 h-10 rounded-lg ${
                  Platform.OS === "web" ? "bg-secundaria-500" : ""
                }`}
              >
                <Image
                  source={
                    viewMode === "grid" ? icons.view_grid : icons.view_list
                  }
                  className="flex-1"
                  contentFit="contain"
                  tintColor={getColor("secundaria-500")}
                />
              </View>
            </TouchableOpacity>
          </View>
        }
        ListEmptyComponent={() => (
          <Text className="text-center mt-4">
            {loading ? "Carregando..." : "Nenhum produto encontrado."}
          </Text>
        )}
      />

      {Platform.OS === "web" ? (
        <ModalProdutoWeb
          isVisible={isModalVisible}
          produto={selectedProduct}
          onClose={handleCloseModal}
          onEdit={() => {
            handleCloseModal();
            handleEditProduct(selectedProduct);
          }}
        />
      ) : (
        <ModalProduto
          isVisible={isModalVisible}
          produto={selectedProduct}
          onClose={handleCloseModal}
          onEdit={() => {
            handleCloseModal();
            handleEditProduct(selectedProduct);
          }}
        />
      )}
    </SafeAreaView>
  );
};

export default Produtos;
