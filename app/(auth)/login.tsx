import React, { useState } from "react";
import {
  View,
  Text,
  Alert,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Platform,
} from "react-native";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/firebaseConfig";
import { useRouter } from "expo-router";
import FormField from "@/components/FormField";
import CustomButton from "@/components/CustomButton";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { getUserInfo } from "@/userService"; // Importando a função para buscar informações do usuário

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false); // Estado para indicador de carregamento
  const router = useRouter();

  const getFriendlyErrorMessage = (errorCode) => {
    const errorMessages = {
      "auth/invalid-email": "Por favor, insira um email válido.",
      "auth/user-not-found":
        "Usuário não encontrado. Verifique o email ou cadastre-se.",
      "auth/wrong-password": "Senha incorreta. Tente novamente.",
      "auth/email-already-in-use":
        "Este email já está em uso. Tente outro ou faça login.",
      "auth/weak-password":
        "A senha é muito fraca. Escolha uma senha mais segura.",
      "auth/too-many-requests":
        "Muitas tentativas falhas. Por favor, tente novamente mais tarde.",
      "auth/network-request-failed": "Erro de conexão. Verifique sua internet.",
      "auth/requires-recent-login":
        "Faça login novamente para concluir esta ação.",
      "auth/operation-not-allowed":
        "Este tipo de autenticação está temporariamente desativado.",
      "auth/invalid-credential": "Senha inválida.",
      "auth/missing-password": "Insira a senha.",
    };

    return errorMessages[errorCode] || error.message;
  };

  const handleLogin = async () => {
    setLoading(true); // Ativa o estado de carregamento

    try {
      // Login do usuário
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Verificar se o e-mail foi verificado
      if (!user.emailVerified) {
        Alert.alert(
          "Verificação necessária",
          "Seu e-mail não foi verificado. Verifique seu e-mail antes de fazer login."
        );
        setLoading(false); // Desativa o estado de carregamento
        return;
      }

      // Carregar informações do usuário
      const userInfo = await getUserInfo("nome"); // Exemplo: obtém o campo "nome"

      // Redireciona para a tela Home
      router.replace("/home");
    } catch (error) {
      const friendlyMessage = getFriendlyErrorMessage(error.code);
      Alert.alert("Erro", friendlyMessage);
    } finally {
      setLoading(false); // Desativa o estado de carregamento
    }
  };

  return (
    <SafeAreaView className="w-full h-full justify-center items-center">
      <LinearGradient
        colors={["#faeaed", "#e07c8f"]}
        className="absolute inset-0 w-full h-full"
      />
      <View className="w-full h-full justify-center items-center px-4">
        <Text className="text-4xl font-bold text-center mb-5">
          Bem vindo(a)!
        </Text>
        <FormField
          title="Email"
          value={email}
          handleChangeText={(e) => setEmail(e)}
          keyboardType="email-address"
          otherStyles={`mt-7 w-full ${
            Platform.OS === "web" ? "max-w-[400px]" : ""
          }`}
        />
        <FormField
          title="Senha"
          value={password}
          handleChangeText={(e) => setPassword(e)}
          otherStyles={`mt-7 w-full ${
            Platform.OS === "web" ? "max-w-[400px]" : ""
          }`}
        />
        <CustomButton
          title="Login"
          handlePress={handleLogin}
          containerStyles="mt-6 w-full"
        />

        {/* Indicador de carregamento */}
        {loading && (
          <ActivityIndicator
            size="large"
            className="color-secundaria-700 mt-4"
          />
        )}

        <TouchableOpacity className="mt-4">
          <Text className="text-secundaria-800 font-pregular text-sm">
            Esqueceu a senha?
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="mt-4"
          onPress={() => router.push("/cadastrarUsuario")}
        >
          <Text className="text-secundaria-800 font-pregular text-sm">
            Não tenho conta
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default Login;
