import React, { useEffect, useState } from "react";
import { TouchableOpacity, View, Text } from "react-native";
import { Image } from "expo-image";

const CardProduto1 = ({
  imageSource,
  backgroundColor,
  price,
  title,
  onPress,
  quantity = 0,
}) => {
  const [localQuantity, setLocalQuantity] = useState(quantity);

  useEffect(() => {
    setLocalQuantity(quantity);
  }, [quantity]);

  const formattedPrice = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(price);

  return (
    <TouchableOpacity onPress={onPress}>
      <View className="w-32 h-48 bg-white relative">
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
        {localQuantity > 0 && (
          <View className="absolute top-2 right-2 bg-red-500 w-7 h-7 rounded-full items-center justify-center">
            <Text className="text-white font-bold">{localQuantity}</Text>
          </View>
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
