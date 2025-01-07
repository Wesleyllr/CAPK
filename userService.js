import { doc, collection, getDoc, getDocs, setDoc } from "firebase/firestore";
import { db, auth } from "@/firebaseConfig"; // Importando o Firestore e o Auth

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
      ...doc.data(), // Dados do documento
    }));

    return categories;
  } catch (error) {
    throw new Error("Erro ao buscar as categorias: " + error.message);
  }
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
    });

    return {
      id: categoryRef.id, // Retorna o ID do documento criado
      name: categoryName,
    };
  } catch (error) {
    throw new Error("Erro ao adicionar a categoria: " + error.message);
  }
};
