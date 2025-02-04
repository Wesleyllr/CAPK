import React, { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db, auth } from "@/firebaseConfig";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/CardComponents";
import { View, Text } from "react-native";
import { alertaPersonalizado } from "@/utils/alertaPersonalizado";

const CategoryProductsReport = ({ categoryId }) => {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        alertaPersonalizado({
          message: "Erro",
          description: "Usuário não autenticado",
          type: "danger",
        });
        return;
      }

      const productsRef = collection(db, `users/${userId}/products`);
      const q = query(productsRef, where("category", "==", categoryId));
      const querySnapshot = await getDocs(q);

      const productsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setProducts(productsData);
    };

    fetchProducts();
  }, [categoryId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Relatório de Produtos Vendidos</CardTitle>
      </CardHeader>
      <CardContent>
        <View>
          <Text>Categoria: {categoryId}</Text>
          <table border="1" className="w-full mt-4">
            <thead>
              <tr>
                <th>Title</th>
                <th>Description</th>
                <th>Value</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td>{product.title}</td>
                  <td>{product.description}</td>
                  <td>{product.value}</td>
                  <td>
                    {new Date(product.date.seconds * 1000).toLocaleDateString(
                      "pt-BR"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </View>
      </CardContent>
    </Card>
  );
};

export default CategoryProductsReport;
