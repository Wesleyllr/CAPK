import React from "react";
import { View, Text } from "react-native";
import { AlertTriangle } from "lucide-react";

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  onRetry,
}) => {
  return (
    <View className="flex-1 items-center justify-center p-4">
      <View className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md w-full">
        <View className="flex flex-row items-center space-x-2 mb-2">
          <AlertTriangle className="text-red-500" size={24} />
          <Text className="text-red-800 font-semibold text-lg">Erro</Text>
        </View>
        <Text className="text-red-600 mb-4">{message}</Text>
        {onRetry && (
          <View className="items-center">
            <View
              className="bg-red-100 rounded-md px-4 py-2"
              role="button"
              onTouchEnd={onRetry}
            >
              <Text className="text-red-700 font-medium">Tentar novamente</Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
};
