import React, { useState, useEffect } from "react";
import {
  View,
  TextInput,
  Modal,
  Button,
  Text,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import { addUserCategory, getUserCategories } from "@/userService";
import FormFieldProduct from "./FormFieldProduct";
import CustomButton from "./CustomButton";
import { icons } from "@/constants";
import BotaoComIcone from "./BotaoComIcone";


const CategoryDropdownWeb = ({ value: selectedValue, onChange }) => {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<string | null>(selectedValue);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newCategory, setNewCategory] = useState("");
  const [modalVisible, setModalVisible] = useState(false);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const categories = await getUserCategories();
      const formattedCategories = categories.map((category) => ({
        label: category.name,
        value: category.id,
      }));

      setItems([
        ...formattedCategories,
        { label: "Adicionar categoria...", value: "add_new" },
      ]);
    } catch (error) {
      alert("Erro ao buscar categorias: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async () => {
    try {
      if (!newCategory.trim()) {
        Alert.alert("", "Por favor, insira uma categoria.");
        return;
      }

      const newCategoryData = await addUserCategory(newCategory);

      setItems((prevItems) => [
        ...prevItems.filter((item) => item.value !== "add_new"),
        {
          label: newCategoryData.name,
          value: newCategoryData.id,
        },
        { label: "Adicionar nova categoria...", value: "add_new" },
      ]);

      setValue(newCategoryData.id);
      setNewCategory("");
      setModalVisible(false);
    } catch (error) {
      alert("Erro ao adicionar a categoria: " + error.message);
    }
  };

  const handleItemSelect = (itemValue: string | null) => {
    if (itemValue === "add_new") {
      setModalVisible(true);
    } else {
      setValue(itemValue);
      onChange(itemValue);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" className="color-secundaria-700" />
        <Text>Carregando categorias...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 justify-center items-center px-4 relative" style={{ zIndex: 9999 }}>
      <DropDownPicker
        listMode="SCROLLVIEW"
        open={open}
        value={value}
        items={items}
        setOpen={setOpen}
        setValue={setValue}
        setItems={setItems}
        placeholder="Selecione uma categoria"
        className="bg-white border border-secundaria-600 rounded-lg"
        dropDownContainerStyle={{
          backgroundColor: "#f9fafb",
          borderColor: "#d1d5db",
          position: "relative",  // Changed from absolute to relative
          zIndex: 9999,
          width: "100%",
        }}
        style={{
          position: "relative",
          zIndex: 9999,
        }}
        containerStyle={{
          position: "relative",
          zIndex: 9999,
          minHeight: 40,
          width: "100%"
        }}
        textStyle={{ fontSize: 16, fontWeight: "600", color: "#374151" }}
        onSelectItem={({ value }) => handleItemSelect(value)}
      />

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-gray-500 bg-opacity-50">
          <View className="bg-white p-6 rounded-lg w-100">
            <Text className="text-xl font-bold mb-4">Adicionar Categoria</Text>
            <FormFieldProduct
              value={newCategory}
              handleChangeText={setNewCategory}
              placeholder="Digite a nova categoria"
              otherStyles="p-2 mb-4"
            />
            <View className="w-max h-10 flex-row gap-2 items-center align-middle justify-between">
              <BotaoComIcone
                text="Adicionar"
                icon={icons.add}
                onPress={handleAddCategory}
              />
              <BotaoComIcone
                text="Cancelar"
                icon={icons.cancel}
                onPress={() => setModalVisible(false)}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default CategoryDropdownWeb;