// Estrutura do documento de agregação para categoria
interface CategoryAggregation {
  totalSales: number;
  totalRevenue: number;
  percentageOfTotal: number;
  topProducts: {
    byQuantity: {
      productId: string;
      name: string;
      quantity: number;
    }[];
    byProfit: {
      productId: string;
      name: string;
      profit: number;
    }[];
  };
  lastUpdated: Timestamp;
}

// Função para atualizar agregações quando uma venda é realizada
async function updateCategoryAggregations(
  userId: string,
  sale: Sale,
  db: Firestore
) {
  const batch = db.batch();

  // Agrupar itens por categoria
  const categorySales = sale.items.reduce((acc, item) => {
    if (!acc[item.categoryId]) {
      acc[item.categoryId] = {
        quantity: 0,
        revenue: 0,
        products: new Map(),
      };
    }

    acc[item.categoryId].quantity += item.quantity;
    acc[item.categoryId].revenue += item.value * item.quantity;

    // Atualizar dados do produto
    const productStats = acc[item.categoryId].products.get(item.productId) || {
      quantity: 0,
      revenue: 0,
      cost: 0,
      name: item.productName,
    };

    productStats.quantity += item.quantity;
    productStats.revenue += item.value * item.quantity;
    productStats.cost += item.cost * item.quantity;

    acc[item.categoryId].products.set(item.productId, productStats);

    return acc;
  }, {});

  // Buscar agregações existentes
  const aggregationsRef = collection(
    db,
    `users/${userId}/categoryAggregations`
  );

  for (const [categoryId, stats] of Object.entries(categorySales)) {
    const categoryRef = doc(aggregationsRef, categoryId);
    const categoryDoc = await getDoc(categoryRef);
    const currentData = (categoryDoc.data() as CategoryAggregation) || {
      totalSales: 0,
      totalRevenue: 0,
      topProducts: {
        byQuantity: [],
        byProfit: [],
      },
    };

    // Atualizar totais
    const newData = {
      totalSales: currentData.totalSales + stats.quantity,
      totalRevenue: currentData.totalRevenue + stats.revenue,
      lastUpdated: Timestamp.now(),
      topProducts: {
        byQuantity: updateTopProducts(
          currentData.topProducts.byQuantity,
          Array.from(stats.products.entries()),
          "quantity"
        ),
        byProfit: updateTopProducts(
          currentData.topProducts.byProfit,
          Array.from(stats.products.entries()),
          "profit"
        ),
      },
    };

    batch.set(categoryRef, newData, { merge: true });
  }

  // Atualizar percentagens do total
  const totalRevenue = Object.values(categorySales).reduce(
    (acc, stats) => acc + stats.revenue,
    0
  );

  const percentageUpdates = Object.keys(categorySales).map(
    async (categoryId) => {
      const categoryRef = doc(aggregationsRef, categoryId);
      const categoryDoc = await getDoc(categoryRef);
      const data = categoryDoc.data();

      batch.update(categoryRef, {
        percentageOfTotal: (data.totalRevenue / totalRevenue) * 100,
      });
    }
  );

  await Promise.all(percentageUpdates);
  await batch.commit();
}

// Função auxiliar para atualizar top produtos
function updateTopProducts(
  currentTop: any[],
  newProducts: [string, any][],
  metric: "quantity" | "profit"
): any[] {
  const updatedProducts = [...currentTop];

  newProducts.forEach(([productId, stats]) => {
    const value =
      metric === "quantity" ? stats.quantity : stats.revenue - stats.cost;

    const existingIndex = updatedProducts.findIndex(
      (p) => p.productId === productId
    );

    if (existingIndex >= 0) {
      updatedProducts[existingIndex] = {
        productId,
        name: stats.name,
        [metric]: updatedProducts[existingIndex][metric] + value,
      };
    } else {
      updatedProducts.push({
        productId,
        name: stats.name,
        [metric]: value,
      });
    }
  });

  // Ordenar e manter apenas top 5
  return updatedProducts.sort((a, b) => b[metric] - a[metric]).slice(0, 5);
}

// Função para buscar dados agregados de uma categoria
async function getCategoryAggregation(
  userId: string,
  categoryId: string,
  db: Firestore
): Promise<CategoryAggregation> {
  const docRef = doc(db, `users/${userId}/categoryAggregations/${categoryId}`);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    throw new Error("Agregação não encontrada para esta categoria");
  }

  return docSnap.data() as CategoryAggregation;
}
