import React, { useEffect, useState } from "react";
import { TouchableOpacity, View, Text, Platform } from "react-native";
import { Image } from "expo-image";

const CardProdutoSimples = ({
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

  // Define estilos para a versão web mais reduzida
  const webStyles = Platform.OS === "web" ? "p-2 h-16 text-sm" : "";

  return (
    <TouchableOpacity
      onPress={onPress}
      className={`flex-1 mb-2 mx-1 ${webStyles}`}
    >
      <View
        className={`flex-row bg-white rounded-xl shadow-sm border border-gray-100 relative ${
          Platform.OS === "web" ? "p-2" : "p-3"
        }`}
      >
        {imageSource?.uri ? (
          <Image
            className={`rounded-xl ${
              Platform.OS === "web" ? "w-16 h-16" : "w-20 h-20"
            }`}
            source={imageSource}
            cachePolicy="disk"
          />
        ) : (
          <View
            className={`rounded-xl ${
              Platform.OS === "web" ? "w-16 h-16" : "w-20 h-20"
            }`}
            style={{ backgroundColor: backgroundColor || "#e5e5e5" }}
          />
        )}
        {localQuantity > 0 && (
          <View
            className={`absolute top-2 right-2 bg-red-500 items-center justify-center ${
              Platform.OS === "web" ? "w-5 h-5" : "w-7 h-7"
            } rounded-full`}
          >
            <Text
              className={`text-white font-bold ${
                Platform.OS === "web" ? "text-xs" : "text-base"
              }`}
            >
              {localQuantity}
            </Text>
          </View>
        )}
        <View
          className={`flex-1 justify-between ${
            Platform.OS === "web" ? "ml-2 py-0" : "ml-4 py-1"
          }`}
        >
          <View>
            <Text
              className={`font-semibold text-gray-800 ${
                Platform.OS === "web" ? "text-sm" : "text-base"
              }`}
              numberOfLines={2}
            >
              {title}
            </Text>
          </View>
          <View className="flex-row items-center justify-between">
            <Text
              className={`font-bold ${
                Platform.OS === "web" ? "text-sm" : "text-lg"
              } text-green-600`}
            >
              {formattedPrice}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default CardProdutoSimples;
