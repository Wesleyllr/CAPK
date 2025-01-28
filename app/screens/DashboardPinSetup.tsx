import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { doc, updateDoc } from "firebase/firestore";
import { db, auth } from "@/firebaseConfig";
import { Ionicons } from "@expo/vector-icons";

const DashboardPinSetup = () => {
  const [loading, setLoading] = useState(false);
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [isEnabled, setIsEnabled] = useState(true); // Add this line

  const handleSave = async () => {
    if (pin.length !== 4 || !/^\d+$/.test(pin)) {
      Alert.alert("Erro", "O PIN deve conter exatamente 4 dígitos numéricos");
      return;
    }

    if (pin !== confirmPin) {
      Alert.alert("Erro", "Os PINs não coincidem");
      return;
    }

    try {
      setLoading(true);
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error("Usuário não autenticado");

      // Update the config document instead of the user document
      await updateDoc(doc(db, `users/${userId}/config/config`), {
        dashboardPin: pin,
        dashboardPinCreatedAt: new Date(),
        dashboardPinEnabled: true,
      });

      Alert.alert("Sucesso", "PIN configurado com sucesso!");
      router.back();
    } catch (error) {
      console.error(error);
      Alert.alert("Erro", "Falha ao salvar o PIN");
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
            Configurar PIN do Dashboard
          </Text>
          <View className="w-6" />
        </View>

        <View className="space-y-6 mt-4">
          <View>
            <Text className="text-quinta mb-2">Digite um PIN de 4 dígitos</Text>
            <TextInput
              value={pin}
              onChangeText={setPin}
              className="bg-secundaria-50 p-4 rounded-lg text-center text-2xl tracking-widest"
              keyboardType="numeric"
              maxLength={4}
              secureTextEntry
              placeholder="****"
            />
          </View>

          <View>
            <Text className="text-quinta mb-2">Confirme o PIN</Text>
            <TextInput
              value={confirmPin}
              onChangeText={setConfirmPin}
              className="bg-secundaria-50 p-4 rounded-lg text-center text-2xl tracking-widest"
              keyboardType="numeric"
              maxLength={4}
              secureTextEntry
              placeholder="****"
            />
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
              <Text className="text-white text-center font-bold">
                Salvar PIN
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default DashboardPinSetup;
