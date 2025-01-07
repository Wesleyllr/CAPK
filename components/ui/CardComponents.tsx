import React from "react";
import { View, Text, StyleSheet, ViewProps, TextProps } from "react-native";

interface CardProps extends ViewProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  style,
  ...props
}) => (
  <View
    style={[styles.card, style]}
    className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}
    {...props}
  >
    {children}
  </View>
);

export const CardHeader: React.FC<CardProps> = ({
  children,
  className,
  style,
  ...props
}) => (
  <View
    style={[styles.cardHeader, style]}
    className={`p-6 ${className}`}
    {...props}
  >
    {children}
  </View>
);

export const CardTitle: React.FC<TextProps> = ({
  children,
  className,
  style,
  ...props
}) => (
  <Text
    style={[styles.cardTitle, style]}
    className={`text-2xl font-semibold leading-none tracking-tight ${className}`}
    {...props}
  >
    {children}
  </Text>
);

export const CardContent: React.FC<CardProps> = ({
  children,
  className,
  style,
  ...props
}) => (
  <View
    style={[styles.cardContent, style]}
    className={`p-6 pt-0 ${className}`}
    {...props}
  >
    {children}
  </View>
);

const styles = StyleSheet.create({
  card: {
    overflow: "hidden",
  },
  cardHeader: {
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  cardTitle: {
    color: "#111827",
  },
  cardContent: {
    flexGrow: 1,
  },
});

export default {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
};
