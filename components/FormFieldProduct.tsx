import { View, Text, TextInput } from "react-native";
import React, { useState } from "react";

type FormFieldProductProps = {
  title: string;
  value: string;
  handleChangeText: (text: string) => void;
  otherStyles?: string;
  placeholder?: string;
  keyboardType?: string;
  multiline?: boolean;
  monetario?: boolean;
};

const FormFieldProduct: React.FC<FormFieldProductProps> = ({
  title,
  value = "",
  handleChangeText,
  otherStyles = "",
  placeholder = "",
  keyboardType = "default",
  multiline = false,
  monetario = false,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const shouldShowTitle = isFocused || value.length > 0;

  // Formata valor bruto como moeda brasileira com espaço entre o "R$" e o valor
  const formatCurrency = (numericValue: string): string => {
    const numeric = parseFloat(numericValue) || 0;
    let formatted = new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(numeric / 100);

    // Adiciona um espaço entre "R$" e o valor
    formatted = formatted.replace("R$", "R$ ");
    return formatted;
  };

  // Manipulador para alterar o texto com limite
  const handleTextChange = (text: string) => {
    if (monetario) {
      const numericValue = text.replace(/\D/g, ""); // Apenas números
      const numeric = parseInt(numericValue, 10);

      // Limite máximo de 99999999 (correspondente a 999.999,99 em centavos)
      if (numeric > 99999999) {
        return; // Ignorar valores acima do limite
      }

      handleChangeText(numericValue); // Atualiza o estado com valor bruto
    } else {
      handleChangeText(text);
    }
  };

  // Exibe o valor formatado ou o bruto dependendo do estado
  const displayValue =
    monetario && value.length > 0 ? formatCurrency(value) : value;

  return (
    <View className={`space-y-2 ${otherStyles}`}>
      <View
        className={`w-full px-4 flex-col justify-end mt-2 ${
          multiline ? "h-28" : "h-16"
        }`}
      >
        {shouldShowTitle && (
          <Text className="text-base text-secundaria-900 font-extrabold">
            {title}
          </Text>
        )}
        <TextInput
          className={`w-full ${
            multiline
              ? "h-24 border-[1px] rounded-lg border-secundaria-700"
              : "h-12"
          } text-secundaria-950 font-psemibold text-base`}
          numberOfLines={multiline ? 4 : 1}
          value={displayValue} // Exibe o valor formatado ou vazio
          placeholder={placeholder}
          placeholderTextColor="#553e3c"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onChangeText={handleTextChange} // Atualiza o estado
          keyboardType={monetario ? "numeric" : keyboardType}
          multiline={multiline}
          textAlignVertical="bottom"
          scrollEnabled={multiline}
        />
      </View>
      <View
        className={`${multiline ? "" : "w-full h-[2px] bg-secundaria-700"}`}
      />
    </View>
  );
};

export default FormFieldProduct;
