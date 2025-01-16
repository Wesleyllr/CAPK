import React, { useState } from "react";
import { Alert, View, Text, TouchableOpacity, TextInput } from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { uploadProductImage } from "@/scripts/uploadImage";
import { addProduct } from "@/scripts/productService";
import { pickImagem } from "@/scripts/selecionarImagem";
import FormFieldProduct from "@/components/FormFieldProduct";
import Header from "@/components/CustomHeader";
import { useRouter } from "expo-router";
import ColorSelector from "@/components/ColorSelector";
import { db, auth } from "@/firebaseConfig";
import { Timestamp } from "firebase/firestore";
import eventBus from "@/utils/eventBus";
import CategoryDropdownWeb from "@/components/CategoryDropdownWeb";

const CriarWeb = () => {
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
      Alert.alert("Erro", "Informe o nome do produto e selecione uma categoria.");
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
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8f8f8' }}>
      <Header
        title="Novo Produto"
        onGoBack={() => router.back()}
        showSaveIcon={false}
      />

      <View style={{ flex: 1, padding: 16 }}>
        <View style={{ backgroundColor: 'white', borderRadius: 8, shadowColor: 'black', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, padding: 16, position: 'relative',zIndex: 1 }}>
          <View style={{ flexDirection: 'row', gap: 16, position: 'relative', zIndex: 2 }}>
            {/* Left Column - Image and Color Selection */}
            <View style={{ flex: 1, position: 'relative', zIndex: 1  }}>
              <View style={{ marginBottom: 24 }}>
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#333' }}>
                  Imagem do Produto
                </Text>
                <View style={{ width: '100%', height: 200, backgroundColor: '#f3f3f3', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginTop: 12 }}>
                  {productData.imageUrl ? (
                    <View style={{ position: 'relative', width: '100%', height: '100%' }}>
                      <Image
                        source={{ uri: productData.imageUrl }}
                        style={{ width: '100%', height: '100%', borderRadius: 8 }}
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
                          position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20, padding: 8
                        }}
                      >
                        <Text style={{ color: 'white', fontSize: 12 }}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ) : productData.backgroundColor ? (
                    <View style={{ width: '100%', height: '100%', borderRadius: 8, backgroundColor: productData.backgroundColor }} />
                  ) : (
                    <TouchableOpacity
                      onPress={handleSelectImage}
                      style={{
                        width: '100%', height: '100%', borderRadius: 8, justifyContent: 'center', alignItems: 'center', borderColor: '#ddd', borderWidth: 2, borderStyle: 'dashed'
                      }}
                    >
                      <Text style={{ color: '#888', textAlign: 'center', fontSize: 14 }}>
                        Clique para adicionar imagem
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              <View style={{ backgroundColor: '#f0f0f0', borderRadius: 8, padding: 12 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 }}>
                  Ou selecione uma cor
                </Text>
                <ColorSelector
                  selectedColor={productData.backgroundColor}
                  setSelectedColor={(color) => setProductData((prev) => ({ ...prev, backgroundColor: color }))}
                  onColorSelect={handleColorSelect}
                />
              </View>
            </View>

            {/* Right Column - Product Details */}
            <View style={{ flex: 2, position: 'relative', zIndex: 9999 }}>
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

              <View style={{ flexDirection: 'row', gap: 16, marginBottom: 24 }}>
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
              <View style={{ position: 'relative', zIndex: 9999 }}>
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

          {/* Save Button - Full Width */}
          <TouchableOpacity
            onPress={handleAddProduct}
            disabled={isUploading}
            style={{
              marginTop: 32, paddingVertical: 16, backgroundColor: '#4caf50', borderRadius: 8, alignItems: 'center', justifyContent: 'center'
            }}
          >
            {isUploading ? (
              <Text style={{ color: 'white', fontWeight: 'bold' }}>
                Processando...
              </Text>
            ) : (
              <Text style={{ color: 'white', fontWeight: 'bold' }}>
                Adicionar Produto
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default CriarWeb;
