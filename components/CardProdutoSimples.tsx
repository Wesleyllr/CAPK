import React from "react";
import { TouchableOpacity, View, Text } from "react-native";
import { Image } from "expo-image";

const CardProdutoSimples = ({
  imageSource,
  backgroundColor,
  price,
  title,
  onPress,
  quantity = 0,
}) => {
  const formattedPrice = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(price);

  return (
    <TouchableOpacity onPress={onPress} className="w-full mb-2">
      <View className="flex-row bg-white p-3 rounded-xl shadow-sm border border-gray-100 relative">
        {imageSource?.uri ? (
          <Image
            className="w-20 h-20 rounded-xl"
            source={imageSource}
            cachePolicy="disk"
          />
        ) : (
          <View
            className="w-20 h-20 rounded-xl"
            style={{ backgroundColor: backgroundColor || "#e5e5e5" }}
          />
        )}
        {quantity > 0 && (
          <View className="absolute top-2 right-2 bg-red-500 w-7 h-7 rounded-full items-center justify-center">
            <Text className="text-white font-bold">{quantity}</Text>
          </View>
        )}
        <View className="flex-1 ml-4 justify-between py-1">
          <View>
            <Text
              className="text-base font-semibold text-gray-800"
              numberOfLines={2}
            >
              {title}
            </Text>
          </View>
          <View className="flex-row items-center justify-between">
            <Text className="font-bold text-lg text-green-600">
              {formattedPrice}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default CardProdutoSimples;
