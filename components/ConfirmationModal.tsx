import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';

interface ConfirmationModalProps {
  isVisible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

const ConfirmationModal = ({ isVisible, onClose, onConfirm, title, message }: ConfirmationModalProps) => {
  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="fade"
    >
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
        <View style={{ backgroundColor: 'white', padding: 24, borderRadius: 8, width: '90%', maxWidth: 400 }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>{title}</Text>
          <Text style={{ fontSize: 16, marginBottom: 24 }}>{message}</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 16 }}>
            <TouchableOpacity
              onPress={onClose}
              style={{ backgroundColor: '#e0e0e0', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 4 }}
            >
              <Text style={{ color: '#333' }}>Não</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onConfirm}
              style={{ backgroundColor: '#ff6f61', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 4 }}
            >
              <Text style={{ color: 'white' }}>Sim</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ConfirmationModal;
