/**
 * ========================================================
 * PRODUCTS DATA LAYER (Model)
 * File: js/products.js
 * ========================================================
 */

const PRODUCTS = [
  {
    id: 1793453283790,
    name: "shendel",
    category: "footwear",
    price: 1499,
    originalPrice: 1999,
    image: "https://i.pinimg.com/1200x/03/f5/e6/03f5e67dcd56193641b8d52932093ca4.jpg",
    description: "its a good product and vealu for many",
    rating: 4.8,
    reviewsCount: 1,
    inStock: true
  },
  {
    id: 1793453012998,
    name: "Women's Summer New Fashion Stilettos Sandals, Anti-Slip Elegant French Style",
    category: "footwear",
    price: 1599,
    originalPrice: 1999,
    image: "https://i.pinimg.com/1200x/03/f5/e6/03f5e67dcd56193641b8d52932093ca4.jpg",
    description: "its a vealu for many",
    rating: 4.8,
    reviewsCount: 1,
    inStock: true
  },
  {
    id: 1,
    name: "Wireless Noise-Canceling Headphones",
    category: "electronics",
    price: 3499,
    originalPrice: 4999,
    rating: 4.8,
    reviewsCount: 142,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80",
    description: "Premium over-ear wireless headphones with active noise cancellation, 40-hour battery life, and crystal-clear sound quality for music & calls.",
    inStock: true
  },
  {
    id: 2,
    name: "Classic Smart Fitness Watch",
    category: "electronics",
    price: 2199,
    originalPrice: 3999,
    rating: 4.5,
    reviewsCount: 89,
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80",
    description: "Sleek AMOLED display smartwatch with heart rate monitoring, sleep tracker, SPO2 sensor, and up to 10 days of battery life.",
    inStock: true
  },
  {
    id: 3,
    name: "Men's Slim Fit Casual Denim Jacket",
    category: "fashion",
    price: 1899,
    originalPrice: 2999,
    rating: 4.6,
    reviewsCount: 65,
    image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80",
    description: "100% pure cotton breathable denim jacket designed for casual everyday streetwear and all-season layering.",
    inStock: true
  },
  {
    id: 4,
    name: "Women's Oversized Cotton Hoodie",
    category: "fashion",
    price: 1499,
    originalPrice: 2299,
    rating: 4.7,
    reviewsCount: 110,
    image: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&auto=format&fit=crop&q=80",
    description: "Ultra-soft fleece lined aesthetic hoodie with kangaroo pockets and premium ribbed cuffs. Perfect for winter comfort.",
    inStock: true
  },
  {
    id: 5,
    name: "Ultra-Light Performance Running Shoes",
    category: "footwear",
    price: 2799,
    originalPrice: 4299,
    rating: 4.9,
    reviewsCount: 220,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80",
    description: "High-cushion responsive running sneakers with breathable mesh upper and anti-slip rubber outsole for maximum grip.",
    inStock: true
  },
  {
    id: 6,
    name: "Classic Leather Formal Oxford Shoes",
    category: "footwear",
    price: 3299,
    originalPrice: 4999,
    rating: 4.4,
    reviewsCount: 47,
    image: "https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=600&auto=format&fit=crop&q=80",
    description: "Handcrafted genuine leather formal shoes offering supreme arch support, memory foam insole, and polished finish.",
    inStock: true
  },
  {
    id: 7,
    name: "Minimalist Polarized Sunglasses",
    category: "accessories",
    price: 999,
    originalPrice: 1999,
    rating: 4.3,
    reviewsCount: 78,
    image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600&auto=format&fit=crop&q=80",
    description: "UV400 protection polarized lenses with lightweight titanium frame. Shields your eyes with effortless style.",
    inStock: true
  },
  {
    id: 8,
    name: "Water-Resistant Laptop Backpack (25L)",
    category: "accessories",
    price: 1599,
    originalPrice: 2499,
    rating: 4.7,
    reviewsCount: 190,
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80",
    description: "Ergonomic travel backpack with padded 15.6 inch laptop compartment, built-in USB charging port, and anti-theft hidden pockets.",
    inStock: true
  }
];

// ========================================================
// DATABASE & SYNC HELPERS (Offline + Backend Connected)
// ========================================================
const PRODUCTS_KEY = "shopease_products_db";
const API_URL = "/api";

// Initialize cachedProducts from localStorage, fallback to PRODUCTS
let cachedProducts = (() => {
  try {
    const saved = localStorage.getItem(PRODUCTS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  return [...PRODUCTS];
})();

// LocalStorage sync helper
function syncLocalStorage() {
  try {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(cachedProducts));
  } catch (e) {}
}

// 1. Backend Server se fresh products fetch karna
async function fetchProductsFromBackend() {
  try {
    const res = await fetch(`${API_URL}/products`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        cachedProducts = data;
        syncLocalStorage();
      }
    }
  } catch (err) {
    console.warn("Backend server not reachable, using saved data.");
  }
  return cachedProducts;
}

function getAllProducts() {
  return cachedProducts;
}

// 2. Naya product save karna (LocalStorage + Backend)
async function saveNewProduct(newProd) {
  cachedProducts.unshift(newProd);
  syncLocalStorage();

  try {
    const res = await fetch(`${API_URL}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newProd)
    });
    if (res.ok) {
      const data = await res.json();
      if (data.product) {
        cachedProducts[0] = data.product;
        syncLocalStorage();
      }
    }
  } catch (err) {
    console.warn("Saved locally, server offline.");
  }
}

// 3. Product delete karna (LocalStorage + Backend)
async function removeProduct(id) {
  cachedProducts = cachedProducts.filter(p => p.id !== parseInt(id));
  syncLocalStorage();

  try {
    await fetch(`${API_URL}/products/${id}`, { method: 'DELETE' });
  } catch (err) {
    console.warn("Deleted locally, server offline.");
  }
}

// 4. Product update karna (LocalStorage + Backend)
async function updateProduct(updatedProd) {
  const idx = cachedProducts.findIndex(p => p.id === parseInt(updatedProd.id));
  if (idx > -1) {
    cachedProducts[idx] = { ...cachedProducts[idx], ...updatedProd };
    syncLocalStorage();
  }

  try {
    const res = await fetch(`${API_URL}/products/${updatedProd.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedProd)
    });
    if (res.ok) {
      const data = await res.json();
      if (data.product && idx > -1) {
        cachedProducts[idx] = data.product;
        syncLocalStorage();
      }
    }
  } catch (err) {
    console.warn("Updated locally, server offline.");
  }
}

// 5. Product ID se item dhoondna
function getProductById(id) {
  return cachedProducts.find(p => p.id === parseInt(id));
}
