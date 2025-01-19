import { ref, set, onValue } from "firebase/database";
import { rtdb } from "@/firebaseConfig";

export const NotificationService = {
  // Envia notificação de que um novo pedido foi criado
  sendOrderCreatedNotification: async () => {
    const refreshRef = ref(rtdb, "notifications/orders");
    await set(refreshRef, {
      type: "NEW_ORDER",
      timestamp: new Date().toISOString(),
      status: "PENDING_REFRESH",
    });
  },

  // Confirma que o refresh foi realizado
  confirmOrderRefresh: async () => {
    const refreshRef = ref(rtdb, "notifications/orders");
    await set(refreshRef, {
      type: "REFRESH_COMPLETED",
      timestamp: new Date().toISOString(),
      status: "COMPLETED",
    });
  },

  // Assina as notificações de pedidos
  subscribeToOrderNotifications: (onNotification) => {
    const notificationsRef = ref(rtdb, "notifications/orders");
    return onValue(notificationsRef, (snapshot) => {
      if (snapshot.exists()) {
        const notification = snapshot.val();
        onNotification(notification);
      }
    });
  },
};
