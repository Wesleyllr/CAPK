import React from "react";
import { ActivityIndicator, View } from "react-native";

interface LoadingSpinnerProps {
  size?: "small" | "large";
  color?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "large",
  color = "#0284c7", // sky-600
}) => {
  return (
    <View className="flex-1 items-center justify-center p-4">
      <ActivityIndicator size={size} color={color} />
    </View>
  );
};
