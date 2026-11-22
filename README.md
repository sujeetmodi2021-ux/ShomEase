# 🛒 ShopEase - E-Commerce Website & System Design Guide

A clean, modular, and responsive E-Commerce web application built using **HTML5, CSS3, and Modern Vanilla JavaScript (MVC Architecture)**.

---

## 📂 Project Structure (Kaunsi File Kahan Hai)

```text
modi ji 1/
│
├── index.html            # Main User Interface (HTML Structure)
│
├── css/
│   └── style.css         # Styling, Layouts, Theme Variables & Responsive Design
│
├── js/
│   ├── products.js       # [Model / Data Layer] Product list & details
│   ├── cart.js           # [Business Logic / State] Cart logic, totals & localStorage
│   ├── ui.js             # [View Layer] DOM Rendering, modals & toasts
│   └── app.js            # [Controller Layer] Event listeners, search & filter engine
│
└── README.md             # Documentation & System Architecture
```

---

## 🧠 System Design (Architecture Samajhiye)

Yeh project **Separation of Concerns (MVC Pattern)** follow karta hai taaki code aapas me uljhe nahi aur aap asani se kisi bhi feature ko badal ya update kar sakein:

### 1. `products.js` (Data / Model Layer)
- **Kaam:** Ye website ka local database hai.
- Isme har product ka `id`, `name`, `category`, `price`, `rating`, aur `image` store hai.
- **Update kaise karein:** Naya product add karne ke liye bas iss array me ek naya `{ ... }` object paste kar dijiye.

### 2. `cart.js` (Business Logic / State Layer)
- **Kaam:** Calculation aur memory handle karna.
- Add to cart, quantity change (`+` / `-`), delete item, aur coupon code (`SAVE10`) ka discount calculate karta hai.
- `localStorage` ka use karta hai jisse user agar page refresh bhi kare toh cart ke items gayab nahi hote!

### 3. `ui.js` (Presentation / View Layer)
- **Kaam:** Screen par cheezein draw (render) karna.
- Products ke cards banana, cart drawer me items dikhana, checkout popup kholna/band karna, aur green alert toast show karna.

### 4. `app.js` (Controller Layer)
- **Kaam:** User ke actions ko handle karna aur baki files ko connect karna.
- Jab user search box me likhta hai ya category par click karta hai, toh `app.js` products ko filter karke `ui.js` ko bolta hai screen update karne ko.

---

## 🚀 How to Run the Website (Website Kaise Chalayein)

1. Apne folder me jaiye: `c:\Users\Lenovo\OneDrive\Desktop\modi ji 1\`
2. `index.html` par double click karein ya use Chrome / Edge / Brave browser me open karein.
3. Website turant live chalegi! Kisi bhi server ya installation ki zaroorat nahi hai.

---

## 💡 How to Update Code (Future Customizations)

- **Website ka Color badalna ho:** `css/style.css` ke top par `:root` variables (`--primary: #2563eb;`) ko apne pasand ke color code se replace karein.
- **Naye Products jodna ho:** `js/products.js` file kholiye aur `PRODUCTS` array me naya item add kar dijiye.
- **Naya Coupon Code add karna ho:** `js/cart.js` me `validCoupons` object me jaakar naya coupon (jaise `"DIWALI50": 0.50`) jod dijiye.

