import * as ImagePicker from "expo-image-picker";
import { Platform, Alert } from "react-native";

export const pickImagem = async () => {
  try {
    // Solicita permissão para acessar a galeria de fotos
    if (Platform.OS !== "web") {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permissão Negada",
          "Precisamos da permissão para acessar suas fotos."
        );
        return null; // Retorna null se o usuário não conceder permissão
      }
    }

    // Abre a galeria de fotos para o usuário selecionar uma imagem
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, // Seleciona todos os tipos de mídia
      allowsEditing: true, // Permite edição
      aspect: [1, 1], // Define a proporção de corte
      quality: 1, // Define a qualidade da imagem
    });

    if (!result.canceled) {
      return result.assets[0].uri; // Retorna a URI da imagem selecionada
    }

    return null; // Caso o usuário cancele
  } catch (error) {
    console.error("Erro ao selecionar imagem:", error.message);
    return null; // Retorna null em caso de erro
  }
};
