import React from 'react';
import { Modal, View, Text, TouchableOpacity, Platform } from 'react-native';

const OrderConfirmationModal = ({ visible, onClose, onConfirm }) => {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-center items-center bg-black/50">
        <View className="bg-white p-6 rounded-lg w-[90%] max-w-md">
          <Text className="text-xl font-bold mb-4 text-secundaria-900">
            Confirmar Pedido
          </Text>
          <Text className="text-base mb-6 text-secundaria-700">
            Deseja continuar sem informar o nome do cliente?
          </Text>
          <View className="flex-row justify-end gap-2">
            <TouchableOpacity 
              onPress={onClose}
              className="px-4 py-2 rounded-lg bg-secundaria-200"
            >
              <Text className="text-secundaria-700 font-medium">Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={onConfirm}
              className="px-4 py-2 wrounded-lg bg-terceira-500"
            >
              <Text className="text-white font-medium">Continuar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default OrderConfirmationModal;