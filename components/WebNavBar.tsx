import React from "react";
import { View, Platform, Pressable, Text } from "react-native";
import { Link, usePathname } from "expo-router";
import { Image } from "expo-image";
import { images } from "@/constants";
import { Ionicons } from "@expo/vector-icons";

interface WebNavBarProps {
  isExpanded: boolean;
  onToggle: (expanded: boolean) => void;
}

const WebNavBar = ({ isExpanded, onToggle }: WebNavBarProps) => {
  const pathname = usePathname();

  if (Platform.OS !== "web") return null;

  const isActive = (path: string) => pathname === path;

  const NavLink = ({ to, children, icon }) => (
    <Link
      href={to}
      className={`w-full px-4 py-3 rounded-md transition-colors flex-row items-center justify-center gap-2 ${
        isActive(to)
          ? "bg-secundaria-100 text-secundaria-900"
          : "text-secundaria-700 hover:bg-secundaria-50"
      }`}
    >
      <Ionicons
        name={icon}
        size={20}
        color={isActive(to) ? "#7f5d5a" : "#9a8582"}
        className="pr-2"
      />
      <View className="flex-1">
        <Text
          className={`${
            isActive(to)
              ? "font-semibold text-base text-secundaria-900"
              : "text-base text-secundaria-700"
          }`}
        >
          {isExpanded && children}
        </Text>
      </View>
    </Link>
  );

  return (
    <View
      className={`h-full ${
        isExpanded ? "w-60" : "w-20"
      } bg-white border-r border-secundaria-200 fixed left-0 top-0 flex-col transition-all duration-300 z-50`}
      style={{ position: "fixed", top: 0, bottom: 0 }}
    >
      <View className="p-4 border-b border-secundaria-200 flex-row items-center justify-between">
        {isExpanded ? (
          <Image
            source={images.logopapelaria}
            className="w-full h-20"
            contentFit="contain"
          />
        ) : (
          <View className="w-full items-center">
            <Image
              source={images.logopapelariasemtexto}
              className="w-12 h-12"
              contentFit="contain"
            />
          </View>
        )}
      </View>

      <Pressable
        onPress={() => onToggle(!isExpanded)}
        className="absolute -right-4 top-16 w-8 h-8 bg-secundaria-100 rounded-full justify-center items-center shadow-md z-50"
        style={{ transform: [{ translateX: 0 }] }}
      >
        <Ionicons
          name={isExpanded ? "chevron-back" : "chevron-forward"}
          size={20}
          color="#7f5d5a"
        />
      </Pressable>

      <View className="flex-col gap-2 p-4">
        <NavLink to="/(tabs)/home" icon="home-outline">
          Home
        </NavLink>
        <NavLink to="/vender" icon="basket-outline">
          Vender
        </NavLink>
        <NavLink to="/screens/Produtos" icon="cube-outline">
          Produtos
        </NavLink>
        <NavLink to="/screens/pedidos" icon="list-outline">
          Pedidos
        </NavLink>
        <NavLink to="/screens/CriarWeb" icon="add-circle-outline">
          Criar Produto
        </NavLink>
        <NavLink to="/screens/dashboard" icon="bar-chart-outline">
          Dashboard
        </NavLink>
        <NavLink to="/screens/CategoryManagement" icon="pricetags-outline">
          Categorias
        </NavLink>
      </View>

      <View className="mt-auto border-t border-secundaria-200 p-4">
        <NavLink to="/(tabs)/perfil" icon="person-outline">
          Perfil
        </NavLink>
      </View>
    </View>
  );
};

export default WebNavBar;
