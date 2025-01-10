import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Alert,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db, auth } from "@/firebaseConfig";
import FormFieldProduct from "@/components/FormFieldProduct";
import CategoryDropdown from "@/components/CategoryDropdown";
import Header from "@/components/CustomHeader";
import ColorSelector from "@/components/ColorSelector";
import { pickImagem } from "@/scripts/selecionarImagem";
import { uploadProductImage } from "@/scripts/uploadImage";

const EditarProduto = () => {
  const router = useRouter();
  const { productId } = useLocalSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [productData, setProductData] = useState({
    title: "",
    description: "",
    value: "",
    custo: "",
    category: "",
    imageUrl: "",
    codeBar: "",
    backgroundColor: null,
  });

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const userId = auth.currentUser?.uid;
        if (!userId || !productId) {
          Alert.alert("Erro", "Não foi possível carregar o produto.");
          return;
        }

        const productRef = doc(
          db,
          "users",
          userId,
          "products",
          productId.toString()
        );
        const productDoc = await getDoc(productRef);

        if (productDoc.exists()) {
          const data = productDoc.data();
          setProductData({
            title: data.title || "",
            description: data.description || "",
            value: (data.value * 100).toString() || "",
            custo: (data.custo * 100).toString() || "",
            category: data.category || "",
            imageUrl: data.imageUrl || "",
            codeBar: data.codeBar || "",
            backgroundColor: data.backgroundColor || null,
          });
          console.log(data.value);
        }
      } catch (error) {
        Alert.alert("Erro", "Falha ao carregar dados do produto.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  const handleSelectImage = async () => {
    const uri = await pickImagem();
    if (uri) {
      setProductData((prev) => ({
        ...prev,
        imageUrl: uri,
        backgroundColor: null,
      }));
    }
  };

  const handleColorSelect = (color) => {
    setProductData((prev) => ({
      ...prev,
      backgroundColor: color,
      imageUrl: "",
    }));
  };

  const handleSaveProduct = async () => {
    try {
      setIsSaving(true);
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error("Usuário não autenticado");

      let finalImageUrl = productData.imageUrl;
      if (productData.imageUrl && !productData.imageUrl.startsWith("http")) {
        finalImageUrl = await uploadProductImage(productData.imageUrl);
      }

      // Divide o valor por 100 antes de salvar no Firestore
      const finalValue = parseFloat(productData.value) / 100;
      const finalCusto = parseFloat(productData.custo || "0") / 100;

      const productRef = doc(
        db,
        "users",
        userId,
        "products",
        productId.toString()
      );
      await updateDoc(productRef, {
        title: productData.title,
        description: productData.description,
        value: finalValue,
        custo: finalCusto,
        category: productData.category,
        imageUrl: finalImageUrl,
        codeBar: productData.codeBar,
        backgroundColor: productData.backgroundColor,
      });

      Alert.alert("Sucesso", "Produto atualizado com sucesso!");
      router.back();
    } catch (error) {
      Alert.alert("Erro", "Falha ao atualizar produto.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-primaria justify-center items-center">
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-primaria">
      <Header
        title="Editar Produto"
        onGoBack={() => router.back()}
        onSave={handleSaveProduct}
        showSaveIcon={true}
      />

      <ScrollView className="flex-1 bg-primaria">
        <FormFieldProduct
          title="Nome do Produto"
          value={productData.title}
          handleChangeText={(text) =>
            setProductData((prev) => ({ ...prev, title: text }))
          }
          otherStyles="px-4"
          placeholder="Nome do produto"
        />

        <FormFieldProduct
          title="Descrição"
          value={productData.description}
          handleChangeText={(text) =>
            setProductData((prev) => ({ ...prev, description: text }))
          }
          otherStyles="px-4"
          placeholder="Descrição do produto"
          multiline={true}
        />

        <View className="w-full flex-row my-4">
          <FormFieldProduct
            title="Preço de Venda"
            value={productData.value}
            handleChangeText={(text) => {
              const rawValue = text.replace(/\D/g, "");
              setProductData((prev) => ({ ...prev, value: rawValue }));
            }}
            placeholder="Preço de Venda"
            otherStyles="px-4 flex-1"
            monetario={true}
          />

          <FormFieldProduct
            title="Custo"
            value={productData.custo}
            handleChangeText={(text) => {
              const rawValue = text.replace(/\D/g, "");
              setProductData((prev) => ({ ...prev, custo: rawValue }));
            }}
            placeholder="Custo (opcional)"
            otherStyles="px-4 flex-1"
            monetario={true}
          />
        </View>

        <View className="flex-1 h-16 my-2">
          <CategoryDropdown
            value={productData.category}
            onChange={(category) =>
              setProductData((prev) => ({ ...prev, category }))
            }
          />
        </View>

        <FormFieldProduct
          title="Código de barras"
          value={productData.codeBar}
          handleChangeText={(text) =>
            setProductData((prev) => ({ ...prev, codeBar: text }))
          }
          placeholder="Código de barras"
          otherStyles="px-4"
        />

        <View className="w-full h-40 mt-2 justify-center items-center flex-row px-4 gap-2">
          <View className="w-36 h-36 rounded-xl bg-secundaria-300 justify-center items-center">
            {productData.imageUrl ? (
              <TouchableOpacity
                onPress={() =>
                  setProductData((prev) => ({
                    ...prev,
                    imageUrl: "",
                    backgroundColor: null,
                  }))
                }
                className="w-full h-full"
              >
                <Image
                  source={{ uri: productData.imageUrl }}
                  className="w-full h-full rounded-xl"
                  contentFit="contain"
                />
                <View className="absolute top-2 right-2 bg-black/50 rounded-full px-2 py-1">
                  <Text className="text-white text-xs">X</Text>
                </View>
              </TouchableOpacity>
            ) : productData.backgroundColor ? (
              <TouchableOpacity
                onPress={() =>
                  setProductData((prev) => ({ ...prev, backgroundColor: null }))
                }
                className="w-full h-full"
              >
                <View
                  className="w-full h-full rounded-xl"
                  style={{ backgroundColor: productData.backgroundColor }}
                />
                <View className="absolute top-2 right-2 bg-black/50 rounded-full px-2 py-1">
                  <Text className="text-white text-xs">X</Text>
                </View>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={handleSelectImage}
                className="bg-black w-full h-full rounded-xl justify-center"
              >
                <Text className="text-white text-center">
                  Selecione uma imagem ou cor
                </Text>
              </TouchableOpacity>
            )}
          </View>
          <View className="flex-1 h-36 bg-secundaria-300 border border-secundaria-700 rounded-xl justify-center">
            <ColorSelector
              selectedColor={productData.backgroundColor}
              onColorSelect={handleColorSelect}
            />
          </View>
        </View>

        {isSaving && <ActivityIndicator size="large" className="my-4" />}
      </ScrollView>
    </SafeAreaView>
  );
};

export default EditarProduto;
