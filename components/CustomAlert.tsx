import React from "react";
import { View, Text, Pressable } from "react-native";
import { Icon } from "react-native-elements";

const CustomAlert = ({
  type = "success", // Define o tipo do alerta ('success', 'info', 'alerta', 'error')
  message,
  onPress,
}) => {
  const styles = {
    success: {
      bgColor: "#d1fad7", // Cor de fundo verde claro
      borderColor: "#4caf50", // Cor de borda verde
      textColor: "#388e3c", // Cor do texto verde escuro
      iconColor: "#4caf50", // Cor do ícone verde
    },
    info: {
      bgColor: "#bbdefb", // Cor de fundo azul claro
      borderColor: "#2196f3", // Cor de borda azul
      textColor: "#1e88e5", // Cor do texto azul escuro
      iconColor: "#2196f3", // Cor do ícone azul
    },
    alerta: {
      bgColor: "#fff9c4", // Cor de fundo amarelo claro
      borderColor: "#ff9800", // Cor de borda laranja
      textColor: "#f57c00", // Cor do texto laranja escuro
      iconColor: "#ff9800", // Cor do ícone laranja
    },
    error: {
      bgColor: "#ffebee", // Cor de fundo vermelho claro
      borderColor: "#f44336", // Cor de borda vermelha
      textColor: "#d32f2f", // Cor do texto vermelho escuro
      iconColor: "#f44336", // Cor do ícone vermelho
    },
  };

  const currentStyle = styles[type] || styles.success;

  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        padding: 8,
        borderRadius: 8,
        borderLeftWidth: 4,
        backgroundColor: currentStyle.bgColor,
        borderColor: currentStyle.borderColor,
        transform: [{ scale: 1.05 }],
      }}
    >
      <Icon
        name={
          type === "success"
            ? "check-circle"
            : type === "info"
            ? "info"
            : type === "alerta"
            ? "warning"
            : "error"
        }
        type="material"
        color={currentStyle.iconColor}
        size={20}
        containerStyle={{ marginRight: 8 }}
      />
      <Text
        style={{
          fontSize: 12,
          fontWeight: "600",
          color: currentStyle.textColor,
        }}
      >
        {message}
      </Text>
    </Pressable>
  );
};

export default CustomAlert;
