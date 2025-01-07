import { View, Text, TouchableOpacity, Image } from "react-native";
import React from "react";
import { icons } from "@/constants";
import { useTailwind } from "nativewind";


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
  onToggleView
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
            className="w-8 h-8 ml-2"
            tintColor="#085072"
          />
        </TouchableOpacity>
      )}

      {(onSave || onToggleView) && (
        <TouchableOpacity 
          onPress={onToggleView || onSave} 
          className="p-1 mr-1 flex-row"
        >
          {showSaveIcon && onSave && (
            <>
              <Text className="text-lg font-bold align-middle text-secundaria-900">
                Salvar
              </Text>
              <Image
                source={icons.save}
                resizeMode="contain"
                className="w-10 h-10 tint-secundaria"
              />
            </>
          )}
          {onToggleView && (
            <Text className="text-primaria text-3xl mr-1">
              {isCompactView ? "≣" : "≡"}
            </Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
};

export default Header;