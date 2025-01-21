import { Sale, Product, Category, DashboardData } from '@/types/types';

export const createCategoriesMap = (categories: Category[]) => {
  const categoriesMap: { [key: string]: string } = {};
  categories.forEach(category => {
    categoriesMap[category.id] = category.name;
  });
  return categoriesMap;
};

export const createProductsMap = (products: Product[]) => {
  const productsMap: { [key: string]: Product } = {};
  products.forEach(product => {
    productsMap[product.id] = product;
  });
  return productsMap;
};

export const processSalesData = (sales: Sale[], productsMap: { [key: string]: Product }, categoriesMap: { [key: string]: string }) => {
  const dashboardData: DashboardData = {
    totalVendas: 0,
    faturamentoTotal: 0,
    pedidosPendentes: 0,
    produtosMaisVendidos: [],
    categoriasMaisVendidas: [],
    vendasPorMes: [],
    salesMetrics: [],
    orders: [],
    revenueMetrics: [],
  };

  const categoriasContagem: { [key: string]: number } = {};
  const categoriasTotais: { [key: string]: number } = {};

  sales.forEach(sale => {
    if (sale.status === 'completed') {
      dashboardData.totalVendas += 1;
      dashboardData.faturamentoTotal += sale.total;

      sale.items.forEach(item => {
        const product = productsMap[item.id];
        if (product) {
          const categoryName = categoriesMap[product.categoryId];
          if (categoryName) {
            categoriasContagem[categoryName] = (categoriasContagem[categoryName] || 0) + item.quantity;
            categoriasTotais[categoryName] = (categoriasTotais[categoryName] || 0) + (item.quantity * product.value);
          }
        }
      });
    } else if (sale.status === 'pending') {
      dashboardData.pedidosPendentes += 1;
    }
  });

  dashboardData.categoriasMaisVendidas = Object.keys(categoriasContagem).map(categoryName => ({
    name: categoryName,
    quantidade: categoriasContagem[categoryName],
    valorTotal: categoriasTotais[categoryName],
  })).sort((a, b) => b.quantidade - a.quantidade);

  return { dashboardData, overallSales: sales };
};
