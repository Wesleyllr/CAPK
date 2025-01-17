import React, { useState, useEffect } from "react";
import { Alert, View, Text, TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { db, auth } from "@/firebaseConfig";
import FormFieldProduct from "@/components/FormFieldProduct";
import CategoryDropdownWeb from "@/components/CategoryDropdownWeb";
import { pickImagem } from "@/scripts/selecionarImagem";
import { uploadProductImage } from "@/scripts/uploadImage";
import ColorSelector from "@/components/ColorSelector";
import eventBus from "@/utils/eventBus";

const EditarProdutoWeb = () => {
  const router = useRouter();
  const { productId } = useLocalSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
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
          Alert.alert("Erro", "Usuário ou produto não encontrado.");
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
          const productState = {
            title: data.title || "",
            description: data.description || "",
            value: (data.value * 100).toString() || "",
            custo: (data.custo * 100).toString() || "",
            category: data.category || "",
            imageUrl: data.imageUrl || "",
            codeBar: data.codeBar || "",
            backgroundColor: data.backgroundColor || null,
          };
          setProductData(productState);
          setInitialProductData(productState);
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
      Alert.alert("Sucesso", "Produto excluído com sucesso.");
      eventBus.emit("produtoAtualizado");
      router.back();
    } catch (error) {
      Alert.alert("Erro", "Falha ao excluir produto.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveProduct = async () => {
    try {
      setIsSaving(true);
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error("Usuário não autenticado");

      const hasChanges =
        JSON.stringify(productData) !== JSON.stringify(initialProductData);

      if (!hasChanges) {
        Alert.alert(
          "Sem modificações",
          "Nenhuma alteração foi feita no produto."
        );
        return;
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
      });

      Alert.alert("Sucesso", "Produto atualizado com sucesso.");
      eventBus.emit("produtoAtualizado");
      router.back();
    } catch (error) {
      Alert.alert("Erro", "Falha ao atualizar produto.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: "#f8f8f8",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text>Carregando...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8f8f8" }}>
      <View style={{ flex: 1, padding: 16 }}>
        <View
          style={{
            backgroundColor: "white",
            borderRadius: 8,
            shadowColor: "black",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 10,
            padding: 16,
            position: "relative",
            zIndex: 1,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              gap: 16,
              position: "relative",
              zIndex: 2,
            }}
          >
            {/* Left Column - Image and Color Selection */}
            <View style={{ flex: 1, position: "relative", zIndex: 1 }}>
              <View style={{ marginBottom: 24 }}>
                <Text
                  style={{ fontSize: 18, fontWeight: "bold", color: "#333" }}
                >
                  Imagem do Produto
                </Text>
                <View
                  style={{
                    width: "100%",
                    height: 200,
                    backgroundColor: "#f3f3f3",
                    borderRadius: 8,
                    justifyContent: "center",
                    alignItems: "center",
                    marginTop: 12,
                  }}
                >
                  {productData.imageUrl ? (
                    <View
                      style={{
                        position: "relative",
                        width: "100%",
                        height: "100%",
                      }}
                    >
                      <Image
                        source={{ uri: productData.imageUrl }}
                        style={{
                          width: "100%",
                          height: "100%",
                          borderRadius: 8,
                        }}
                        contentFit="contain"
                      />
                      <TouchableOpacity
                        onPress={() =>
                          setProductData((prev) => ({
                            ...prev,
                            imageUrl: "",
                            backgroundColor: null,
                          }))
                        }
                        style={{
                          position: "absolute",
                          top: 8,
                          right: 8,
                          backgroundColor: "rgba(0,0,0,0.5)",
                          borderRadius: 20,
                          padding: 8,
                        }}
                      >
                        <Text style={{ color: "white", fontSize: 12 }}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ) : productData.backgroundColor ? (
                    <View
                      style={{
                        width: "100%",
                        height: "100%",
                        borderRadius: 8,
                        backgroundColor: productData.backgroundColor,
                      }}
                    />
                  ) : (
                    <TouchableOpacity
                      onPress={handleSelectImage}
                      style={{
                        width: "100%",
                        height: "100%",
                        borderRadius: 8,
                        justifyContent: "center",
                        alignItems: "center",
                        borderColor: "#ddd",
                        borderWidth: 2,
                        borderStyle: "dashed",
                      }}
                    >
                      <Text
                        style={{
                          color: "#888",
                          textAlign: "center",
                          fontSize: 14,
                        }}
                      >
                        Clique para adicionar imagem
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              <View
                style={{
                  backgroundColor: "#f0f0f0",
                  borderRadius: 8,
                  padding: 12,
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: "#333",
                    marginBottom: 8,
                  }}
                >
                  Ou selecione uma cor
                </Text>
                <ColorSelector
                  selectedColor={productData.backgroundColor}
                  setSelectedColor={(color) =>
                    setProductData((prev) => ({
                      ...prev,
                      backgroundColor: color,
                    }))
                  }
                  onColorSelect={handleColorSelect}
                />
              </View>
            </View>

            {/* Right Column - Product Details */}
            <View style={{ flex: 2, position: "relative", zIndex: 9999 }}>
              <View style={{ marginBottom: 24 }}>
                <FormFieldProduct
                  title="Nome do Produto"
                  value={productData.title}
                  handleChangeText={(text) =>
                    setProductData((prev) => ({ ...prev, title: text }))
                  }
                  placeholder="Nome do produto"
                />
              </View>

              <View style={{ marginBottom: 24 }}>
                <FormFieldProduct
                  title="Descrição"
                  value={productData.description}
                  handleChangeText={(text) =>
                    setProductData((prev) => ({ ...prev, description: text }))
                  }
                  placeholder="Descrição do produto"
                  multiline={true}
                />
              </View>

              <View style={{ flexDirection: "row", gap: 16, marginBottom: 24 }}>
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

              <View style={{ position: "relative", zIndex: 9999 }}>
                <CategoryDropdownWeb
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

          {/* Action Buttons */}
          <View style={{ flexDirection: "row", gap: 16, marginTop: 32 }}>
            <TouchableOpacity
              onPress={handleDeleteProduct}
              disabled={isDeleting}
              style={{
                flex: 1,
                paddingVertical: 16,
                backgroundColor: "#dc3545",
                borderRadius: 8,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: "white", fontWeight: "bold" }}>
                {isDeleting ? "Excluindo..." : "Excluir Produto"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSaveProduct}
              disabled={isSaving}
              style={{
                flex: 1,
                paddingVertical: 16,
                backgroundColor: "#4caf50",
                borderRadius: 8,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: "white", fontWeight: "bold" }}>
                {isSaving ? "Salvando..." : "Salvar Alterações"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default EditarProdutoWeb;
