import React from "react";
import { TouchableOpacity, View, Text } from "react-native";
import { Image } from "expo-image";

const CardProduto1 = ({
  imageSource,
  backgroundColor,
  price,
  title,
  onPress,
}) => {
  const formattedPrice = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(price);

  return (
    <TouchableOpacity onPress={onPress}>
      <View className="w-32 h-48 bg-white">
        {imageSource?.uri ? (
          <Image
            className="w-32 h-32 rounded-2xl"
            source={imageSource}
            cachePolicy="disk"
          />
        ) : (
          <View
            className="w-32 h-32 rounded-2xl"
            style={{ backgroundColor: backgroundColor || "#e5e5e5" }}
          />
        )}
        <Text className="font-extrabold text-lg text-green-600">
          {formattedPrice}
        </Text>
        <Text className="flex-1 text-base leading-[14px]" numberOfLines={2}>
          {title}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default CardProduto1;
