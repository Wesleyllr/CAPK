import React from "react";
import { View, TextInput, TouchableOpacity, Text } from "react-native";

const VariablePriceModal = ({
  visible,
  onClose,
  onConfirm,
  value,
  onChange,
  productTitle,
}) => {
  if (!visible) return null;

  return (
    <View className="absolute inset-0 bg-black/50 flex items-center justify-center">
      <View className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
        <Text className="text-xl font-bold text-gray-800 mb-2">
          Definir preço para
        </Text>
        <Text className="text-lg text-gray-600 mb-4">{productTitle}</Text>

        <View className="mb-6">
          <Text className="text-sm text-gray-600 mb-2">Digite o valor:</Text>
          <TextInput
            value={value}
            onChangeText={onChange}
            keyboardType="numeric"
            placeholder="0,00"
            className="w-full h-12 px-4 border border-gray-300 rounded-lg text-lg"
          />
        </View>

        <View className="flex-row gap-3">
          <TouchableOpacity
            onPress={onClose}
            className="flex-1 h-12 bg-gray-200 rounded-lg items-center justify-center"
          >
            <Text className="text-gray-800 font-medium">Cancelar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onConfirm}
            className="flex-1 h-12 bg-terceira-500 rounded-lg items-center justify-center"
          >
            <Text className="text-white font-medium">Confirmar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default VariablePriceModal;
