/**
 * ========================================================
 * SHOPPING CART STATE & BUSINESS LOGIC
 * File: js/cart.js
 * ========================================================
 * Yeh file Cart ke saare operations ko handle karti hai:
 * - LocalStorage me cart items ko save & retrieve karna
 * - Item add karna, quantity badhana/kam karna, item delete karna
 * - Discount coupon code calculate karna (e.g. SAVE10)
 * - Subtotal aur Total calculation
 */

const Cart = {
  storageKey: "shopease_cart",
  appliedCoupon: null,

  // Available valid discount coupons
  validCoupons: {
    "SAVE10": 0.10, // 10% Flat Discount
    "FLAT20": 0.20  // 20% Flat Discount
  },

  /**
   * LocalStorage se cart retrieve karein
   */
  getItems() {
    const data = localStorage.getItem(this.storageKey);
    return data ? JSON.parse(data) : [];
  },

  /**
   * LocalStorage me cart save karein
   */
  saveItems(items) {
    localStorage.setItem(this.storageKey, JSON.stringify(items));
    // Trigger custom event so UI can automatically re-render
    window.dispatchEvent(new CustomEvent("cartUpdated"));
  },

  /**
   * Cart me item add karein
   */
  addItem(productId, quantity = 1) {
    const product = getProductById(productId);
    if (!product) return false;

    let items = this.getItems();
    const existingIndex = items.findIndex(item => item.id === product.id);

    if (existingIndex > -1) {
      items[existingIndex].quantity += quantity;
    } else {
      items.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity: quantity
      });
    }

    this.saveItems(items);
    return true;
  },

  /**
   * Cart se item remove karein
   */
  removeItem(productId) {
    let items = this.getItems();
    items = items.filter(item => item.id !== parseInt(productId));
    this.saveItems(items);
  },

  /**
   * Item ki quantity change karein (+ ya -)
   */
  updateQuantity(productId, newQty) {
    let items = this.getItems();
    const index = items.findIndex(item => item.id === parseInt(productId));

    if (index > -1) {
      if (newQty <= 0) {
        items.splice(index, 1);
      } else {
        items[index].quantity = newQty;
      }
      this.saveItems(items);
    }
  },

  /**
   * Cart ko poora empty karein (e.g., checkout ke baad)
   */
  clear() {
    this.appliedCoupon = null;
    this.saveItems([]);
  },

  /**
   * Coupon apply karein
   */
  applyCoupon(couponCode) {
    const code = couponCode.trim().toUpperCase();
    if (this.validCoupons[code]) {
      this.appliedCoupon = {
        code: code,
        discountRate: this.validCoupons[code]
      };
      window.dispatchEvent(new CustomEvent("cartUpdated"));
      return { success: true, message: `Coupon ${code} applied successfully!` };
    } else {
      return { success: false, message: "Invalid coupon code. Try SAVE10" };
    }
  },

  /**
   * Cart ke totals (Subtotal, Discount, Final Total, Item Count) calculate karein
   */
  getTotals() {
    const items = this.getItems();
    const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    let discount = 0;
    if (this.appliedCoupon && subtotal > 0) {
      discount = Math.round(subtotal * this.appliedCoupon.discountRate);
    }

    const finalTotal = subtotal - discount;

    return {
      totalCount,
      subtotal,
      discount,
      finalTotal,
      coupon: this.appliedCoupon
    };
  }
};

