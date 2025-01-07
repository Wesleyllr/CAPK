import { TouchableOpacity, Text } from "react-native";
import React from "react";
import { Platform } from "react-native";
interface CustomButtonProps {
  title: string;
  handlePress: () => void;
  containerStyles: string;
  textStyles?: string;
  isLoading?: boolean;
  valordoproduto: string;
}

const CustomButton: React.FC<CustomButtonProps> = ({
  title,
  handlePress,
  containerStyles,
  textStyles,
  isLoading,
  valordoproduto,
}) => {
  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      className={`bg-secundaria-600 rounded-xl min-h-[44px] justify-center items-center ${containerStyles} ${
        isLoading ? "opacity-50" : ""
      } ${Platform.OS === "web" ? "max-w-[300px]" : ""}`}
      disabled={isLoading}
    >
      <Text className={`text-primaria font-psemibold text-lg ${textStyles}`}>
        {title}
      </Text>

      {/* Exibe o valor apenas se não for uma string vazia */}
      {valordoproduto ? (
        <Text className={`text-primaria font-psemibold text-lg ${textStyles}`}>
          {valordoproduto}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
};

export default CustomButton;
