import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Platform, Modal, Button } from "react-native";
import { cartEvents } from "../screens/Cart"; // Adicione este import
import { ref, set } from "firebase/database"; // Adicione este import
import VariablePriceModal from "@/components/VariablePriceModal ";

import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  RefreshControl,
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
import { icons } from "@/constants";
import { CartService } from "@/services/CartService";
import { useNavigation } from "@react-navigation/native";
import { getColor } from "@/colors";
import CardProdutoSimples from "@/components/CardProdutoSimples";
import eventBus from "@/utils/eventBus";
import { alertaPersonalizado } from "@/utils/alertaPersonalizado";
import FormFieldProduct from "@/components/FormFieldProduct";
import { OrderService } from "@/services/OrderService";
import CardProdutoSimplesV2 from "@/components/CardProdutoSimplesV2";
import { rtdb } from "@/firebaseConfig";
import { NotificationService } from "@/services/notificationService";

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
  const [viewMode, setViewMode] = useState("grid"); // "grid", "list" ou "simple"
  const [processingClicks, setProcessingClicks] = useState<
    Record<string, boolean>
  >({});

  const [selectedQuantities, setSelectedQuantities] = useState<
    Record<string, number>
  >({});
  const [localCartCount, setLocalCartCount] = useState(0);
  const [nomeCliente, setnomeCliente] = useState("");
  const [forceUpdate, setForceUpdate] = useState(false);

  const [variablePriceModalVisible, setVariablePriceModalVisible] =
    useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [variablePrice, setVariablePrice] = useState("");

  useEffect(() => {
    const handleQuantityChange = ({ id, quantity }) => {
      setSelectedQuantities((prev) => ({
        ...prev,
        [id]: quantity,
      }));
    };

    const handleProdutoAtualizado = () => {
      handleRefresh();
    };

    const handleCartCleared = () => {
      setSelectedQuantities({});
    };

    cartEvents.on("quantityChanged", handleQuantityChange);
    eventBus.on("produtoAtualizado", handleProdutoAtualizado);
    cartEvents.on("cartCleared", handleCartCleared);

    return () => {
      cartEvents.off("quantityChanged", handleQuantityChange);
      eventBus.off("produtoAtualizado", handleProdutoAtualizado);
      cartEvents.off("cartCleared", handleCartCleared);
    };
  }, []);

  const handleClearSelectedItems = useCallback(async () => {
    try {
      setSelectedQuantities({});
      setLocalCartCount(0);
      await CartService.clearCart();
      setForceUpdate((prev) => !prev); // Força a re-renderização
    } catch (error) {
      alertaPersonalizado({
        message: "Erro",
        description: "Falha ao limpar itens selecionados.",
        type: "danger",
      });
    }
  }, []);

  const getNumColumns = () => {
    if (Platform.OS === "web") {
      if (viewMode === "list") return 2; // Exibe 1 coluna para "list" na web
      if (viewMode === "simple") return 2; // Exibe 1 coluna para "simple" na web
      if (viewMode === "grid") {
        if (width > 1400) return 7; // Telas muito grandes
        if (width > 1100) return 5; // Telas grandes
        if (width > 800) return 4; // Telas médias
        return 3; // Telas pequenas
      }
    }
    if (Platform.OS !== "web") {
      if (viewMode === "list") return 1; // Exibe 1 coluna para "list" em mobile
      if (viewMode === "simple") return 1; // Exibe 1 coluna para "simple" em mobile
      return 3; // Mobile padrão para "grid"
    }
  };

  const numColumns = getNumColumns();

  const toggleViewMode = async () => {
    const newMode =
      viewMode === "grid" ? "list" : viewMode === "list" ? "simple" : "grid";
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
      alertaPersonalizado({
        message: "Erro",
        description: "Falha ao carregar dados.",
        type: "danger",
      });
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
      setLocalCartCount(count); // Ensure both states are updated together
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
      alertaPersonalizado({
        message: "Erro",
        description: "Falha ao carregar categorias.",
        type: "danger",
      });
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
      alertaPersonalizado({
        message: "Erro",
        description: "Falha ao atualizar produtos.",
        type: "danger",
      });
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

  const handleProductPress = useCallback(async (product) => {
    if (processingClicks[product.id]) {
      return;
    }

    setProcessingClicks((prev) => ({ ...prev, [product.id]: true }));

    try {
      const cartItem: ICartItem = {
        id: product.id,
        title: product.title,
        value: product.value,
        quantity: 1, // Sempre adiciona 1
        imageUrl: product.imageUrl || undefined,
        observations: "",
      };

      await CartService.addItem(cartItem);

      // Atualiza a contagem local após a adição
      const updatedCount = await CartService.getItemCount();
      setLocalCartCount(updatedCount);

      // Atualiza as quantidades selecionadas
      const currentItems = await CartService.getItems();
      const updatedItem = currentItems.find((item) => item.id === product.id);
      if (updatedItem) {
        setSelectedQuantities((prev) => ({
          ...prev,
          [product.id]: updatedItem.quantity,
        }));
      }
    } catch (error) {
      alertaPersonalizado({
        message: "Erro",
        description: "Falha ao adicionar ao carrinho",
        type: "danger",
      });
    } finally {
      setProcessingClicks((prev) => ({ ...prev, [product.id]: false }));
    }
  }, []);

  const handleConfirmVariablePrice = async () => {
    const cleanValue = variablePrice.replace(/[^\d,]/g, "").replace(",", ".");
    const finalPrice = parseFloat(cleanValue);
    if (!isNaN(finalPrice) && finalPrice > 0 && selectedProduct) {
      const cartItem: ICartItem = {
        id: selectedProduct.id,
        title: selectedProduct.title,
        value: finalPrice,
        quantity: 1,
        imageUrl: selectedProduct.imageUrl || undefined,
        observations: "",
      };

      try {
        await CartService.addItem(cartItem);

        setSelectedQuantities((prev) => ({
          ...prev,
          [selectedProduct.id]: 1,
        }));

        const updatedCount = await CartService.getItemCount();
        setLocalCartCount(updatedCount);

        alertaPersonalizado({
          message: "Sucesso",
          description: "Produto adicionado ao carrinho",
          type: "success",
        });
      } catch (error) {
        alertaPersonalizado({
          message: "Erro",
          description: "Falha ao adicionar ao carrinho",
          type: "danger",
        });
      } finally {
        setVariablePriceModalVisible(false);
        setVariablePrice("");
        setSelectedProduct(null);
      }
    } else {
      alertaPersonalizado({
        message: "Erro",
        description: "Por favor, insira um valor válido",
        type: "warning",
      });
    }
  };

  useEffect(() => {
    const syncCartCount = async () => {
      const count = await CartService.getItemCount();
      setCartCount(count);
      setLocalCartCount(count); // Ensure both states are updated together
      setForceUpdate((prev) => !prev); // Força a re-renderização
    };

    // Sync on mount and when cart events occur
    syncCartCount();

    const handleCartUpdate = () => {
      syncCartCount();
    };

    cartEvents.on("quantityChanged", handleCartUpdate);
    cartEvents.on("cartCleared", handleCartUpdate);

    return () => {
      cartEvents.off("quantityChanged", handleCartUpdate);
      cartEvents.off("cartCleared", handleCartUpdate);
    };
  }, []);

  const handleOrder = async (status: "completed" | "pending") => {
    try {
      const items = await CartService.getItems();
      const total = items.reduce(
        (sum, item) => sum + item.value * item.quantity,
        0
      );
      const { orderRefId, idOrder } = await OrderService.createOrder(
        items,
        total,
        status,
        nomeCliente
      );

      // Envia notificação de novo pedido
      await NotificationService.sendOrderCreatedNotification();

      await CartService.clearCart();
      cartEvents.emit("cartCleared");
      eventBus.emit("pedidoAtualizado");

      const statusText = status === "completed" ? "finalizado" : "em aberto";
      alertaPersonalizado({
        message: "Sucesso",
        description: `Pedido ${idOrder} ${statusText}!`,
        type: "success",
      });

      if (Platform.OS !== "web") {
        router.back();
      }
    } catch (error) {
      alertaPersonalizado({
        message: "Erro",
        description: error.message || error,
        type: "danger",
      });
    }
  };

  const renderProduct = useCallback(
    ({ item }) => {
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
      } else if (viewMode === "simple") {
        return (
          <CardProdutoSimplesV2
            title={item.title}
            price={item.value}
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
    },
    [handleProductPress, selectedQuantities, viewMode]
  );

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
              {/* CONTADOR PARA VERSÃO WEB */}
              {Platform.OS === "web" && (
                <View className="h-12 w-12 mr-2 bg-red-500 justify-center items-center rounded-full">
                  <Text className="mx-2 text-xl font-bold text-white">
                    {localCartCount}
                  </Text>
                </View>
              )}
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
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={true}
        />
      </View>

      {/* Botão para limpar os itens selecionados (lado esquerdo) */}
      <TouchableOpacity
        className="absolute bottom-24 right-8 w-14 h-14 bg-red-500 rounded-full items-center justify-center"
        onPress={handleClearSelectedItems}
      >
        <Text className="text-white font-bold text-sm ">Limpar</Text>
      </TouchableOpacity>

      {/* Botão do carrinho (lado direito) */}
      <TouchableOpacity
        className="absolute bottom-8 right-8 w-14 h-14 bg-green-500 rounded-full items-center justify-center"
        onPress={() => router.push("/screens/Cart")}
      >
        <Text className="text-white font-bold">{localCartCount}</Text>
      </TouchableOpacity>

      {Platform.OS === "web" && (
        <View className="p-4 bg-secundaria-50">
          <FormFieldProduct
            title="Nome do Cliente"
            value={nomeCliente}
            handleChangeText={setnomeCliente}
            placeholder="Digite o nome do cliente"
          />
          <View className="flex-row gap-2 mt-4">
            <TouchableOpacity
              onPress={handleClearSelectedItems}
              className="flex-1 bg-red-500 p-4 rounded-lg"
            >
              <Text className="text-primaria text-center font-bold text-lg">
                Limpar
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push("/screens/Cart")}
              className="flex-1 bg-blue-500 p-4 rounded-lg"
            >
              <Text className="text-primaria text-center font-bold text-lg">
                Carrinho
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleOrder("pending")}
              className="flex-1 bg-terceira-500 p-4 rounded-lg"
              disabled={localCartCount === 0}
            >
              <Text className="text-primaria text-center font-bold text-lg">
                Deixar em Aberto
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleOrder("completed")}
              className="flex-1 bg-quarta p-4 rounded-lg"
              disabled={localCartCount === 0}
            >
              <Text className="text-primaria text-center font-bold text-lg">
                Finalizar Pedido
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <VariablePriceModal
        visible={variablePriceModalVisible}
        onClose={() => {
          setVariablePriceModalVisible(false);
          setVariablePrice("");
          setSelectedProduct(null);
        }}
        onConfirm={handleConfirmVariablePrice}
        value={variablePrice}
        onChange={setVariablePrice}
        productTitle={selectedProduct?.title}
      />
    </SafeAreaView>
  );
};

export default Vender;
