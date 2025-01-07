import React from "react";
import { View, TouchableOpacity } from "react-native";

const ColorSelector = ({
  selectedColor,
  setSelectedColor,
  disabled,
  onColorSelect,
}) => {
  const colors = [
    "#f9fafb",
    "#2dde12",
    "#603209",
    "#007bff",
    "#ff0000",
    "#ffc107",
    "#fd7e14",
    "#6f42c1",
  ];

  const handleColorSelect = (color) => {
    if (!disabled) {
      setSelectedColor(color);
      onColorSelect?.(color); // Chama o callback se existir
    }
  };

  return (
    <View
      style={{
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-evenly",
        gap: 8, // Espaçamento entre os itens
      }}
    >
      {colors.map((color) => (
        <TouchableOpacity
          key={color}
          style={{
            width: "20%",
            height: "20%", // Ajusta o tamanho dos botões proporcionalmente
            aspectRatio: 1, // Mantém os botões quadrados
            backgroundColor: color,
            borderRadius: 8,
            borderWidth: selectedColor === color ? 2 : 0,
            borderColor: selectedColor === color ? "#ffffff" : "transparent",
            opacity: disabled ? 0.5 : 1,
          }}
          onPress={() => handleColorSelect(color)}
          disabled={disabled}
        />
      ))}
    </View>
  );
};

export default ColorSelector;
