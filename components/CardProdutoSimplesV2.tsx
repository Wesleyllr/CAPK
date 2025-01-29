import React, { useEffect, useState } from "react";
import {
  TouchableOpacity,
  View,
  Text,
  Platform,
  TextInput,
} from "react-native";

const CardProdutoSimplesV2 = ({
  price,
  title,
  onPress,
  quantity = 0,
  onDecrease = () => {},
  onIncrease = () => {},
  onQuantityChange = () => {},
}) => {
  const [localQuantity, setLocalQuantity] = useState(quantity);
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(quantity.toString());

  useEffect(() => {
    setLocalQuantity(quantity);
    setInputValue(quantity.toString());
  }, [quantity]);

  const formattedPrice = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(price);

  const handleSubmit = () => {
    const newValue = parseInt(inputValue);
    if (!isNaN(newValue) && newValue >= 0) {
      onQuantityChange(newValue);
    } else {
      setInputValue(quantity.toString());
    }
    setIsEditing(false);
  };

  const handleDecrease = () => {
    const newQuantity = Math.max(0, localQuantity - 1);
    setLocalQuantity(newQuantity);
    onQuantityChange(newQuantity);
    onDecrease();
  };

  const handleIncrease = () => {
    const newQuantity = localQuantity + 1;
    setLocalQuantity(newQuantity);
    onQuantityChange(newQuantity);
    onIncrease();
  };

  const webStyles = Platform.OS === "web" ? "p-2 h-8 text-sm" : "";

  return (
    <TouchableOpacity
      onPress={onPress}
      className={`flex-1 mb-2 ${webStyles} ${
        Platform.OS === "web" ? "mx-1" : "mx-4"
      }`}
    >
      <View
        className={`flex-row bg-white rounded-xl shadow-sm border border-gray-100 relative ${
          Platform.OS === "web" ? "p-2" : "px-3 py-2"
        }`}
      >
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
            {localQuantity > 0 && (
              <View className="flex-row items-center gap-2">
                <TouchableOpacity
                  onPress={handleDecrease}
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
                      {localQuantity}
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  onPress={handleIncrease}
                  className="w-6 h-6 bg-secundaria-500 rounded-full items-center justify-center"
                >
                  <Text className="text-white">+</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default CardProdutoSimplesV2;
