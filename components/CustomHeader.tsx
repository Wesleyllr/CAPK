import { View, Text, TouchableOpacity, Image } from "react-native";
import React from "react";
import { icons } from "@/constants";

type HeaderProps = {
  title: string;
  onGoBack?: () => void;
  onSave?: () => void;
  showSaveIcon?: boolean;
  isCompactView?: boolean;
  onToggleView?: () => void;
};

const Header: React.FC<HeaderProps> = ({
  title,
  onGoBack,
  onSave,
  showSaveIcon = true,
  isCompactView,
  onToggleView,
}) => {
  return (
    <View className="flex-row items-center justify-between p-1 bg-secundaria">
      <Text className="text-white text-xl font-bold absolute w-full text-center">
        {title}
      </Text>

      {onGoBack && (
        <TouchableOpacity onPress={onGoBack}>
          <Image
            source={icons.leftArrow}
            resizeMode="contain"
            className="w-10 h-10 ml-2"
            tintColor="#085072"
          />
        </TouchableOpacity>
      )}

      {onToggleView && (
        <TouchableOpacity onPress={onToggleView} className="p-1 mr-1 flex-row">
          <Text className="text-primaria text-3xl mr-1">
            {isCompactView ? "≣" : "≡"}
          </Text>
        </TouchableOpacity>
      )}
      {showSaveIcon && onSave && (
        <TouchableOpacity onPress={onSave}>
          <Image
            source={icons.save} // Certifique-se de que o ícone 'save' está no seu arquivo de ícones
            resizeMode="contain"
            className="w-12 h-12 mr-2"
            tintColor="#085072"
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default Header;
