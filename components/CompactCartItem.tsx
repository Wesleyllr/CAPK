// CompactCartItem.tsx
import React, { useState } from "react";
import { View, Text, TouchableOpacity, TextInput } from "react-native";
import { Image } from "expo-image";

// Componente para controlar a quantidade
interface IQuantityControlProps {
  quantity: number;
  onDecrease: () => void;
  onIncrease: () => void;
  onQuantityChange: (value: number) => void;
}

const QuantityControl: React.FC<IQuantityControlProps> = ({
  quantity,
  onDecrease,
  onIncrease,
  onQuantityChange,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(quantity.toString());

  const handleSubmit = () => {
    const newValue = parseInt(inputValue);
    if (!isNaN(newValue) && newValue >= 0) {
      onQuantityChange(newValue); // Atualiza a quantidade
    } else {
      setInputValue(quantity.toString()); // Restaura o valor
    }
    setIsEditing(false); // Finaliza a edição
  };

  return (
    <View className="flex-row items-center gap-2">
      <TouchableOpacity
        onPress={onDecrease}
        className="w-6 h-6 bg-secundaria-200 rounded-full items-center justify-center"
      >
        <Text>-</Text>
      </TouchableOpacity>

      {isEditing ? (
        <TextInput
          className="w-12 text-center bg-secundaria-100 rounded px-1"
          keyboardType="numeric"
          value={inputValue}
          onChangeText={setInputValue}
          onBlur={handleSubmit}
          onSubmitEditing={handleSubmit}
          autoFocus
        />
      ) : (
        <TouchableOpacity onPress={() => setIsEditing(true)}>
          <Text className="text-sm font-medium min-w-8 text-center">
            {quantity}
          </Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        onPress={onIncrease}
        className="w-6 h-6 bg-secundaria-500 rounded-full items-center justify-center"
      >
        <Text className="text-white">+</Text>
      </TouchableOpacity>
    </View>
  );
};

// Componente para a imagem do produto
interface IProductImageProps {
  imageUrl?: string;
}

const ProductImage: React.FC<IProductImageProps> = ({ imageUrl }) =>
  imageUrl ? (
    <Image
      source={{ uri: imageUrl }}
      className="w-12 h-12 rounded-lg"
      contentFit="cover"
    />
  ) : (
    <View className="w-12 h-12 bg-secundaria-100 rounded-lg" />
  );

// Componente de item no carrinho
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
          <Text className="font-medium text-secundaria-900 flex-1">
            {item.title}
          </Text>
          <Text className="font-medium text-quarta ml-2">{formattedPrice}</Text>
        </View>

        <View className="flex-row justify-between items-center mt-2">
          <QuantityControl
            quantity={item.quantity}
            onDecrease={
              () => onUpdateQuantity(item.id, Math.max(0, item.quantity - 1)) // Decrementa a quantidade
            }
            onIncrease={() => onUpdateQuantity(item.id, item.quantity + 1)} // Incrementa a quantidade
            onQuantityChange={(value) => onUpdateQuantity(item.id, value)} // Altera a quantidade diretamente
          />
          <TouchableOpacity onPress={() => onRemove(item.id)}>
            <Text className="text-sexta text-sm">Remover</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};
