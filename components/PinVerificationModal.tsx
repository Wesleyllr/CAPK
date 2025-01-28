import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import { doc, getDoc } from "firebase/firestore";
import { db, auth } from "@/firebaseConfig";

interface PinVerificationModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const PinVerificationModal = ({
  isVisible,
  onClose,
  onSuccess,
}: PinVerificationModalProps) => {
  const [pin, setPin] = useState("");

  const verifyPin = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const configDoc = await getDoc(doc(db, `users/${userId}/config/config`));
      const configData = configDoc.data();

      if (configData?.dashboardPin === pin) {
        onSuccess();
        onClose();
      } else {
        Alert.alert("Erro", "PIN incorreto");
      }
    } catch (error) {
      console.error("Erro ao verificar PIN:", error);
      Alert.alert("Erro", "Falha ao verificar PIN");
    }
  };

  return (
    <Modal visible={isVisible} transparent animationType="fade">
      <View className="flex-1 justify-center items-center bg-black/50">
        <View className="bg-white p-6 rounded-lg w-80">
          <Text className="text-lg font-bold mb-4 text-secundaria-900">
            Digite o PIN
          </Text>
          <TextInput
            className="border border-secundaria-300 rounded-lg p-2 mb-4"
            secureTextEntry
            keyboardType="numeric"
            maxLength={4}
            value={pin}
            onChangeText={setPin}
            placeholder="****"
          />
          <View className="flex-row justify-end gap-2">
            <TouchableOpacity
              onPress={onClose}
              className="bg-gray-200 px-4 py-2 rounded-lg"
            >
              <Text>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={verifyPin}
              className="bg-secundaria-700 px-4 py-2 rounded-lg"
            >
              <Text className="text-white">Confirmar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default PinVerificationModal;
