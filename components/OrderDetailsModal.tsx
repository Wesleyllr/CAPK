import React, { useCallback } from "react";
import { Modal, View, Text, TouchableOpacity, FlatList } from "react-native";
import { IOrder, ICartItem } from "@/types/types";
import { CONSTANTS } from "@/constants/constants";

interface OrderDetailsModalProps {
  isVisible: boolean;
  order: IOrder | null;
  onClose: () => void;
}

const OrderDetailsModal = ({
  isVisible,
  order,
  onClose,
}: OrderDetailsModalProps) => {
  const renderItem = useCallback(
    ({ item }: { item: ICartItem }) => (
      <View className="py-2 border-b border-secundaria-100">
        <Text className="text-base">
          {item.title} - {item.quantity}x
        </Text>
        {item.observations && (
          <Text className="text-quinta text-sm mt-1">{item.observations}</Text>
        )}
      </View>
    ),
    []
  );

  if (!order) return null;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-center items-center bg-black/50">
        <View className="bg-primaria p-5 rounded-lg w-4/5">
          <Text className="text-xl font-bold text-center mb-4">
            Detalhes do Pedido #{order.id.slice(-CONSTANTS.SLICE_LENGTH)}
          </Text>
          <FlatList
            data={order.items}
            renderItem={renderItem}
            keyExtractor={(item, index) => `${item.id}-${index}`}
            className="max-h-96"
          />
          <TouchableOpacity
            onPress={onClose}
            className="bg-secundaria-500 p-3 rounded mt-4 self-end"
          >
            <Text className="text-primaria">Fechar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default OrderDetailsModal;
