import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Alert,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { db, auth } from "@/firebaseConfig";
import FormFieldProduct from "@/components/FormFieldProduct";
import CategoryDropdown from "@/components/CategoryDropdown";
import Header from "@/components/CustomHeader";
import ColorSelector from "@/components/ColorSelector";
import { pickImagem } from "@/scripts/selecionarImagem";
import { uploadProductImage } from "@/scripts/uploadImage";
import eventBus from "@/utils/eventBus";
import { alertaPersonalizado } from "@/utils/alertaPersonalizado";

const EditarProduto = () => {
  const router = useRouter();
  const { productId } = useLocalSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isVariablePrice, setIsVariablePrice] = useState(false);
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

  const [initialProductData, setInitialProductData] = useState({
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
          alertaPersonalizado({
            message: "Erro",
            description: "Usuário ou produto não encontrado.",
            type: "danger",
          });
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

          // Armazenando os dados iniciais para comparação
          setInitialProductData({
            title: data.title || "",
            description: data.description || "",
            value: (data.value * 100).toString() || "",
            custo: (data.custo * 100).toString() || "",
            category: data.category || "",
            imageUrl: data.imageUrl || "",
            codeBar: data.codeBar || "",
            backgroundColor: data.backgroundColor || null,
          });
          setIsVariablePrice(data.isVariablePrice || false);
        }
      } catch (error) {
        alertaPersonalizado({
          message: "Erro!",
          description: "Falha ao carregar dados do produto.",
          type: "warning",
        });
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

  const handleDeleteProduct = () => {
    Alert.alert(
      "Excluir Produto",
      "Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Excluir", style: "destructive", onPress: confirmDelete },
      ]
    );
  };

  const confirmDelete = async () => {
    try {
      setIsDeleting(true);
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error("Usuário não autenticado");

      const productRef = doc(
        db,
        "users",
        userId,
        "products",
        productId.toString()
      );
      await deleteDoc(productRef);
      alertaPersonalizado({
        message: "Sucesso!",
        description: "Produto excluído com sucesso.",
        type: "success",
      });
      eventBus.emit("produtoAtualizado");
      router.back();
    } catch (error) {
      alertaPersonalizado({
        message: "Erro!",
        description: "Falha ao excluir produto.",
        type: "warning",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleVariablePriceToggle = (value) => {
    setIsVariablePrice(value);
    if (value) {
      setProductData((prev) => ({ ...prev, value: "" }));
    }
  };

  const handleSaveProduct = async () => {
    try {
      setIsSaving(true);
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error("Usuário não autenticado");

      // Verificação de modificações
      const hasChanges =
        productData.title !== initialProductData.title ||
        productData.description !== initialProductData.description ||
        productData.value !== initialProductData.value ||
        productData.custo !== initialProductData.custo ||
        productData.category !== initialProductData.category ||
        productData.imageUrl !== initialProductData.imageUrl ||
        productData.codeBar !== initialProductData.codeBar ||
        productData.backgroundColor !== initialProductData.backgroundColor ||
        isVariablePrice !== initialProductData.isVariablePrice;

      if (!hasChanges) {
        alertaPersonalizado({
          message: "Sem modificações",
          description: "Nenhuma alteração foi feita no produto.",
          type: "info",
        });

        return; // Não realiza a atualização
      }

      let finalImageUrl = productData.imageUrl;
      if (productData.imageUrl && !productData.imageUrl.startsWith("http")) {
        finalImageUrl = await uploadProductImage(productData.imageUrl);
      }

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
        isVariablePrice,
      });

      alertaPersonalizado({
        message: "Sucesso!",
        description: "Produto atualizado com sucesso.",
        type: "success",
      });

      eventBus.emit("produtoAtualizado");
      router.back();
    } catch (error) {
      alertaPersonalizado({
        message: "Erro!",
        description: "Falha ao atualizar produto.",
        type: "warning",
      });
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

            <View className="flex-row items-center mb-4">
              <Text className="text-lg mr-2">Preço Variável</Text>
              <Switch
                value={isVariablePrice}
                onValueChange={handleVariablePriceToggle}
              />
            </View>

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
                  disabled={isVariablePrice}
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

        {/* Botões de Excluir e Salvar */}
        <View className="flex-1 flex-row justify-between mx-4 mt-4 mb-8 gap-4">
          <TouchableOpacity
            onPress={handleDeleteProduct}
            className="flex-1 p-4 bg-red-500 rounded-lg"
            disabled={isDeleting}
          >
            {isDeleting ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-center font-bold">
                Excluir Produto
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSaveProduct}
            className="flex-1 p-4 bg-green-500 rounded-lg"
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-center font-bold">
                Salvar Produto
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {isSaving && <ActivityIndicator size="large" className="my-4" />}
      </ScrollView>
    </SafeAreaView>
  );
};

export default EditarProduto;
