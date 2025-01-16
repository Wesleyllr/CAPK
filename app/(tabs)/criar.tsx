import {
  View,
  Text,
  Alert,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Image } from "expo-image";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { uploadProductImage } from "@/scripts/uploadImage";
import { addProduct } from "@/scripts/productService";
import { pickImagem } from "@/scripts/selecionarImagem";
import FormFieldProduct from "@/components/FormFieldProduct";
import CategoryDropdown from "@/components/CategoryDropdown";
import Header from "@/components/CustomHeader";
import { useRouter } from "expo-router";
import ColorSelector from "@/components/ColorSelector";
import { db, auth } from "@/firebaseConfig";
import { Timestamp } from "firebase/firestore";
import eventBus from "@/utils/eventBus";
import TouchableWithSound from "@/components/TouchableWithSound";

const Criar = () => {
  const [isUploading, setIsUploading] = useState(false);
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

  const router = useRouter();

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

  const handleAddProduct = async () => {
    if (!productData.imageUrl && !productData.backgroundColor) {
      Alert.alert("Erro", "Selecione uma imagem ou uma cor para o produto.");
      return;
    }
    if (!productData.title || !productData.category) {
      Alert.alert(
        "Erro",
        "Informe o nome do produto e selecione uma categoria."
      );
      return;
    }

    setIsUploading(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Usuário não autenticado");

      let finalImageUrl = productData.imageUrl
        ? await uploadProductImage(productData.imageUrl)
        : "";

      const finalValue = parseFloat(productData.value) / 100;
      const finalCusto = parseFloat(productData.custo || "0") / 100;

      await addProduct(
        productData.title,
        productData.description,
        finalValue,
        finalCusto,
        productData.category,
        Timestamp.fromDate(new Date()),
        finalImageUrl,
        productData.codeBar,
        productData.backgroundColor
      );

      Alert.alert("Sucesso", "Produto adicionado com sucesso!");
      eventBus.emit("produtoAtualizado");
      router.back();
    } catch (error) {
      console.error("Erro ao adicionar produto:", error);
      Alert.alert("Erro", "Falha ao adicionar o produto.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-primaria">
      <Header
        title="Novo Produto"
        onGoBack={() => router.back()}
        showSaveIcon={false}
      />

      <ScrollView className="flex-1 bg-primaria">
        <View className="p-4 bg-white rounded-lg mx-4 mt-4 shadow-sm">
          {/* Seção de Imagem e Cor */}
          <View className="mb-6">
            <Text className="text-lg font-bold mb-3 text-secundaria-900">
              Imagem do Produto
            </Text>
            <View className="flex-row gap-2">
              <View className="w-36 h-36 rounded-xl bg-secundaria-100 shadow-sm">
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
                    <View className="absolute top-2 right-2 bg-black/50 rounded-full p-2">
                      <Text className="text-white text-xs">✕</Text>
                    </View>
                  </TouchableOpacity>
                ) : productData.backgroundColor ? (
                  <TouchableOpacity
                    onPress={() =>
                      setProductData((prev) => ({
                        ...prev,
                        backgroundColor: null,
                      }))
                    }
                    className="w-full h-full"
                  >
                    <View
                      className="w-full h-full rounded-xl"
                      style={{ backgroundColor: productData.backgroundColor }}
                    />
                    <View className="absolute top-2 right-2 bg-black/50 rounded-full p-2">
                      <Text className="text-white text-xs">✕</Text>
                    </View>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    onPress={handleSelectImage}
                    className="w-full h-full rounded-xl justify-center items-center border-2 border-dashed border-secundaria-300"
                  >
                    <Text className="text-secundaria-600 text-center px-2">
                      Toque para adicionar imagem
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              <View className="flex-1 bg-secundaria-100 rounded-xl p-2">
                <Text className="text-sm font-semibold mb-2 text-secundaria-900">
                  Ou selecione uma cor
                </Text>
                <ColorSelector
                  selectedColor={productData.backgroundColor}
                  onColorSelect={handleColorSelect}
                />
              </View>
            </View>
          </View>

          {/* Informações Básicas */}
          <View className="space-y-4">
            <FormFieldProduct
              title="Nome do Produto"
              value={productData.title}
              handleChangeText={(text) =>
                setProductData((prev) => ({ ...prev, title: text }))
              }
              placeholder="Nome do produto"
            />

            <FormFieldProduct
              title="Descrição"
              value={productData.description}
              handleChangeText={(text) =>
                setProductData((prev) => ({ ...prev, description: text }))
              }
              placeholder="Descrição do produto"
              multiline={true}
            />

            <View className="flex-row gap-4">
              <View className="flex-1">
                <FormFieldProduct
                  title="Preço de Venda"
                  value={productData.value}
                  handleChangeText={(text) => {
                    const rawValue = text.replace(/\D/g, "");
                    setProductData((prev) => ({ ...prev, value: rawValue }));
                  }}
                  placeholder="Preço de Venda"
                  monetario={true}
                />
              </View>
              <View className="flex-1">
                <FormFieldProduct
                  title="Custo"
                  value={productData.custo}
                  handleChangeText={(text) => {
                    const rawValue = text.replace(/\D/g, "");
                    setProductData((prev) => ({ ...prev, custo: rawValue }));
                  }}
                  placeholder="Custo (opcional)"
                  monetario={true}
                />
              </View>
            </View>

            <View className="h-16">
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
            />
          </View>
        </View>

        {/* Botão de Salvar */}
        <View className="mx-4 mt-4 mb-8">
          <TouchableWithSound
            onPress={handleAddProduct}
            className="p-4 bg-green-500 rounded-lg"
            disabled={isUploading}
          >
            {isUploading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-center font-bold">
                Adicionar Produto
              </Text>
            )}
          </TouchableWithSound>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Criar;
