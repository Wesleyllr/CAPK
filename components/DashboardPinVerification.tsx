import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';

interface DashboardPinVerificationProps {
  onVerify: (success: boolean) => void;
  correctPin: string;
}

const DashboardPinVerification = ({ onVerify, correctPin }: DashboardPinVerificationProps) => {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    setLoading(true);
    try {
      if (pin === correctPin) {
        onVerify(true);
      } else {
        Alert.alert('Erro', 'PIN incorreto');
        setPin('');
        onVerify(false);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-primaria justify-center p-6">
      <View className="bg-white p-6 rounded-lg shadow-md">
        <Text className="text-xl font-bold text-secundaria-900 mb-4 text-center">
          Digite o PIN do Dashboard
        </Text>
        <TextInput
          value={pin}
          onChangeText={setPin}
          className="bg-secundaria-50 p-4 rounded-lg text-center text-2xl tracking-widest mb-4"
          keyboardType="numeric"
          maxLength={4}
          secureTextEntry
          placeholder="****"
        />
        <TouchableOpacity
          onPress={handleVerify}
          disabled={loading || pin.length !== 4}
          className={`bg-terceira-500 p-4 rounded-lg ${
            (loading || pin.length !== 4) ? 'opacity-50' : ''
          }`}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-center font-bold">Verificar</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default DashboardPinVerification;
