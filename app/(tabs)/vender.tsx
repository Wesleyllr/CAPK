import React, { useState, useEffect, useMemo } from "react";
import { Platform } from "react-native";
import { cartEvents } from "../screens/Cart"; // Adicione este import

import {
  View,
  Text,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Animated,
  TextInput,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getUserInfo } from "@/userService";
import { getUserProducts } from "@/scripts/productService";
import { getUserCategories } from "@/userService";
import CardProduto1 from "@/components/CardProduto1";
import { icons, images } from "@/constants";
import { CartService } from "@/services/CartService";
import { useNavigation } from "@react-navigation/native";
import { getColor } from "@/colors";
import CardProdutoSimples from "@/components/CardProdutoSimples";
import eventBus from "@/utils/eventBus";
import TouchableWithSound from "@/components/TouchableWithSound";

const CACHE_KEY = "user_products_cache";
const CACHE_DURATION = 1000 * 60 * 5;
const VIEW_MODE_KEY = "products_view_mode";

const Vender = () => {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [cartCount, setCartCount] = useState(0);
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const scaleAnim = new Animated.Value(1);
  const opacityAnim = new Animated.Value(1);
  const translateYAnim = new Animated.Value(0);
  const [viewMode, setViewMode] = useState("grid"); // "grid" ou "list"
  const [selectedQuantities, setSelectedQuantities] = useState<{
    [key: string]: number;
  }>({});

  useEffect(() => {
    const handleQuantityChange = ({ id, quantity }) => {
      setSelectedQuantities((prev) => ({
        ...prev,
        [id]: quantity,
      }));
    };

    cartEvents.on("quantityChanged", handleQuantityChange);

    return () => {
      cartEvents.off("quantityChanged", handleQuantityChange);
    };
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

  useEffect(() => {
    // Listener para limpar as quantidades selecionadas quando o carrinho for limpo
    const handleCartCleared = () => {
      setSelectedQuantities({});
    };

    cartEvents.on("cartCleared", handleCartCleared);

    // Cleanup do listener quando o componente for desmontado
    return () => {
      cartEvents.off("cartCleared", handleCartCleared);
    };
  }, []);

  const handleClearSelectedItems = async () => {
    try {
      // Limpa as quantidades selecionadas
      setSelectedQuantities({});
      // Limpa o carrinho
      await CartService.clearCart();
      setCartCount(0); // Atualiza a contagem do carrinho
    } catch (error) {
      Alert.alert("Erro", "Falha ao limpar itens selecionados.");
    }
  };

  const getNumColumns = () => {
    if (Platform.OS === "web") {
      if (viewMode === "list") return 2; // Exibe 2 colunas para "list" na web
      if (width > 1400) return 7; // Telas muito grandes
      if (width > 1100) return 5; // Telas grandes
      if (width > 800) return 4; // Telas médias
      return 3; // Telas pequenas
    }
    if (viewMode === "list") return 1; // Mobile (iOS/Android)
    return 3; // Mobile padrão
  };

  const numColumns = getNumColumns();

  const toggleViewMode = async () => {
    const newMode = viewMode === "grid" ? "list" : "grid";
    setViewMode(newMode);
    try {
      await AsyncStorage.setItem(VIEW_MODE_KEY, newMode);
    } catch (error) {
      console.error("Erro ao salvar modo de visualização:", error);
    }
  };

  const columnWrapperStyle = useMemo(() => {
    if (viewMode === "list") {
      return {
        flexDirection: "row",
        justifyContent:
          Platform.OS === "web" ? "space-between" : "space-around",
        marginBottom: 16,
        paddingHorizontal: Platform.OS === "web" ? 16 : 8,
      };
    }
    return {
      justifyContent:
        Platform.OS === "web"
          ? "space-around" // Para web, usa justify-around para distribuir os itens
          : "space-between", // Para dispositivos móveis, você pode usar "space-between" ou outro alinhamento
      marginBottom: 16,
      gap: 16,
      paddingHorizontal: Platform.OS === "web" ? 16 : 8,
    };
  }, [viewMode]);
  const animateButton = () => {
    Animated.sequence([
      // Aumenta o tamanho do botão com suavidade
      Animated.spring(scaleAnim, {
        toValue: 1.2,
        useNativeDriver: true,
      }),
      // Diminui o tamanho de volta
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }),
      // Anima a opacidade (fade in e fade out)
      Animated.timing(opacityAnim, {
        toValue: 0.7,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
      // Movimenta o botão levemente para cima e para baixo
      Animated.sequence([
        Animated.timing(translateYAnim, {
          toValue: -10,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(translateYAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
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

  const cacheProducts = async (data: any[]) => {
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

  const fetchUserData = async () => {
    try {
      const username = await getUserInfo("username");
      setUserInfo(username);

      const cachedLoaded = await loadCachedProducts();
      if (!cachedLoaded) {
        const userProducts = await getUserProducts();
        setProducts(userProducts);
        cacheProducts(userProducts);
      }
    } catch (error) {
      Alert.alert("Erro", "Falha ao carregar dados.");
    } finally {
      setLoading(false);
    }
  };

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
    const updateCartCount = async () => {
      const count = await CartService.getItemCount();
      setCartCount(count);
    };

    // Atualiza quando a tela recebe foco
    const unsubscribe = navigation.addListener("focus", updateCartCount);

    return () => unsubscribe();
  }, [navigation]);
  const fetchCategories = async () => {
    try {
      const userCategories = await getUserCategories();
      setCategories(userCategories);
    } catch (error) {
      Alert.alert("Erro", "Falha ao carregar categorias.");
    }
  };

  useEffect(() => {
    fetchUserData();
    fetchCategories(); // Adicione isso aqui para carregar as categorias
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const userProducts = await getUserProducts();
      setProducts(userProducts);
      cacheProducts(userProducts);
    } catch (error) {
      Alert.alert("Erro", "Falha ao atualizar produtos.");
    } finally {
      setIsRefreshing(false);
    }
  };

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

  const handleProductPress = async (product) => {
    try {
      setSelectedQuantities((prev) => {
        const currentQty = prev[product.id] || 0;
        const newQty = currentQty + 1;
        return { ...prev, [product.id]: newQty };
      });

      const cartItem: ICartItem = {
        id: product.id,
        title: product.title,
        value: product.value,
        quantity: 1,
        imageUrl: product.imageUrl || undefined,
        observations: "",
      };

      await CartService.addItem(cartItem);
      setCartCount((prev) => prev + 1);
    } catch (error) {
      Alert.alert("Erro", "Falha ao adicionar ao carrinho");
    }
  };

  const renderProduct = ({ item, index }) => {
    const quantity = selectedQuantities[item.id] || 0;

    if (viewMode === "list") {
      return (
        <CardProdutoSimples
          title={item.title}
          price={item.value}
          imageSource={item.imageUrl ? { uri: item.imageUrl } : null}
          backgroundColor={item.backgroundColor}
          onPress={() => handleProductPress(item)}
          quantity={quantity}
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
        quantity={quantity}
      />
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-primaria flex-col">
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
      <View className="w-full h-1" />
      <View className="flex-1 px-1">
        <FlatList
          data={filteredAndSortedProducts}
          keyExtractor={(item) => item.id}
          renderItem={renderProduct}
          numColumns={numColumns}
          key={`${numColumns}-${viewMode}`} // Garante atualização do layout ao alternar entre modos
          columnWrapperStyle={numColumns > 1 ? columnWrapperStyle : undefined} // Aplica somente se numColumns > 1
          contentContainerStyle={{
            padding: Platform.OS === "web" ? 16 : 2,
          }}
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
            <Text className="text-center mt-4">Nenhum produto encontrado.</Text>
          )}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
            />
          }
        />
      </View>

      {/* Botão para limpar os itens selecionados (lado esquerdo) */}
      <TouchableWithSound
        className="absolute bottom-24 right-8 w-14 h-14 bg-red-500 rounded-full items-center justify-center"
        onPress={handleClearSelectedItems}
        soundType="click2"
      >
        <Text className="text-white font-bold text-sm ">Limpar</Text>
      </TouchableWithSound>

      {/* Botão do carrinho (lado direito) */}
      <TouchableOpacity
        className="absolute bottom-8 right-8 w-14 h-14 bg-green-500 rounded-full items-center justify-center"
        onPress={() => router.push("/screens/Cart")}
      >
        <Text className="text-white font-bold">{cartCount}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default Vender;
