import { collection, addDoc, getDocs, Timestamp } from "firebase/firestore";
import { db, auth } from "@/firebaseConfig";

// Função para verificar se o usuário está autenticado
const ensureAuthenticated = () => {
  const userId = auth.currentUser?.uid;
  if (!userId) {
    throw new Error("Usuário não autenticado.");
  }
  return userId;
};

// Função para adicionar um novo produto
export const addProduct = async (
  title,
  description,
  value,
  custo,
  category,
  date,
  imageUrl,
  codeBar,
  selectedColor,
  isVariablePrice
) => {
  try {
    const userId = ensureAuthenticated();

    const productsRef = collection(db, "users", userId, "products");
    const newProduct = {
      title,
      description,
      value,
      custo,
      category,
      date: Timestamp.fromDate(new Date()),
      imageUrl,
      codeBar,
      backgroundColor: selectedColor || null,
      isVariablePrice,
    };

    await addDoc(productsRef, newProduct);
  } catch (error) {
    console.error("Erro ao adicionar o produto:", error.message);
  }
};

// Função para obter os produtos do usuário
export const getUserProducts = async () => {
  const userId = ensureAuthenticated();

  const productsRef = collection(db, `users/${userId}/products`);

  try {
    const querySnapshot = await getDocs(productsRef);

    if (querySnapshot.empty) {
      return [];
    }

    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        value: parseFloat(data.value || "0"),
        custo: parseFloat(data.custo || "0"),
        categoryId: data.category, // Ensure categoryId is set correctly
      };
    });
  } catch (error) {
    throw new Error("Erro ao buscar produtos: " + error.message);
  }
};
