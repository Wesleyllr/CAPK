import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  Alert,
  Platform,
  TouchableOpacity,
  Image,
  ScrollView,
} from "react-native";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/firebaseConfig";
import { doc, setDoc, getFirestore } from "firebase/firestore"; // Importando para salvar dados no Firestore
import FormField from "@/components/FormField";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomButton from "@/components/CustomButton";
import { router } from "expo-router";
import { images } from "@/constants";
import { LinearGradient } from "expo-linear-gradient"; // Ensure you have expo-linear-gradient installed
import { sendEmailVerification } from "firebase/auth";

const Cadastro = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState(""); // Novo campo
  const [nomeCompleto, setNomeCompleto] = useState(""); // Novo campo
  const [loading, setLoading] = useState(false);

  const db = getFirestore(); // Instanciando o Firestore

  const direcionarParaCadastrar = () => {
    // Navegar para outra tela usando push
    router.push("/login"); // Substitua "OutraTela" pela tela desejada
  };

  // Função para lidar com o cadastro
  const handleSignUp = async () => {
    if (!email || !password || !confirmPassword || !username || !nomeCompleto) {
      Alert.alert("Erro", "Por favor, preencha todos os campos.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Erro", "As senhas não coincidem.");
      return;
    }

    setLoading(true);

    try {
      // Criação do usuário no Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Obtenha o UID do usuário criado
      const { user } = userCredential;

      // Enviar e-mail de verificação
      await sendEmailVerification(user);

      // Salve o username e o nome completo no Firestore
      await setDoc(doc(db, "users", user.uid), {
        username: username,
        nomeCompleto: nomeCompleto,
        email: email,
      });

      // Cadastro bem-sucedido
      Alert.alert(
        "Sucesso",
        "Cadastro realizado com sucesso! Um e-mail de verificação foi enviado."
      );
      router.replace("/login"); // Navega para a tela de Login

      // Resetar campos
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setUsername("");
      setNomeCompleto("");
    } catch (error) {
      const friendlyMessage = getFriendlyErrorMessage(error.code);
      Alert.alert("Erro", friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <SafeAreaView className="w-full h-full">
      <LinearGradient
        colors={["#faeaed", "#e07c8f"]}
        className="absolute inset-0 w-full h-full "
      />
      <ScrollView
        className="flex-1 p-5"
        contentContainerStyle={{
          justifyContent: "center", // Aplica à área de conteúdo
          alignItems: "center",
        }}
      >
        <Image
          source={images.logo}
          className={`mt-6 ${
            Platform.OS === "web" ? "max-w-[250px]" : "w-42 h-20"
          }`}
          resizeMode="contain"
        />
        <Text className="text-4xl font-bold text-center mb-5 mt-4">
          Cadastre-se
        </Text>

        <FormField
          title="Email"
          value={email}
          handleChangeText={(e) => setEmail(e)}
          keyboardType="email-address"
          otherStyles={`mt-4 w-full ${
            Platform.OS === "web" ? "max-w-[400px]" : ""
          }`}
        />

        <FormField
          title="Nome Completo"
          value={nomeCompleto}
          handleChangeText={(e) => setNomeCompleto(e)}
          otherStyles={`mt-4 w-full ${
            Platform.OS === "web" ? "max-w-[400px]" : ""
          }`}
        />

        <FormField
          title="Username"
          value={username}
          handleChangeText={(e) => setUsername(e)}
          otherStyles={`mt-4 w-full ${
            Platform.OS === "web" ? "max-w-[400px]" : ""
          }`}
        />

        <FormField
          title="Senha"
          value={password}
          handleChangeText={(e) => setPassword(e)}
          otherStyles={`mt-4 w-full ${
            Platform.OS === "web" ? "max-w-[400px]" : ""
          }`}
        />
        <FormField
          title="Confirmar senha"
          value={confirmPassword}
          handleChangeText={(e) => setConfirmPassword(e)}
          otherStyles={`mt-4 w-full ${
            Platform.OS === "web" ? "max-w-[400px]" : ""
          }`}
        />
        <TouchableOpacity
          className={`w-full items-end ${
            Platform.OS === "web" ? "max-w-[400px]" : ""
          }`}
          onPress={direcionarParaCadastrar}
        >
          <Text className="text-secundaria-800 font-pregular text-sm mr-4">
            Já tenho conta!
          </Text>
        </TouchableOpacity>
        <CustomButton
          title={loading ? "Cadastrando..." : "Cadastrar"}
          handlePress={handleSignUp}
          containerStyles={`mt-6 w-full ${
            Platform.OS === "web" ? "max-w-[300px]" : ""
          }`}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

export default Cadastro;
