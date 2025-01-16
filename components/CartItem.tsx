import React, { useState } from "react";
import { View, Text, TouchableOpacity, TextInput } from "react-native";
import { Image } from "expo-image";

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

// Componente CartItem
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
          <QuantityControl
            quantity={item.quantity}
            onDecrease={() =>
              onUpdateQuantity(item.id, Math.max(0, item.quantity - 1))
            }
            onIncrease={() => onUpdateQuantity(item.id, item.quantity + 1)}
            onQuantityChange={(value) => onUpdateQuantity(item.id, value)}
          />

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
