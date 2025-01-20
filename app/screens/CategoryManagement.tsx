import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { collection, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db, auth } from "@/firebaseConfig";
import { getUserCategories, addUserCategory } from "@/userService";
import FormFieldProduct from "@/components/FormFieldProduct";
import BotaoComIcone from "@/components/BotaoComIcone";
import { icons } from "@/constants";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "@/components/CustomHeader";
import { router } from "expo-router";
import { Modal as RNModal } from "react-native"; // Adicione este import

const CategoryManagement = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [editingCategory, setEditingCategory] = useState({ id: "", name: "" });
  const [confirmDeleteModalVisible, setConfirmDeleteModalVisible] =
    useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const fetchedCategories = await getUserCategories();
      setCategories(fetchedCategories);
    } catch (error) {
      Alert.alert("Erro", "Erro ao buscar categorias: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAddCategory = async () => {
    try {
      if (!newCategory.trim()) {
        Alert.alert("", "Por favor, insira uma categoria.");
        return;
      }

      const newCategoryData = await addUserCategory(newCategory);
      setCategories((prev) => [...prev, newCategoryData]);
      setNewCategory("");
      setModalVisible(false);
      Alert.alert("Sucesso", "Categoria adicionada com sucesso!");
    } catch (error) {
      Alert.alert("Erro", "Erro ao adicionar categoria: " + error.message);
    }
  };

  const handleEditCategory = async () => {
    try {
      if (!editingCategory.name.trim()) {
        Alert.alert("", "O nome da categoria não pode estar vazio.");
        return;
      }

      const user = auth.currentUser;
      if (!user) throw new Error("Usuário não autenticado");

      const categoryRef = doc(
        db,
        `users/${user.uid}/category`,
        editingCategory.id
      );
      await updateDoc(categoryRef, {
        name: editingCategory.name,
      });

      setCategories((prev) =>
        prev.map((cat) =>
          cat.id === editingCategory.id
            ? { ...cat, name: editingCategory.name }
            : cat
        )
      );

      setEditModalVisible(false);
      Alert.alert("Sucesso", "Categoria atualizada com sucesso!");
    } catch (error) {
      Alert.alert("Erro", "Erro ao atualizar categoria: " + error.message);
    }
  };

  const handleDeleteCategory = async () => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Usuário não autenticado");

      const categoryRef = doc(
        db,
        `users/${user.uid}/category`,
        categoryToDelete.id
      );
      await deleteDoc(categoryRef);

      setCategories((prev) =>
        prev.filter((cat) => cat.id !== categoryToDelete.id)
      );
      setConfirmDeleteModalVisible(false);
      Alert.alert("Sucesso", "Categoria excluída com sucesso!");
    } catch (error) {
      Alert.alert("Erro", "Erro ao excluir categoria: " + error.message);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-primaria">
      <Header
        title="Gerenciar Categorias"
        onGoBack={() => router.back()}
        extraClassName="h-14"
      />
      <View className="p-4">
        <BotaoComIcone
          text="Nova Categoria"
          icon={icons.add}
          onPress={() => setModalVisible(true)}
          extraClassName="h-14"
        />
      </View>

      <ScrollView className="flex-1 px-4">
        {categories.map((category) => (
          <View
            key={category.id}
            className="flex-row justify-between items-center bg-secundaria-100 p-4 mb-2 rounded-lg"
          >
            <Text className="text-lg font-psemibold text-secundaria-900">
              {category.name}
            </Text>
            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() => {
                  setEditingCategory(category);
                  setEditModalVisible(true);
                }}
                className="bg-secundaria-500 p-2 rounded-lg"
              >
                <Text className="text-white">Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setCategoryToDelete(category);
                  setConfirmDeleteModalVisible(true);
                }}
                className="bg-terceira-600 p-2 rounded-lg"
              >
                <Text className="text-white">Excluir</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Modal para adicionar categoria */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-gray-500 bg-opacity-50">
          <View className="bg-white p-6 rounded-lg w-100">
            <Text className="text-xl font-bold mb-4">Nova Categoria</Text>
            <FormFieldProduct
              value={newCategory}
              handleChangeText={setNewCategory}
              placeholder="Digite o nome da categoria"
              otherStyles="p-2 mb-4"
            />
            <View className="w-max h-10 flex-row gap-2 items-center align-middle justify-between">
              <BotaoComIcone
                text="Adicionar"
                icon={icons.add}
                onPress={handleAddCategory}
                extraClassName="h-12"
              />
              <BotaoComIcone
                text="Cancelar"
                icon={icons.cancel}
                onPress={() => setModalVisible(false)}
                extraClassName="h-12"
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal para editar categoria */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-gray-500 bg-opacity-50">
          <View className="bg-white p-6 rounded-lg w-100">
            <Text className="text-xl font-bold mb-4">Editar Categoria</Text>
            <FormFieldProduct
              value={editingCategory.name}
              handleChangeText={(text) =>
                setEditingCategory((prev) => ({ ...prev, name: text }))
              }
              placeholder="Digite o novo nome da categoria"
              otherStyles="p-2 mb-4"
            />
            <View className="w-max h-10 flex-row gap-2 items-center align-middle justify-between">
              <BotaoComIcone
                text="Salvar"
                icon={icons.save}
                onPress={handleEditCategory}
              />
              <BotaoComIcone
                text="Cancelar"
                icon={icons.cancel}
                onPress={() => setEditModalVisible(false)}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal para confirmar exclusão */}
      <RNModal
        visible={confirmDeleteModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setConfirmDeleteModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-gray-500 bg-opacity-50">
          <View className="bg-white p-6 rounded-lg w-100">
            <Text className="text-xl font-bold mb-4">Confirmar Exclusão</Text>
            <Text className="mb-4">
              Tem certeza que deseja excluir esta categoria?
            </Text>
            <View className="w-max h-10 flex-row gap-2 items-center align-middle justify-between">
              <BotaoComIcone
                text="Excluir"
                icon={icons.deletar}
                onPress={handleDeleteCategory}
                extraBotaoClassName="h-12 bg-red-500"
                extraTextClassName="text-white"
                iconColor="white"
              />
              <BotaoComIcone
                text="Cancelar"
                icon={icons.cancel}
                onPress={() => setConfirmDeleteModalVisible(false)}
                extraBotaoClassName="h-12"
              />
            </View>
          </View>
        </View>
      </RNModal>
    </SafeAreaView>
  );
};

export default CategoryManagement;
