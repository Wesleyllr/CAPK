import { useState, useEffect } from 'react';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { db, auth } from '@/firebaseConfig';
import { DashboardData, Sale, Product, Category } from '@/types/types';
import { fetchCategories, fetchProducts, fetchSales } from '@/services/firebaseService';
import { createCategoriesMap, createProductsMap, processSalesData } from '@/utils/processSalesData';

export const useDashboardData = () => {
  const [salesData, setSalesData] = useState<DashboardData>({
    totalVendas: 0,
    faturamentoTotal: 0,
    pedidosPendentes: 0,
    produtosMaisVendidos: [],
    categoriasMaisVendidas: [],
    vendasPorMes: [],
  });
  const [overallSalesData, setOverallSalesData] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        throw new Error('Usuário não autenticado');
      }

      setIsLoading(true);
      setError(null);

      // Fetch data and add type checking
      const categories = await fetchCategories(userId);
      const products = await fetchProducts(userId);
      console.log('Fetched products:', products);
      console.log('Is array?', Array.isArray(products));
      console.log('Length:', products.length);
      const sales = await fetchSales(userId);

      // Validate fetched data
      if (!Array.isArray(categories)) {
        throw new Error('Categorias inválidas: dados devem ser um array');
      }
      
      if (!Array.isArray(products)) {
        throw new Error('Produtos inválidos: dados devem ser um array');
      }
      
      if (!Array.isArray(sales)) {
        throw new Error('Vendas inválidas: dados devem ser um array');
      }

      // Create maps with validation
      const categoriesMap = categories.length > 0 ? createCategoriesMap(categories) : new Map();
      const productsMap = products.length > 0 ? createProductsMap(products) : new Map();

      // Process data with additional error handling
      const processedData = processSalesData(sales, productsMap, categoriesMap);

      console.log("Dashboard Data - Categories:", categories.length);
      console.log("Dashboard Data - Products:", products.length);
      console.log("Dashboard Data - Sales:", sales.length);
      
      setSalesData(processedData.dashboardData);
      setOverallSalesData(processedData.overallSales);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao buscar dados';
      setError(errorMessage);
      console.error('Erro ao buscar dados do dashboard:', error);
      
      // Set default states in case of error
      setSalesData({
        totalVendas: 0,
        faturamentoTotal: 0,
        pedidosPendentes: 0,
        produtosMaisVendidos: [],
        categoriasMaisVendidas: [],
        vendasPorMes: [],
      });
      setOverallSalesData([]);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = () => {
    fetchDashboardData();
  };

  return { salesData, overallSalesData, isLoading, error, refreshData };
};