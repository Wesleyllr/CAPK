import { collection, getDocs } from "firebase/firestore";
import { db, auth } from "@/firebaseConfig";

export const fetchCategories = async (userId: string) => {
  const categoriesRef = collection(db, `users/${userId}/category`);
  const categoriesSnapshot = await getDocs(categoriesRef);
  const categoriesMap = {};
  categoriesSnapshot.docs.forEach((doc) => {
    categoriesMap[doc.id] = doc.data().name;
  });
  return categoriesMap;
};

export const fetchProducts = async (userId: string) => {
  const productsRef = collection(db, `users/${userId}/products`);
  const productsSnapshot = await getDocs(productsRef);
  const productsMap = {};
  productsSnapshot.docs.forEach((doc) => {
    const data = doc.data();
    productsMap[doc.id] = {
      title: data.title,
      categoryId: data.category,
      value: parseFloat(data.value || 0),
    };
  });
  return productsMap;
};

export const fetchSales = async (userId: string) => {
  const vendasRef = collection(db, `orders/${userId}/vendas`);
  const vendasSnapshot = await getDocs(vendasRef);
  return vendasSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};
