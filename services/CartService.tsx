import AsyncStorage from "@react-native-async-storage/async-storage";
import { ICartItem } from "@/types/types";

export class CartService {
  private static CART_KEY = "@cart_items";

  static async getItems(): Promise<ICartItem[]> {
    const items = await AsyncStorage.getItem(this.CART_KEY);
    return items ? JSON.parse(items) : [];
  }

  static async addItem(item: ICartItem): Promise<void> {
    const items = await this.getItems();
    const existingItem = items.find((i) => i.id === item.id);

    if (existingItem) {
      existingItem.quantity += item.quantity;
    } else {
      items.push(item);
    }

    await AsyncStorage.setItem(this.CART_KEY, JSON.stringify(items));
  }

  static async updateItem(
    itemId: string,
    updates: Partial<ICartItem>
  ): Promise<void> {
    const items = await this.getItems();
    const index = items.findIndex((i) => i.id === itemId);

    if (index !== -1) {
      items[index] = { ...items[index], ...updates };
      await AsyncStorage.setItem(this.CART_KEY, JSON.stringify(items));
    }
  }

  static async removeItem(itemId: string): Promise<void> {
    const items = await this.getItems();
    const filtered = items.filter((i) => i.id !== itemId);
    await AsyncStorage.setItem(this.CART_KEY, JSON.stringify(filtered));
  }

  static async clearCart(): Promise<void> {
    await AsyncStorage.removeItem(this.CART_KEY);
  }

  static async getItemCount(): Promise<number> {
    const items = await this.getItems();
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }
}
