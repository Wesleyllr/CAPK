import { Sale, Product, Category, DashboardData } from "@/types/types";

// Helper function to convert object to array if needed
const ensureArray = <T,>(data: T[] | Record<string, T>): T[] => {
  if (!data) return [];
  return Array.isArray(data)
    ? data
    : Object.entries(data).map(([id, value]) => ({
        ...value,
        id,
      }));
};

// Updated function to handle both array and object inputs
export const createProductsMap = (
  products: Product[] | Record<string, Product>
): Record<string, Product> => {
  const productsArray = ensureArray(products);
  return productsArray.reduce((acc, product) => {
    if (product && product.id) {
      acc[product.id] = product;
    }
    return acc;
  }, {} as Record<string, Product>);
};

// Updated function to handle both array and object inputs
export const createCategoriesMap = (
  categories: Category[] | Record<string, Category>
): Record<string, Category> => {
  const categoriesArray = ensureArray(categories);
  return categoriesArray.reduce((acc, category) => {
    if (category && category.id) {
      acc[category.id] = category;
    }
    return acc;
  }, {} as Record<string, Category>);
};

const compareByYearDesc = (a, b) => {
  return (
    b.createdAt.toDate().getFullYear() - a.createdAt.toDate().getFullYear()
  );
};

interface ProcessedData {
  dashboardData: DashboardData;
  overallSales: Sale[];
}

export const processSalesData = (
  sales: Sale[],
  products: Record<string, Product>,
  categories: Record<string, Category>
): ProcessedData => {
  // Filtra vendas completadas
  const completedSales = sales.filter((sale) => sale.status === "completed");

  // Calcula métricas básicas
  const faturamentoTotal = completedSales.reduce(
    (acc, sale) => acc + sale.total,
    0
  );
  const pedidosPendentes = sales.filter(
    (sale) => sale.status === "pending"
  ).length;

  // Inicializa contadores
  const produtosContagem: Record<string, number> = {};
  const categoriasContagem: Record<string, number> = {};
  const categoriasTotais: Record<string, number> = {};

  // Processa todas as vendas completadas
  completedSales.forEach((sale) => {
    sale.items.forEach((item) => {
      const product = products[item.id];
      if (!product) return;

      // Contagem de produtos
      const productTitle = product.title;
      produtosContagem[productTitle] =
        (produtosContagem[productTitle] || 0) + item.quantity;

      // Contagem de categorias
      const category = categories[product.categoryId];
      if (category) {
        const categoryName = category.name;
        categoriasContagem[categoryName] =
          (categoriasContagem[categoryName] || 0) + item.quantity;

        // Soma valores totais por categoria
        const itemTotal = item.value * item.quantity;
        categoriasTotais[categoryName] =
          (categoriasTotais[categoryName] || 0) + itemTotal;
      }
    });
  });

  // Converte e ordena produtos mais vendidos
  const produtosMaisVendidos = Object.entries(produtosContagem)
    .map(([title, quantidade]) => ({
      title,
      quantidade,
    }))
    .sort((a, b) => b.quantidade - a.quantidade)
    .slice(0, 5);

  // Converte e ordena categorias mais vendidas
  const categoriasMaisVendidas = Object.entries(categoriasContagem)
    .map(([name, quantidade]) => ({
      name,
      quantidade,
      valorTotal: categoriasTotais[name] || 0,
    }))
    .sort((a, b) => b.quantidade - a.quantidade)
    .slice(0, 5);

  // Agrupa vendas por mês
  const vendasPorMes = completedSales.reduce((acc, sale) => {
    const data = sale.createdAt.toDate();
    const mes = data.toLocaleString("pt-BR", { month: "short" });

    const existingMonth = acc.find((item) => item.mes === mes);
    if (existingMonth) {
      existingMonth.total += sale.total;
    } else {
      acc.push({ mes, total: sale.total });
    }
    return acc;
  }, [] as Array<{ mes: string; total: number }>);

  // Agrupa vendas gerais por data
  const overallSales = completedSales.reduce((acc, sale) => {
    const data = sale.createdAt.toDate();
    const date = data.toLocaleDateString("pt-BR");

    const existingDate = acc.find((item) => item.date === date);
    if (existingDate) {
      existingDate.total += sale.total;
      existingDate.items.push(...sale.items);
    } else {
      acc.push({
        date,
        total: sale.total,
        items: [...sale.items],
        createdAt: sale.createdAt,
        status: sale.status,
        id: sale.id,
        userId: sale.userId,
      });
    }
    return acc;
  }, [] as Sale[]);

  // Ordena vendas por data, do mais recente para o mais antigo
  overallSales.sort(compareByYearDesc);

  return {
    dashboardData: {
      totalVendas: completedSales.length,
      faturamentoTotal,
      pedidosPendentes,
      produtosMaisVendidos,
      categoriasMaisVendidas,
      vendasPorMes,
    },
    overallSales,
  };
};
