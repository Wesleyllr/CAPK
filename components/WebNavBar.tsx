import React from "react";
import { View, Platform, Pressable, Text } from "react-native";
import { Link, usePathname } from "expo-router";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { images } from "@/constants";

// Types
interface WebNavBarProps {
  isExpanded: boolean;
  onToggle: (expanded: boolean) => void;
}

interface NavLinkProps {
  to: string;
  children: React.ReactNode;
  icon: string;
  isActive: boolean;
  isExpanded: boolean;
}

// NavLink Component
const NavLink: React.FC<NavLinkProps> = ({
  to,
  children,
  icon,
  isActive,
  isExpanded,
}) => (
  <Link
    href={to}
    className={`w-full px-4 py-3 rounded-md transition-colors flex-row items-center ${
      !isExpanded ? "justify-center" : "justify-start"
    } gap-2 ${
      isActive
        ? "bg-secundaria-100 text-secundaria-900"
        : "text-secundaria-700 hover:bg-secundaria-50"
    }`}
  >
    <Ionicons
      name={icon}
      size={20}
      color={isActive ? "#7f5d5a" : "#9a8582"}
      className="pr-2"
    />
    {isExpanded && (
      <View className="flex-1">
        <Text
          className={`${
            isActive
              ? "font-semibold text-base text-secundaria-900"
              : "text-base text-secundaria-700"
          }`}
        >
          {children}
        </Text>
      </View>
    )}
  </Link>
);

// Navigation Items Configuration
const NAV_ITEMS = [
  { to: "/(tabs)/home", icon: "home-outline", label: "Home" },
  { to: "/vender", icon: "basket-outline", label: "Vender" },
  { to: "/screens/Produtos", icon: "cube-outline", label: "Produtos" },
  { to: "/screens/pedidos", icon: "list-outline", label: "Pedidos" },
  {
    to: "/screens/CriarWeb",
    icon: "add-circle-outline",
    label: "Criar Produto",
  },
  { to: "/screens/dashboard", icon: "bar-chart-outline", label: "Dashboard" },
  {
    to: "/screens/CategoryManagement",
    icon: "pricetags-outline",
    label: "Categorias",
  },
];

// Main Component
const WebNavBar: React.FC<WebNavBarProps> = ({ isExpanded, onToggle }) => {
  const pathname = usePathname();

  if (Platform.OS !== "web") return null;

  const isActive = (path: string) => pathname === path;

  return (
    <View
      className={`h-full ${
        isExpanded ? "w-60" : "w-20"
      } bg-white border-r border-secundaria-200 fixed left-0 top-0 flex-col transition-all duration-300 z-50`}
      style={{ position: "fixed", top: 0, bottom: 0 }}
    >
      {/* Logo Section */}
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
              className="w-12 h-20"
              contentFit="contain"
            />
          </View>
        )}
      </View>

      {/* Toggle Button */}
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

      {/* Navigation Links */}
      <View className="flex-col gap-2 p-4">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            icon={item.icon}
            isActive={isActive(item.to)}
            isExpanded={isExpanded}
          >
            {item.label}
          </NavLink>
        ))}
      </View>

      {/* Profile Link */}
      <View className="mt-auto border-t border-secundaria-200 p-4">
        <NavLink
          to="/(tabs)/perfil"
          icon="person-outline"
          isActive={isActive("/(tabs)/perfil")}
          isExpanded={isExpanded}
        >
          Perfil
        </NavLink>
      </View>
    </View>
  );
};

export default WebNavBar;
