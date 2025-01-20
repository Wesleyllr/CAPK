import React from "react";
import { TouchableOpacity, Image, Text } from "react-native";

interface BotaoComIconeProps {
  text: string;
  icon: any;
  onPress?: () => void;
  tintColor?: string;
  extraIconClassName?: string; // Adicione esta linha
  extraBotaoClassName?: string; // Adicione esta linha
  extraTextClassName?: string; // Adicione esta linha
  iconColor?: string;
}

const BotaoComIcone: React.FC<BotaoComIconeProps> = ({
  text,
  icon,
  onPress,
  tintColor = "#0090ce",
  iconColor = "",
  extraIconClassName = "", // Adicione esta linha
  extraBotaoClassName = "", // Adicione esta linha
  extraTextClassName = "", // Adicione esta linha
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`h-10 border-secundaria-500 border-[2px] flex-row rounded-lg items-center justify-start px-2 py-1 ${extraBotaoClassName}`} // Modifique esta linha
    >
      <Image
        source={icon}
        tintColor={iconColor || tintColor}
        style={{ width: 44, height: 44 }} // Modifique esta linha
        className={extraIconClassName} // Modifique esta linha
        resizeMode="contain"
      />
      <Text
        className={`text-secundaria-700 font-medium h-6 pr-2 ${extraTextClassName}`}
      >
        {text}
      </Text>
    </TouchableOpacity>
  );
};

export default BotaoComIcone;
