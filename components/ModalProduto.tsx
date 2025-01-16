import React, { useEffect, useState } from "react";
import { View, Text, Modal, TouchableOpacity, Platform } from "react-native";
import { Image } from "expo-image";
import TouchableWithSound from "./TouchableWithSound";
import { getUserCategories } from "@/userService"; // Ajuste o caminho conforme necessário

interface ModalProdutoProps {
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

const ModalProduto: React.FC<ModalProdutoProps> = ({
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
          setCategoryName(produto.category); // Fallback para o valor original
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
    setCategoryName(""); // Limpa o nome da categoria
    onClose(); // Chama a função original de fechar
  };

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View className="flex-1 bg-black/50 justify-center items-center p-4">
        <View className="bg-white rounded-2xl w-full max-w-lg overflow-hidden">
          {/* Imagem do Produto */}
          <View className="w-full aspect-square">
            {produto.imageUrl ? (
              <Image
                source={{ uri: produto.imageUrl }}
                className="w-full h-full"
                contentFit="cover"
              />
            ) : (
              <View
                className="w-full h-full"
                style={{
                  backgroundColor: produto.backgroundColor || "#e5e5e5",
                }}
              />
            )}
          </View>

          {/* Informações do Produto */}
          <View className="p-6">
            <Text className="text-2xl font-bold text-gray-800 mb-2">
              {produto.title}
            </Text>

            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-bold text-green-600">
                {formattedPrice}
              </Text>
              <Text className="text-sm text-gray-500">
                Custo: {formattedCusto}
              </Text>
            </View>

            {produto.category && (
              <View className="bg-gray-100 self-start px-3 py-1 rounded-full mb-4">
                <Text className="text-sm text-gray-600">{categoryName}</Text>
              </View>
            )}
            {produto.description && (
              <Text className="text-gray-600 mb-6">{produto.description}</Text>
            )}

            {/* Botões */}
            <View className="flex-row gap-4">
              <TouchableWithSound
                onPress={onEdit}
                className="flex-1 bg-terceira-500 py-3 rounded-lg"
              >
                <Text className="text-white text-center font-bold">Editar</Text>
              </TouchableWithSound>

              <TouchableWithSound
                onPress={handleClose}
                className="flex-1 bg-gray-200 py-3 rounded-lg"
                soundType="click2"
              >
                <Text className="text-gray-700 text-center font-bold">
                  Cancelar
                </Text>
              </TouchableWithSound>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ModalProduto;
