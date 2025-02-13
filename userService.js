import {
  doc,
  collection,
  getDoc,
  getDocs,
  setDoc,
  runTransaction,
  updateDoc,
} from "firebase/firestore";
import { db, auth } from "@/firebaseConfig";

// Função para buscar as informações do usuário
export const getUserInfo = async (field) => {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("Usuário não está autenticado.");
  }

  const userRef = doc(db, "users", user.uid); // Referência ao documento do usuário
  const docSnap = await getDoc(userRef);

  if (docSnap.exists()) {
    return docSnap.data()[field]; // Retorna o campo solicitado
  } else {
    throw new Error("Usuário não encontrado.");
  }
};

// Função para buscar as categorias do usuário
export const getUserCategories = async () => {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("Usuário não está autenticado.");
  }

  // Referência direta à subcoleção "categories"
  const categoriesRef = collection(db, `users/${user.uid}/category`);

  try {
    const querySnapshot = await getDocs(categoriesRef);
    if (querySnapshot.empty) {
      return []; // Retorna uma lista vazia se não houver categorias
    }

    // Mapeia as categorias e retorna como uma lista
    const categories = querySnapshot.docs.map((doc) => ({
      id: doc.id, // ID do documento
      categoryId: doc.id, // Add categoryId
      ...doc.data(), // Dados do documento
      produtosVendidos: doc.data().produtosVendidos || 0, // Add produtosVendidos
      totalVendido: doc.data().totalVendido || 0, // Add totalVendido
      estado: doc.data().estado || "Ativo", // Add estado
    }));

    return categories;
  } catch (error) {
    throw new Error("Erro ao buscar as categorias: " + error.message);
  }
};

export const getUserConfig = async () => {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("Usuário não está autenticado.");
  }

  // Referência ao documento "config" dentro da subcoleção "config"
  const configDocRef = doc(db, `users/${user.uid}/config/config`);

  try {
    const configDocSnap = await getDoc(configDocRef);

    if (configDocSnap.exists()) {
      return configDocSnap.data(); // Retorna os dados do documento "config"
    } else {
      throw new Error("Documento de configuração não encontrado.");
    }
  } catch (error) {
    throw new Error(
      "Erro ao buscar o documento de configuração: " + error.message
    );
  }
};
// Função para obter o UID do usuário
export const getUserUid = async () => {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("Usuário não está autenticado.");
  }

  return user.uid;
};

export const addUserCategory = async (categoryName) => {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("Usuário não está autenticado.");
  }

  if (!categoryName.trim()) {
    throw new Error("O nome da categoria não pode estar vazio.");
  }

  // Referência à subcoleção "category"
  const categoryRef = doc(collection(db, `users/${user.uid}/category`));

  try {
    // Criação da nova categoria no Firestore
    await setDoc(categoryRef, {
      name: categoryName,
      createdAt: new Date(),
      produtosVendidos: 0, // Initialize produtosVendidos
      totalVendido: 0, // Initialize totalVendido
      estado: "Ativo", // Initialize estado
    });

    return {
      id: categoryRef.id, // Retorna o ID do documento criado
      name: categoryName,
    };
  } catch (error) {
    throw new Error("Erro ao adicionar a categoria: " + error.message);
  }
};

// Função para atualizar o contador de pedidos
export const updateOrderCounter = async () => {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("Usuário não está autenticado.");
  }

  // Referência ao contador de pedidos
  const counterRef = doc(
    collection(db, `users/${user.uid}/counter/orderCounter`)
  );

  try {
    const counterSnap = await getDoc(counterRef);

    if (counterSnap.exists()) {
      const currentCount = counterSnap.data().count || 0;
      await setDoc(counterRef, { count: currentCount + 1 });
      return currentCount + 1;
    } else {
      await setDoc(counterRef, { count: 1 });
      return 1;
    }
  } catch (error) {
    throw new Error(
      "Erro ao atualizar o contador de pedidos: " + error.message
    );
  }
};

// Função para atualizar as vendas da categoria e dashboard
export const updateCategorySales = async (items) => {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("Usuário não está autenticado.");
  }

  try {
    for (const item of items) {
      const categoryRef = doc(
        db,
        `users/${user.uid}/category/${item.categoryId}`
      );

      await runTransaction(db, async (transaction) => {
        const categoryDoc = await transaction.get(categoryRef);
        if (!categoryDoc.exists()) {
          throw new Error("Categoria não encontrada.");
        }

        // Garante que os valores são números
        const quantity = parseInt(item.quantity) || 0;
        const price = parseFloat(item.value) || 0;
        const existingProdutosVendidos =
          parseInt(categoryDoc.data().produtosVendidos) || 0;
        const existingTotalVendido =
          parseFloat(categoryDoc.data().totalVendido) || 0;

        const newProdutosVendidos = existingProdutosVendidos + quantity;
        const newTotalVendido = existingTotalVendido + price * quantity;

        transaction.update(categoryRef, {
          produtosVendidos: newProdutosVendidos,
          totalVendido: newTotalVendido,
        });
      });

      // Update dashboard
      const currentDate = new Date();
      const monthYear = `${
        currentDate.getMonth() + 1
      }-${currentDate.getFullYear()}`;
      const day = currentDate.getDate();
      const dashboardRef = doc(db, `users/${user.uid}/dashboard/${monthYear}`);

      await runTransaction(db, async (transaction) => {
        const dashboardDoc = await transaction.get(dashboardRef);
        const quantity = parseInt(item.quantity) || 0;
        const price = parseFloat(item.value) || 0;
        const total = price * quantity;

        if (!dashboardDoc.exists()) {
          const newDashboardData = {};
          newDashboardData[day] = {
            quantidade: quantity,
            total: total,
          };
          transaction.set(dashboardRef, newDashboardData);
        } else {
          const dashboardData = dashboardDoc.data();
          if (!dashboardData[day]) {
            dashboardData[day] = {
              quantidade: quantity,
              total: total,
            };
          } else {
            const existingQuantidade =
              parseInt(dashboardData[day].quantidade) || 0;
            const existingTotal = parseFloat(dashboardData[day].total) || 0;
            dashboardData[day].quantidade = existingQuantidade + quantity;
            dashboardData[day].total = existingTotal + total;
          }
          transaction.update(dashboardRef, dashboardData);
        }
      });
    }
  } catch (error) {
    console.error("Erro ao atualizar vendas da categoria:", error.message);
    throw new Error("Erro ao atualizar vendas da categoria: " + error.message);
  }
};

// Função para reverter as vendas da categoria e dashboard
export const reverseCategorySales = async (items) => {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("Usuário não está autenticado.");
  }

  try {
    for (const item of items) {
      const categoryRef = doc(
        db,
        `users/${user.uid}/category/${item.categoryId}`
      );

      await runTransaction(db, async (transaction) => {
        const categoryDoc = await transaction.get(categoryRef);

        if (!categoryDoc.exists()) {
          throw new Error("Categoria não encontrada.");
        }

        const newProdutosVendidos =
          (categoryDoc.data().produtosVendidos || 0) - item.quantity;
        const newTotalVendido =
          (categoryDoc.data().totalVendido || 0) - item.value * item.quantity;

        transaction.update(categoryRef, {
          produtosVendidos: newProdutosVendidos,
          totalVendido: newTotalVendido,
        });
      });

      // Update dashboard
      const currentDate = new Date();
      const monthYear = `${
        currentDate.getMonth() + 1
      }-${currentDate.getFullYear()}`;
      const day = currentDate.getDate();
      const dashboardRef = doc(db, `users/${user.uid}/dashboard/${monthYear}`);

      await runTransaction(db, async (transaction) => {
        const dashboardDoc = await transaction.get(dashboardRef);

        if (!dashboardDoc.exists()) {
          throw new Error("Dashboard não encontrado.");
        } else {
          const dashboardData = dashboardDoc.data();
          if (dashboardData[day]) {
            dashboardData[day].quantidade -= item.quantity;
            dashboardData[day].total -= item.value * item.quantity;
            transaction.update(dashboardRef, dashboardData);
          }
        }
      });
    }
  } catch (error) {
    throw new Error("Erro ao reverter vendas da categoria: " + error.message);
  }
};
