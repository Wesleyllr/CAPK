import React, { useEffect, useState } from "react";
import {
  TouchableOpacity,
  View,
  Text,
  Modal,
  TextInput,
  Button,
} from "react-native";
import { Image } from "expo-image";

const CardProduto1 = ({
  imageSource,
  backgroundColor,
  price,
  title,
  onPress,
  quantity = 0,
  isVariablePrice = false,
}) => {
  const [localQuantity, setLocalQuantity] = useState(quantity);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [variablePrice, setVariablePrice] = useState("");

  useEffect(() => {
    setLocalQuantity(quantity);
  }, [quantity]);

  const formattedPrice = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(price);

  const handlePress = () => {
    if (isVariablePrice && price === null) {
      setIsModalVisible(true);
    } else {
      onPress({ title, price, imageSource, backgroundColor, quantity });
    }
  };

  const handleConfirm = () => {
    const finalPrice = parseFloat(variablePrice);
    if (!isNaN(finalPrice)) {
      onPress(
        { title, price: finalPrice, imageSource, backgroundColor, quantity },
        finalPrice
      );
      setIsModalVisible(false);
      setVariablePrice("");
    }
  };

  return (
    <TouchableOpacity onPress={handlePress}>
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
      <Modal visible={isModalVisible} transparent={true} animationType="slide">
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className="bg-white p-4 rounded-lg">
            <Text className="text-lg mb-2">Defina o preço</Text>
            <TextInput
              value={variablePrice}
              onChangeText={setVariablePrice}
              keyboardType="numeric"
              placeholder="Preço"
              className="border p-2 mb-4"
            />
            <Button title="Confirmar" onPress={handleConfirm} />
            <Button title="Cancelar" onPress={() => setIsModalVisible(false)} />
          </View>
        </View>
      </Modal>
    </TouchableOpacity>
  );
};

export default CardProduto1;
