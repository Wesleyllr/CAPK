import { View, Text, TextInput, TouchableOpacity, Image } from "react-native";
import React, { useState } from "react";
import { icons, images } from "@/constants";
import { Platform } from "react-native";

type FormFieldProps = {
  title: string; // Título do campo
  value: string; // Valor do campo
  handleChangeText: (text: string) => void; // Função para manipular a entrada
  otherStyles?: string; // Estilos adicionais (opcional)
  placeholder?: string;
  keyboardType?: string; // Tipo de teclado (opcional)
};

const FormField: React.FC<FormFieldProps> = ({
  title,
  value,
  handleChangeText,
  otherStyles,
  placeholder,
  keyboardType = "default",
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View className={`space-y-2 ${otherStyles}`}>
      <View
        className="border-2 border-secundaria-500 w-full h-16 px-4 bg-primaria rounded-2xl
        focus:border-primaria flex-col"
      >
        <View
          className={`w-full h-16 justify-end ${
            Platform.OS === "web" ? "pb-2" : ""
          }`}
        >
          <View className="items-center flex-row ">
            <TextInput
              className="flex-1 text-secundaria-950 font-psemibold text-base"
              value={value}
              placeholder={placeholder}
              placeholderTextColor="#0090ce"
              onChangeText={handleChangeText}
              secureTextEntry={
                (title === "Password" || title === "Senha" || title === "Confirmar senha") && !showPassword
              }
              keyboardType={keyboardType}
            />
            {(title === "Password" || title === "Senha" || title === "Confirmar senha") && (
              <TouchableOpacity
                onPress={() => setShowPassword((prev) => !prev)}
              >
                <Image
                  source={!showPassword ? icons.eye : icons.eyeHide}
                  className="w-6 h-6"
                  resizeMode="contain"
                  style={{
                    width: Platform.OS === "web" ? 32 : 24,
                    height: Platform.OS === "web" ? 32 : 24,
                    resizeMode: "contain",
                  }}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>
        <Text className="text-base text-secundaria-600 font-psemibold absolute ml-2">
          {title}
        </Text>
      </View>
    </View>
  );
};

export default FormField;
