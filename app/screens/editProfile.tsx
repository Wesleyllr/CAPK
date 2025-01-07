import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { doc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, auth, storage } from "@/firebaseConfig";
import { getUserInfo } from "@/userService";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { updateProfile } from "firebase/auth";

const EditProfile = () => {
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState({
    name: "",
    phone: "",
    photoURL: null,
  });

  useEffect(() => {
    loadUserInfo();
  }, []);

  const loadUserInfo = async () => {
    try {
      const name = await getUserInfo("name");
      const phone = await getUserInfo("phone");
      const photoURL = auth.currentUser?.photoURL;

      setUserInfo({ name, phone, photoURL });
    } catch (error) {
      Alert.alert("Erro", "Falha ao carregar informações do usuário");
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled && result.assets[0].uri) {
      uploadImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri) => {
    try {
      setLoading(true);
      const response = await fetch(uri);
      const blob = await response.blob();

      const userId = auth.currentUser.uid;
      const imageRef = ref(storage, `profile/${userId}`);

      // Faz o upload da imagem
      await uploadBytes(imageRef, blob);
      const photoURL = await getDownloadURL(imageRef);

      // Atualiza o photoURL no Firestore
      await updateDoc(doc(db, "users", userId), { photoURL });

      // Atualiza o photoURL no Firebase Authentication
      await updateProfile(auth.currentUser, { photoURL });

      setUserInfo((prev) => ({ ...prev, photoURL }));
    } catch (error) {
      Alert.alert("Erro", "Falha ao atualizar foto do perfil");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const userId = auth.currentUser.uid;

      // Atualiza os campos no Firestore
      await updateDoc(doc(db, "users", userId), {
        name: userInfo.name,
        phone: userInfo.phone,
        photoURL: userInfo.photoURL, // Atualiza o photoURL, caso tenha sido alterado
      });

      // Atualiza o profile no Firebase Authentication
      if (auth.currentUser.photoURL !== userInfo.photoURL) {
        await updateProfile(auth.currentUser, { photoURL: userInfo.photoURL });
      }

      Alert.alert("Sucesso", "Perfil atualizado com sucesso!");
      router.back();
    } catch (error) {
      Alert.alert("Erro", "Falha ao atualizar perfil");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-primaria">
      <View className="p-6">
        <View className="flex-row justify-between items-center mb-6">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#7f5d5a" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-secundaria-900">
            Editar Perfil
          </Text>
          <View className="w-6" />
        </View>

        <TouchableOpacity
          onPress={pickImage}
          className="items-center mb-6"
          disabled={loading}
        >
          <View className="w-24 h-24 rounded-full bg-secundaria-100 mb-4 overflow-hidden">
            {loading ? (
              <View className="w-full h-full items-center justify-center">
                <ActivityIndicator color="#7f5d5a" />
              </View>
            ) : userInfo.photoURL ? (
              <Image
                source={{ uri: userInfo.photoURL }}
                className="w-full h-full"
              />
            ) : (
              <View className="w-full h-full items-center justify-center">
                <Ionicons name="person" size={40} color="#7f5d5a" />
              </View>
            )}
          </View>
          <Text className="text-terceira-500">Alterar foto</Text>
        </TouchableOpacity>

        <View className="space-y-4">
          <View>
            <Text className="text-quinta mb-2">Nome completo</Text>
            <TextInput
              value={userInfo.name}
              onChangeText={(text) =>
                setUserInfo((prev) => ({ ...prev, name: text }))
              }
              className="bg-secundaria-50 p-4 rounded-lg"
              placeholder="Seu nome"
            />
          </View>

          <View>
            <Text className="text-quinta mb-2">Telefone</Text>
            <TextInput
              value={userInfo.phone}
              onChangeText={(text) =>
                setUserInfo((prev) => ({ ...prev, phone: text }))
              }
              className="bg-secundaria-50 p-4 rounded-lg"
              placeholder="Seu telefone"
              keyboardType="phone-pad"
            />
          </View>
        </View>

        <TouchableOpacity
          onPress={handleSave}
          disabled={loading}
          className={`bg-terceira-500 p-4 rounded-lg mt-6 ${
            loading ? "opacity-50" : ""
          }`}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-center font-bold">Salvar</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default EditProfile;
