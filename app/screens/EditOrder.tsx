import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Platform, Modal, Button } from "react-native";
import { cartEvents } from "../screens/Cart";
import { ref, set } from "firebase/database";
import VariablePriceModal from "@/components/VariablePriceModal";
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
import { useRouter, useLocalSearchParams } from "expo-router"; // Ensure correct import
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
import { doc, getDoc, updateDoc, onSnapshot } from "firebase/firestore"; // Import getDoc, updateDoc, and onSnapshot
import { db, auth } from "@/firebaseConfig"; // Import db and auth
import { debounce } from "lodash"; // Add this import at the top

const CACHE_KEY = "user_products_cache";
const CACHE_DURATION = 1000 * 60 * 5;
const VIEW_MODE_KEY = "products_view_mode";

const EditOrder = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams(); // Get the order ID from the URL
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
  const [viewMode, setViewMode] = useState("grid");
  const [processingClicks, setProcessingClicks] = useState<
    Record<string, boolean>
  >({});
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [pendingOrderStatus, setPendingOrderStatus] = useState(null);

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

  const [showSelectedOnly, setShowSelectedOnly] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);

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
      setnomeCliente(""); // Clear the client name
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

  const toggleShowSelectedOnly = () => {
    setShowSelectedOnly((prev) => !prev);
  };

  const columnWrapperStyle = useMemo(() => {
    if (numColumns > 1) {
      return {
        flex: 1,
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
        gap: 8,
        padding: 8,
      };
    }
    return undefined;
  }, [numColumns]);

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
    const filteredProducts = products.filter((product) => {
      const matchesSearch = product.title
        .toLowerCase()
        .includes(searchText.toLowerCase());
      const matchesCategory = selectedCategory
        ? product.category === selectedCategory
        : true;
      const matchesSelected = showSelectedOnly
        ? selectedQuantities[product.id] > 0
        : true;
      return matchesSearch && matchesCategory && matchesSelected;
    });

    return filteredProducts.sort((a, b) => a.title.localeCompare(b.title));
  }, [
    products,
    searchText,
    selectedCategory,
    showSelectedOnly,
    selectedQuantities,
  ]);

  const handleProductPress = useCallback(async (product) => {
    if (processingClicks[product.id]) {
      return;
    }

    setProcessingClicks((prev) => ({ ...prev, [product.id]: true }));

    try {
      if (product.isVariablePrice) {
        setSelectedProduct(product);
        setVariablePriceModalVisible(true);
      } else {
        const cartItem: ICartItem = {
          id: product.id,
          title: product.title,
          value: product.value,
          quantity: 1,
          imageUrl: product.imageUrl || undefined,
          observations: "",
          categoryId: product.categoryId || product.category || "sem categoria",
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
        categoryId:
          selectedProduct.categoryId ||
          selectedProduct.category ||
          "sem categoria",
      };

      try {
        await CartService.addItem(cartItem);

        setSelectedQuantities((prev) => ({
          ...prev,
          [selectedProduct.id]: 1,
        }));

        const updatedCount = await CartService.getItemCount();
        setLocalCartCount(updatedCount);
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

  const handleConfirmOrder = async () => {
    setShowConfirmationModal(false);
    if (pendingOrderStatus) {
      await processOrder(pendingOrderStatus);
      setPendingOrderStatus(null);
    }
  };

  const handleCancelConfirmation = () => {
    setShowConfirmationModal(false);
    setPendingOrderStatus(null);
  };

  const handleOrder = async (status: "completed" | "pending") => {
    if (!nomeCliente.trim()) {
      setShowConfirmationModal(true);
      setPendingOrderStatus(status);
      return;
    }

    await processOrder(status);
  };

  const processOrder = async (status: "completed" | "pending") => {
    try {
      const items = await CartService.getItems();
      const total = items.reduce(
        (sum, item) => sum + item.value * item.quantity,
        0
      );

      const itemsWithCategory = items.map((item) => ({
        ...item,
        categoryId: item.categoryId || "sem categoria",
      }));

      const user = auth.currentUser;
      if (!user) throw new Error("Usuário não autenticado");

      const orderRef = doc(db, "orders", user.uid, "vendas", id);
      await updateDoc(orderRef, {
        items: itemsWithCategory,
        total,
        status,
        nomeCliente,
        updatedAt: new Date(),
      });

      // Use onSnapshot to listen for order updates
      onSnapshot(orderRef, (doc) => {
        if (doc.exists()) {
          const orderData = doc.data();
          console.log("Order updated:", orderData);
        }
      });

      await CartService.clearCart();
      cartEvents.emit("cartCleared");
      eventBus.emit("pedidoAtualizado");

      alertaPersonalizado({
        message: "Sucesso",
        description: `Pedido atualizado com sucesso!`,
        type: "success",
      });

      router.back();
    } catch (error) {
      alertaPersonalizado({
        message: "Erro",
        description: error.message || "Falha ao atualizar pedido",
        type: "danger",
      });
    }
  };

  const fetchOrderDetails = async (orderId: string) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error("Usuário não autenticado");
      }

      const orderRef = doc(db, "orders", user.uid, "vendas", orderId);
      const orderDoc = await getDoc(orderRef);
      if (orderDoc.exists()) {
        const orderData = orderDoc.data();
        setCurrentOrder(orderData);
        setnomeCliente(orderData.nomeCliente || "");

        // Pre-fill cart with order items
        await CartService.clearCart();
        for (const item of orderData.items) {
          await CartService.addItem({
            id: item.id,
            title: item.title,
            value: item.value,
            quantity: item.quantity,
            imageUrl: item.imageUrl,
            observations: item.observations || "",
            categoryId: item.categoryId || "sem categoria",
          });
        }

        // Update selected quantities
        const quantities = {};
        orderData.items.forEach((item) => {
          quantities[item.id] = item.quantity;
        });
        setSelectedQuantities(quantities);

        const totalItems = orderData.items.reduce(
          (sum, item) => sum + item.quantity,
          0
        );
        setLocalCartCount(totalItems);
      } else {
        throw new Error("Pedido não encontrado");
      }
    } catch (error) {
      console.error("Erro ao buscar detalhes do pedido:", error);
    }
  };

  useEffect(() => {
    if (id) {
      fetchOrderDetails(id as string); // Fetch order details if ID is present
    }
  }, [id]);

  // Move debounced update outside of renderProduct
  const createDebouncedUpdate = useCallback((itemId: string) => {
    return debounce(async (newQuantity: number) => {
      try {
        if (newQuantity === 0) {
          await CartService.removeItem(itemId);
          setSelectedQuantities((prev) => {
            const updated = { ...prev };
            delete updated[itemId];
            return updated;
          });
        } else {
          await CartService.updateItem(itemId, { quantity: newQuantity });
          cartEvents.emit("quantityChanged", {
            id: itemId,
            quantity: newQuantity,
          });
        }

        const updatedCount = await CartService.getItemCount();
        setLocalCartCount(updatedCount);
      } catch (error) {
        alertaPersonalizado({
          message: "Erro",
          description: "Falha ao atualizar quantidade",
          type: "danger",
        });
      }
    }, 300);
  }, []);

  // Store debounced functions
  const debouncedUpdates = useMemo(() => ({}), []);

  // Cleanup debounced functions when component unmounts
  useEffect(() => {
    return () => {
      Object.values(debouncedUpdates).forEach((debouncedFn: any) => {
        debouncedFn.cancel();
      });
    };
  }, [debouncedUpdates]);

  const renderProduct = useCallback(
    ({ item }) => {
      const quantity = selectedQuantities[item.id] || 0;

      // Get or create debounced function for this item
      if (!debouncedUpdates[item.id]) {
        debouncedUpdates[item.id] = createDebouncedUpdate(item.id);
      }

      const handleUpdateQuantity = async (newQuantity) => {
        // Update UI immediately
        setSelectedQuantities((prev) => ({
          ...prev,
          [item.id]: newQuantity,
        }));

        // Trigger debounced backend update
        debouncedUpdates[item.id](newQuantity);
      };

      const handleDecrease = () => {
        if (quantity > 0) {
          handleUpdateQuantity(quantity - 1);
        }
      };

      const handleIncrease = () => handleUpdateQuantity(quantity + 1);

      if (viewMode === "list") {
        return (
          <CardProdutoSimples
            title={item.title}
            price={item.value}
            imageSource={item.imageUrl ? { uri: item.imageUrl } : null}
            backgroundColor={item.backgroundColor}
            onPress={() => handleProductPress(item)}
            quantity={quantity}
            onDecrease={handleDecrease}
            onIncrease={handleIncrease}
            onUpdateQuantity={handleUpdateQuantity}
          />
        );
      }
      // ...rest of existing render conditions...
    },
    [
      selectedQuantities,
      handleProductPress,
      viewMode,
      createDebouncedUpdate,
      debouncedUpdates,
    ]
  );

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text>Carregando...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-primaria flex-col">
      <View className="flex-row justify-between items-center p-4 bg-terceira-500">
        <TouchableOpacity onPress={() => router.back()}>
          <Image
            source={icons.back}
            className="w-6 h-6"
            style={{ tintColor: "white" }}
          />
        </TouchableOpacity>
        <Text className="text-white text-lg font-bold">Editar Pedido</Text>
        <View className="w-6 h-6" />
      </View>

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
          key={`${numColumns}-${viewMode}`}
          columnWrapperStyle={numColumns > 1 ? columnWrapperStyle : undefined}
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
              {Platform.OS === "web" && (
                <TouchableOpacity onPress={toggleShowSelectedOnly}>
                  <View className="h-12 w-12 mr-2 bg-red-500 justify-center items-center rounded-full">
                    <Text className="mx-2 text-xl font-bold text-white">
                      {localCartCount}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={toggleViewMode} className="h-10 w-10">
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
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
            />
          }
        />
      </View>

      {/* Botões flutuantes para mobile */}
      {Platform.OS !== "web" && (
        <>
          <TouchableOpacity
            className="absolute bottom-40 right-8 w-14 h-14 bg-red-500 rounded-full items-center justify-center"
            onPress={() => router.back()}
          >
            <Text className="text-white font-bold text-sm">Cancelar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="absolute bottom-24 right-8 w-14 h-14 bg-blue-500 rounded-full items-center justify-center"
            onPress={() => router.push("/screens/Cart")}
          >
            <Text className="text-white font-bold text-sm">
              {localCartCount}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="absolute bottom-8 right-8 w-14 h-14 bg-green-500 rounded-full items-center justify-center"
            onPress={() => handleOrder("pending")}
            disabled={localCartCount === 0}
          >
            <Text className="text-white font-bold text-sm">Salvar</Text>
          </TouchableOpacity>
        </>
      )}

      {/* Barra inferior para web */}
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
              onPress={() => router.back()}
              className="flex-1 bg-red-500 p-4 rounded-lg"
            >
              <Text className="text-primaria text-center font-bold text-lg">
                Cancelar
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleOrder("pending")}
              className="flex-1 bg-terceira-500 p-4 rounded-lg"
              disabled={localCartCount === 0}
            >
              <Text className="text-primaria text-center font-bold text-lg">
                Salvar Alterações
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
      <OrderConfirmationModal
        visible={showConfirmationModal}
        onClose={handleCancelConfirmation}
        onConfirm={handleConfirmOrder}
      />
    </SafeAreaView>
  );
};

export default EditOrder;
