import React from "react";
import { TouchableOpacity, View, Text, Image } from "react-native";

const CardProduto2 = ({ imageSource, price, title, onPress }) => {
  return (
    <TouchableOpacity onPress={onPress}>
      <View className="w-32 h-48 bg-white">
        <View className="w-32 h-36 rounded-2xl items-end justify-end bg-black">
          <Image
            className="w-32 h-36 rounded-2xl"
            source={imageSource}
            resizeMode="cover"
          />
          <View className="rounded-md rounded-br-2xl px-1 absolute bg-secundaria-100 opacity-60">
            <Text className="font-extrabold text-base text-right opacity-0">
              {price}
            </Text>
          </View>
          <Text className="font-extrabold absolute rounded-md px-1 text-base text-secundaria-950 text-right">
            {price}
          </Text>
        </View>
        <Text
          className="flex-1 text-base font-bold leading-[16px] mt-2"
          numberOfLines={2}
        >
          {title}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default CardProduto2;
