import React, { useState, useEffect, useMemo } from "react";
import { Platform } from "react-native";
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
import { images } from "@/constants";
import { CartService } from "@/services/CartService";
import { useNavigation } from "@react-navigation/native";

const CACHE_KEY = "user_products_cache";
const CACHE_DURATION = 1000 * 60 * 5;

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
      justifyContent: Platform.OS === "web" ? "flex-start" as "flex-start" : "space-around" as "space-around",// Declara explicitamente o tipo
      marginBottom: 16,
      gap: 16,
      paddingHorizontal: Platform.OS === "web" ? 16 : 8,
    }),
    []
  );

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
    fetchUserData();
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
        onPress={() => handleProductPress(item)}
      />
    </View>
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

      <View className="flex-1">
        <FlatList
          data={filteredAndSortedProducts}
          keyExtractor={(item) => item.id}
          renderItem={renderProduct}
          numColumns={numColumns}
          key={numColumns} // Força recriação do FlatList quando muda o número de colunas
          columnWrapperStyle={columnWrapperStyle}
          contentContainerStyle={{
            padding: Platform.OS === "web" ? 16 : 2,
          }}
          ListHeaderComponent={
            <View
              className={`px-4 mb-2 ${
                Platform.OS === "web" ? "w-full mx-auto" : ""
              }`}
            >
              <TextInput
                className="h-12 px-3 bg-white rounded border border-gray-300"
                placeholder="Buscar produto..."
                value={searchText}
                onChangeText={setSearchText}
              />
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

      {/* Botão do carrinho */}
      <TouchableOpacity
        className="absolute bottom-24 right-8 w-14 h-14 bg-green-500 rounded-full items-center justify-center"
        onPress={() => router.push("/screens/Cart")}
      >
        <Text className="text-white font-bold">{cartCount}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => {
          animateButton();
          router.push("/criar");
        }}
        className="absolute right-8 bottom-8 w-14 h-14 bg-secundaria-500 rounded-full items-center justify-center"
      >
        <Text className="text-white text-3xl">+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default Vender;
