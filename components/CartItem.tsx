import React from "react";
import { View, Text, TouchableOpacity, TextInput } from "react-native";
import { Image } from "expo-image";

interface CartItemProps {
  item: ICartItem;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
  onUpdateObservations: (id: string, observations: string) => void;
}

export const CartItem: React.FC<CartItemProps> = ({
  item,
  onUpdateQuantity,
  onRemove,
  onUpdateObservations,
}) => {
  return (
    <View className="flex-row bg-secundaria-50 p-4 rounded-lg mb-2 shadow-sm">
      {item.imageUrl ? (
        <Image
          source={{ uri: item.imageUrl }}
          className="w-20 h-20 rounded-lg"
          contentFit="cover"
        />
      ) : (
        <View className="w-20 h-20 bg-secundaria-100 rounded-lg" />
      )}

      <View className="flex-1 ml-4">
        <Text className="text-lg font-semibold text-secundaria-900">
          {item.title}
        </Text>
        <Text className="text-quarta font-bold">
          {new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
          }).format(item.value)}
        </Text>

        <View className="flex-row items-center mt-2">
          <TouchableOpacity
            onPress={() =>
              onUpdateQuantity(item.id, Math.max(0, item.quantity - 1))
            }
            className="w-8 h-8 bg-secundaria-200 rounded-full items-center justify-center"
          >
            <Text className="text-lg text-secundaria-700">-</Text>
          </TouchableOpacity>

          <Text className="mx-4 text-lg font-medium text-secundaria-900">
            {item.quantity}
          </Text>

          <TouchableOpacity
            onPress={() => onUpdateQuantity(item.id, item.quantity + 1)}
            className="w-8 h-8 bg-secundaria-500 rounded-full items-center justify-center"
          >
            <Text className="text-lg text-primaria">+</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => onRemove(item.id)}
            className="ml-auto"
          >
            <Text className="text-sexta font-medium">Remover</Text>
          </TouchableOpacity>
        </View>

        <TextInput
          className="mt-2 p-2 bg-secundaria-100 rounded font-pregular text-secundaria-900"
          placeholder="Observações..."
          value={item.observations}
          onChangeText={(text) => onUpdateObservations(item.id, text)}
          multiline
        />
      </View>
    </View>
  );
};
