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
import CustomButton from "@/components/CustomButton";
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
import { alertaPersonalizado } from "@/utils/alertaPersonalizado";

const Criar = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [productName, setProductName] = useState("");
  const [productDescricao, setProductDescricao] = useState("");
  const [productPreco, setProductPreco] = useState("");
  const [productCusto, setProductCusto] = useState("");
  const [productCodigoBarra, setProductCodigoBarra] = useState("");
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const router = useRouter();

  const handleGoBack = () => {
    router.back();
  };

  const handleSelectImage = async () => {
    const uri = await pickImagem();
    if (uri) {
      setSelectedImage(uri);
      setSelectedColor(null); // Limpa a cor quando uma imagem é selecionada
    }
  };

  const handleColorSelect = (color) => {
    setSelectedColor(color);
    setSelectedImage(null); // Limpa a imagem quando uma cor é selecionada
  };

  const handleCategoryChange = (newCategory) => {
    setSelectedCategory(newCategory);
  };

  const handleClearSelection = () => {
    setSelectedImage(null);
    setSelectedColor(null);
  };

  const handleAddProduct = async () => {
    if (!selectedImage && !selectedColor) {
      alertaPersonalizado({
        message: "Erro",
        description: "Selecione uma imagem ou uma cor para o produto.",
        type: "danger",
      });
      return;
    }
    if (!productName || !selectedCategory) {
      alertaPersonalizado({
        message: "Erro",
        description: "Informe o nome do produto e selecione uma categoria.",
        type: "danger",
      });
      return;
    }

    setIsUploading(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Usuário não autenticado");

      let imageUrl = selectedImage
        ? await uploadProductImage(selectedImage)
        : "";
      const precoNumerico = parseFloat(productPreco.replace(/\D/g, "")) / 100;
      const custoNumerico = parseFloat(productCusto.replace(/\D/g, "")) / 100;

      await addProduct(
        productName,
        productDescricao,
        precoNumerico,
        custoNumerico,
        selectedCategory,
        Timestamp.fromDate(new Date()),
        imageUrl,
        productCodigoBarra,
        selectedColor
      );

      alertaPersonalizado({
        message: "Sucesso",
        description: "Produto adicionado com sucesso!",
        type: "success",
      });

      // Limpar campos
      setProductName("");
      setProductDescricao("");
      setProductPreco("");
      setProductCusto("");
      setProductCodigoBarra("");
      setSelectedImage(null);
      setSelectedColor(null);
      setSelectedCategory(null);
    } catch (error) {
      console.error("Erro ao adicionar produto:", error);
      alertaPersonalizado({
        message: "Erro",
        description: "Falha ao adicionar o produto.",
        type: "danger",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-primaria">
      <Header
        title="Novo Produto"
        onGoBack={handleGoBack}
        onSave={handleAddProduct}
        showSaveIcon={true}
      />

      <ScrollView className="flex-1 bg-primaria" nestedScrollEnabled={true}>
        <FormFieldProduct
          title="Novo Produto"
          value={productName}
          handleChangeText={setProductName}
          otherStyles="px-4"
          placeholder="Nome do produto"
        />
        <FormFieldProduct
          title="Descrição"
          value={productDescricao}
          handleChangeText={setProductDescricao}
          otherStyles="px-4"
          placeholder="Descrição do produto"
          multiline={true}
        />
        <View className="w-full flex-row my-4">
          <FormFieldProduct
            title="Preço de Venda"
            value={productPreco}
            handleChangeText={(text) => {
              const rawValue = text.replace(/\D/g, "");
              setProductPreco(rawValue);
            }}
            placeholder="Preço de Venda"
            otherStyles="px-4 flex-1"
            monetario={true}
          />
          <FormFieldProduct
            title="Custo"
            value={productCusto}
            handleChangeText={(text) => {
              const rawValue = text.replace(/\D/g, "");
              setProductCusto(rawValue);
            }}
            placeholder="Custo (opcional)"
            otherStyles="px-4 flex-1"
            monetario={true}
          />
        </View>
        <View className="flex-1 h-16 my-2">
          <CategoryDropdown
            value={selectedCategory}
            onChange={handleCategoryChange}
          />
        </View>
        <FormFieldProduct
          title="Código de barras"
          value={productCodigoBarra}
          handleChangeText={setProductCodigoBarra}
          placeholder="Código de barras"
          otherStyles="px-4"
        />

        <View className="w-full h-36 mt-2 justify-center items-center flex-row px-4 gap-2 my-6">
          <View className="w-36 h-36 rounded-xl bg-secundaria-300 justify-center items-center">
            {selectedImage ? (
              <TouchableOpacity
                onPress={handleClearSelection}
                className="w-full h-full"
              >
                <Image
                  source={{ uri: selectedImage }}
                  className="w-full h-full rounded-xl"
                  contentFit="contain"
                />
                <View className="absolute top-2 right-2 bg-black/50 rounded-full px-2 py-1">
                  <Text className="text-white text-xs">X</Text>
                </View>
              </TouchableOpacity>
            ) : selectedColor ? (
              // Mostra a cor selecionada
              <TouchableOpacity
                onPress={handleClearSelection}
                className="w-full h-full"
              >
                <View
                  className="w-full h-full rounded-xl"
                  style={{ backgroundColor: selectedColor }} // Exibe a cor
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
              selectedColor={selectedColor}
              setSelectedColor={setSelectedColor}
              onColorSelect={handleColorSelect}
            />
          </View>
        </View>

        {isUploading ? (
          <ActivityIndicator size="large" color="#0000ff" />
        ) : (
          <CustomButton
            title="Adicionar Produto"
            handlePress={handleAddProduct}
            containerStyles="mb-2"
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default Criar;
