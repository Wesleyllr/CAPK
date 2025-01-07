import React from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
} from "react-native";

const telaweb = () => {
  const renderItem = () => (
    <View className="w-24 h-32 bg-gray-200 rounded-md mx-2 mb-4">
      <Text className="text-center text-sm mt-2">Item #1 Name</Text>
      <Text className="text-center text-sm mt-1">$19.99</Text>
    </View>
  );

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row justify-between items-center p-4">
        <Text className="text-green-500 text-lg">Back</Text>
        <Text className="text-black font-bold text-lg">Market</Text>
        <Text className="text-green-500 text-lg">Filter</Text>
      </View>

      {/* Search Bar */}
      <View className="px-4">
        <TextInput
          className="bg-gray-100 w-full h-10 rounded-lg px-4 text-gray-500"
          placeholder="Search"
        />
      </View>

      {/* Hot Deals Section */}
      <View className="px-4 mt-6">
        <Text className="font-bold text-lg mb-4">Hot deals</Text>
        <FlatList
          data={[1, 2, 3]}
          horizontal
          renderItem={renderItem}
          keyExtractor={(item, index) => index.toString()}
          showsHorizontalScrollIndicator={false}
        />
      </View>

      {/* Trending Section */}
      <View className="px-4 mt-6">
        <Text className="font-bold text-lg mb-4">Trending</Text>
        <FlatList
          data={[1, 2, 3]}
          horizontal
          renderItem={renderItem}
          keyExtractor={(item, index) => index.toString()}
          showsHorizontalScrollIndicator={false}
        />
      </View>

      {/* Deals Section */}
      <View className="px-4 mt-6">
        <Text className="font-bold text-lg mb-4">Deals</Text>
        <FlatList
          data={[1, 2, 3]}
          horizontal
          renderItem={renderItem}
          keyExtractor={(item, index) => index.toString()}
          showsHorizontalScrollIndicator={false}
        />
      </View>

      {/* Bottom Navigation */}
      <View className="absolute bottom-0 left-0 right-0 bg-white h-16 flex-row justify-around items-center border-t border-gray-200">
        <TouchableOpacity className="h-8 w-8 bg-green-500 rounded-full" />
        <TouchableOpacity className="h-8 w-8 bg-gray-300 rounded-full" />
        <TouchableOpacity className="h-8 w-8 bg-gray-300 rounded-full" />
        <TouchableOpacity className="h-8 w-8 bg-gray-300 rounded-full" />
      </View>
    </View>
  );
};

export default telaweb;
