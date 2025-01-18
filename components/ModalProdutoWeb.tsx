import React, { useEffect, useState } from "react";
import { View, Text, Modal, ScrollView, Platform } from "react-native";
import { Image } from "react-native";
import { getUserCategories } from "@/userService";

interface ModalProdutoWebProps {
  isVisible: boolean;
  produto: {
    id: string;
    title: string;
    description: string;
    value: number;
    custo: number;
    category: string;
    imageUrl: string;
    backgroundColor: string;
  } | null;
  onClose: () => void;
  onEdit: () => void;
}

const ModalProdutoWeb: React.FC<ModalProdutoWebProps> = ({
  isVisible,
  produto,
  onClose,
  onEdit,
}) => {
  const [categoryName, setCategoryName] = useState<string>("");

  useEffect(() => {
    const fetchCategoryName = async () => {
      if (produto?.category) {
        try {
          const categories = await getUserCategories();
          const category = categories.find(
            (cat) => cat.id === produto.category
          );
          setCategoryName(category?.name || produto.category);
        } catch (error) {
          console.error("Erro ao buscar categoria:", error);
          setCategoryName(produto.category);
        }
      }
    };

    fetchCategoryName();
  }, [produto?.category]);

  if (!produto) return null;

  const formattedPrice = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(produto.value);

  const formattedCusto = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(produto.custo || 0);

  const handleClose = () => {
    setCategoryName("");
    onClose();
  };

  const ImageContainer = () => {
    if (produto.imageUrl) {
      return (
        <View
          style={{
            height: 268,
            width: 268,
            backgroundColor: produto.backgroundColor || "#e5e5e5",
          }}
        >
          <Image
            source={{ uri: produto.imageUrl }}
            style={{
              resizeMode: "cover",
              height: "100%",
              width: "100%",
            }}
          />
        </View>
      );
    }

    return (
      <View
        style={{
          height: 268,
          width: 268,
          backgroundColor: produto.backgroundColor || "#e5e5e5",
        }}
      />
    );
  };

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          justifyContent: "center",
          alignItems: "center",
          padding: 16,
        }}
      >
        <View
          style={{
            backgroundColor: "white",
            borderRadius: 16,
            overflow: "hidden",
            padding: 16,
            width: 800,
            maxHeight: "90%", // Limita a altura para 90% da tela
          }}
        >
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {/* Imagem/Cor Container à esquerda */}
            <View style={{ width: 268, height: "100%" }}>
              <ImageContainer />
            </View>

            {/* Informações do Produto à direita */}
            <View style={{ flex: 1, paddingLeft: 16 }}>
              <Text
                style={{
                  fontSize: 24,
                  fontWeight: "bold",
                  color: "#4A4A4A",
                  marginBottom: 16,
                }}
              >
                {produto.title}
              </Text>

              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginBottom: 16,
                }}
              >
                <Text
                  style={{ fontSize: 20, fontWeight: "bold", color: "#4CAF50" }}
                >
                  {formattedPrice}
                </Text>
                <Text style={{ fontSize: 14, color: "#9E9E9E" }}>
                  Custo: {formattedCusto}
                </Text>
              </View>

              {produto.category && (
                <View
                  style={{
                    backgroundColor: "#F5F5F5",
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 50,
                    marginBottom: 16,
                  }}
                >
                  <Text style={{ fontSize: 14, color: "#757575" }}>
                    {categoryName}
                  </Text>
                </View>
              )}

              {/* Descrição rolável */}
              <ScrollView style={{ flex: 1, marginBottom: 16 }}>
                {produto.description && (
                  <Text
                    style={{
                      color: "#616161",
                      fontSize: 16,
                      fontWeight: "300",
                    }}
                  >
                    {produto.description}
                  </Text>
                )}
              </ScrollView>

              <View style={{ flexDirection: "row", gap: 16, marginTop: 16 }}>
                <TouchableOpacity
                  onPress={onEdit}
                  style={{
                    flex: 1,
                    backgroundColor: "#FF4081",
                    paddingVertical: 16,
                    borderRadius: 8,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{ color: "white", fontWeight: "bold", fontSize: 18 }}
                  >
                    Editar
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleClose}
                  style={{
                    flex: 1,
                    backgroundColor: "#B0BEC5",
                    paddingVertical: 16,
                    borderRadius: 8,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      color: "#455A64",
                      fontWeight: "bold",
                      fontSize: 18,
                    }}
                  >
                    Cancelar
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ModalProdutoWeb;
