import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/CardComponents";

const BestSellingProducts = ({ produtosMaisVendidos }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Produtos Mais Vendidos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {produtosMaisVendidos.map((produto, index) => (
            <div key={index} className="flex justify-between items-center">
              <span className="font-medium">{produto.title}</span>
              <span className="text-gray-600">
                {produto.quantidade} unidades
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default BestSellingProducts;
