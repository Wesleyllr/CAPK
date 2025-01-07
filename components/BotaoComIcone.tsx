import React from "react";
import { TouchableOpacity, Image, Text } from "react-native";

interface BotaoComIconeProps {
  text: string;
  icon: any;
  onPress?: () => void;
  tintColor?: string;
}

const BotaoComIcone: React.FC<BotaoComIconeProps> = ({
  text,
  icon,
  onPress,
  tintColor = "#0090ce",
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="h-10 border-secundaria-500 border-[2px] flex-row rounded-lg items-center  justify-startpx-2 py-1"
    >
      <Image
        source={icon}
        tintColor={tintColor}
        contentFit="cover"
        className="w-11 h-11"
      />
      <Text className="text-secundaria-700 font-medium h-6 pr-2">{text}</Text>
    </TouchableOpacity>
  );
};

export default BotaoComIcone;
