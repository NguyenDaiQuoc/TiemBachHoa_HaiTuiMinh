import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  qty: number;
  image?: string;
  variation?: string;
  slug?: string;
}

/**
 * Add item to user's cart in Firestore.
 * If item exists (same productId + variation), update quantity.
 * Otherwise append new item to items array.
 */
export async function addToCart(item: CartItem): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  const cartRef = doc(db, 'cart', user.uid);
  
  try {
    const cartSnap = await getDoc(cartRef);
    
    if (cartSnap.exists()) {
      const data = cartSnap.data();
      const items: CartItem[] = Array.isArray(data.items) ? data.items : [];
      
      // Find existing item with same productId and variation
      const existingIndex = items.findIndex(
        (i) => i.productId === item.productId && (i.variation || '') === (item.variation || '')
      );
      
      if (existingIndex >= 0) {
        // Update quantity
        items[existingIndex].qty += item.qty;
      } else {
        // Add new item
        items.push(item);
      }
      
      await setDoc(cartRef, {
        userID: user.uid,
        items,
        lastUpdated: serverTimestamp(),
      });
    } else {
      // Create new cart document
      await setDoc(cartRef, {
        userID: user.uid,
        items: [item],
        lastUpdated: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error('Error adding to cart:', error);
    throw error;
  }
}

/**
 * Remove item from cart by index
 */
export async function removeFromCart(index: number): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  const cartRef = doc(db, 'cart', user.uid);
  
  try {
    const cartSnap = await getDoc(cartRef);
    if (cartSnap.exists()) {
      const data = cartSnap.data();
      const items: CartItem[] = Array.isArray(data.items) ? data.items : [];
      items.splice(index, 1);
      
      await setDoc(cartRef, {
        userID: user.uid,
        items,
        lastUpdated: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error('Error removing from cart:', error);
    throw error;
  }
}

/**
 * Clear entire cart
 */
export async function clearCart(): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  const cartRef = doc(db, 'cart', user.uid);
  
  try {
    await setDoc(cartRef, {
      userID: user.uid,
      items: [],
      lastUpdated: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error clearing cart:', error);
    throw error;
  }
}
