import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, storage } from "@/firebaseConfig";

// Classe para lidar com a autenticação
class AuthService {
  static ensureAuthenticated() {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("Usuário não autenticado");
    }
    return user.uid;
  }
}

// Função para upload da imagem
export const uploadImage = async (uri: string) => {
  try {
    const userId = AuthService.ensureAuthenticated();
    const response = await fetch(uri);
    if (!response.ok) {
      throw new Error("Falha ao acessar a imagem. Status: " + response.status);
    }

    const blob = await response.blob();
    const fileName = `encantoFotos/${userId}/${Date.now()}.jpg`;
    const storageRef = ref(storage, fileName);

    await uploadBytes(storageRef, blob);

    const downloadURL = await getDownloadURL(storageRef);

    return downloadURL;
  } catch (error) {
    console.error("Erro ao enviar imagem:", error.message);
    throw error;
  }
};
