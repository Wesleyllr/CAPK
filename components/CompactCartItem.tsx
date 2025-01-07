import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Image } from "expo-image";

interface IQuantityControlProps {
  quantity: number;
  onDecrease: () => void;
  onIncrease: () => void;
}

const QuantityControl: React.FC<IQuantityControlProps> = ({
  quantity,
  onDecrease,
  onIncrease,
}) => (
  <View className="flex-row items-center gap-2">
    <TouchableOpacity
      onPress={onDecrease}
      className="w-6 h-6 bg-secundaria-200 rounded-full items-center justify-center"
    >
      <Text>-</Text>
    </TouchableOpacity>
    <Text className="text-sm font-medium">{quantity}</Text>
    <TouchableOpacity
      onPress={onIncrease}
      className="w-6 h-6 bg-secundaria-500 rounded-full items-center justify-center"
    >
      <Text className="text-white">+</Text>
    </TouchableOpacity>
  </View>
);

interface IProductImageProps {
  imageUrl?: string;
}

const ProductImage: React.FC<IProductImageProps> = ({ imageUrl }) => (
  imageUrl ? (
    <Image
      source={{ uri: imageUrl }}
      className="w-12 h-12 rounded-lg"
      contentFit="cover"
    />
  ) : (
    <View className="w-12 h-12 bg-secundaria-100 rounded-lg" />
  )
);

interface ICompactCartItemProps {
  item: ICartItem;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
}

export const CompactCartItem: React.FC<ICompactCartItemProps> = ({
  item,
  onUpdateQuantity,
  onRemove,
}) => {
  const formattedPrice = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(item.value * item.quantity);

  return (
    <View className="flex-row items-center bg-secundaria-50 p-3 rounded-lg mb-2 shadow-sm">
      <ProductImage imageUrl={item.imageUrl} />
      
      <View className="flex-1 ml-3">
        <View className="flex-row justify-between items-start">
          <Text className="font-medium text-secundaria-900 flex-1">{item.title}</Text>
          <Text className="font-medium text-quarta ml-2">{formattedPrice}</Text>
        </View>
        
        <View className="flex-row justify-between items-center mt-2">
          <QuantityControl
            quantity={item.quantity}
            onDecrease={() => onUpdateQuantity(item.id, Math.max(0, item.quantity - 1))}
            onIncrease={() => onUpdateQuantity(item.id, item.quantity + 1)}
          />
          <TouchableOpacity onPress={() => onRemove(item.id)}>
            <Text className="text-sexta text-sm">Remover</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};