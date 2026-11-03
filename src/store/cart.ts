import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { StoreProduct } from "@/types/product";
import {
  canIncreaseQuantity,
  getMaxPurchasableQuantity,
} from "@/shared/cart";
import {
  calculateCartTotals,
  getFinalUnitPrice,
  priceLine,
  type CartTotals,
} from "@/shared/pricing";

export interface CartItem {
  product: StoreProduct;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  addItem: (product: StoreProduct) => void;
  removeItem: (productId: string) => void;
  deleteCartProduct: (productId: string) => void;
  resetCart: () => void;
  getTotalPrice: () => number;
  getSubTotalPrice: () => number;
  getDiscountAmount: () => number;
  getTotals: () => CartTotals;
  getItemCount: (productId: string) => number;
  getGroupedItem: () => CartItem[];
}

const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product) =>
        set((state) => {
          if (getMaxPurchasableQuantity(product) <= 0) {
            return state;
          }

          const existingItem = state.items.find(
            (item) => item.product._id === product._id,
          );

          if (existingItem) {
            if (!canIncreaseQuantity(product, existingItem.quantity)) {
              return state;
            }
            return {
              items: state.items.map((item) =>
                item.product._id === product._id
                  ? { ...item, quantity: item.quantity + 1 }
                  : item,
              ),
            };
          }

          return {
            items: [
              ...state.items,
              {
                product,
                quantity: 1,
              },
            ],
          };
        }),
      removeItem: (productId) =>
        set((state) => ({
          items: state.items.reduce((acc, item) => {
            if (item.product._id === productId) {
              if (item.quantity > 1) {
                acc.push({ ...item, quantity: item.quantity - 1 });
              }
            } else {
              acc.push(item);
            }
            return acc;
          }, [] as CartItem[]),
        })),
      deleteCartProduct: (productId) =>
        set((state) => ({
          items: state.items.filter(
            ({ product }) => product?._id !== productId,
          ),
        })),
      resetCart: () => set({ items: [] }),
      getTotals: () => {
        const lines = get().items.map((item) =>
          priceLine(
            item.product.price ?? 0,
            item.product.discount,
            item.quantity,
          ),
        );
        return calculateCartTotals(lines);
      },
      getTotalPrice: () => get().getTotals().total,
      getSubTotalPrice: () => get().getTotals().subtotal,
      getDiscountAmount: () => get().getTotals().discount,
      getItemCount: (productId) => {
        const item = get().items.find((item) => item.product._id === productId);
        return item ? item.quantity : 0;
      },
      getGroupedItem: () => get().items,
    }),
    {
      name: "cart-store",
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<CartState> | undefined;
        const items = Array.isArray(persisted?.items)
          ? persisted.items.filter(
              (item): item is CartItem =>
                Boolean(item?.product?._id) &&
                Number.isInteger(item?.quantity) &&
                item.quantity > 0,
            )
          : [];

        return { ...currentState, items };
      },
    },
  ),
);

export function getCartUnitPrice(item: CartItem): number {
  return getFinalUnitPrice(item.product.price, item.product.discount);
}

export default useCartStore;
