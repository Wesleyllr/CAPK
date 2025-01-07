import "../setupNativewind";
import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, Image } from "react-native";
import { useRouter } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/firebaseConfig";
import { Platform } from "react-native";
import { images } from "@/constants";

const IndexScreen = () => {
  const router = useRouter();
  const [initialCheckCompleted, setInitialCheckCompleted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      // Marca o estado inicial como verificado após 3 segundos
      setInitialCheckCompleted(true);
    }, 3000);

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (initialCheckCompleted) {
        // Após os 3 segundos, redireciona baseado no estado do usuário
        if (user) {
          router.replace("/(tabs)/home");
        } else {
          router.replace("/(auth)/login");
        }
      }
    });

    // Limpa o temporizador e o ouvinte quando o componente for desmontado
    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, [initialCheckCompleted, router]);

  return (
    <View className="flex-1 justify-center items-center bg-white">
      <Image source={images.logo} resizeMode="contain" className="w-60 h-20" />
      <Text className="text-2xl font-bold text-center">Seja bem vindo!</Text>
      <Text className="text-2xl font-bold text-center">
        Estamos verificando o Login...
      </Text>
      <ActivityIndicator size="large" className="color-secundaria-700" />
    </View>
  );
};

export default IndexScreen;
