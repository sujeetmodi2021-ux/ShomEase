/**
 * ========================================================
 * SHOPEASE BACKEND REST API SERVER
 * File: server.js
 * ========================================================
 * Yeh file hamari E-Commerce website ka Central Backend Server hai.
 * Yeh Node.js aur Express par chalta hai aur port 5000 par listen karta hai.
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors()); // Kisi bhi frontend se API request allow karein
app.use(express.json({ limit: '50mb' })); // Support base64 image uploads & large payloads
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 1. Force root URL '/' to ALWAYS serve index.html (Storefront Main Website)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.use(express.static(path.join(__dirname))); // Frontend static files serve karein (index.html, admin.html, etc.)

// Database File Paths
const PRODUCTS_FILE = path.join(__dirname, 'data', 'products.json');
const USERS_FILE = path.join(__dirname, 'data', 'users.json');
const ORDERS_FILE = path.join(__dirname, 'data', 'orders.json');

// Helper Functions to Read/Write Database
function readData(filePath) {
  try {
    if (!fs.existsSync(filePath)) return [];
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content || '[]');
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
    return [];
  }
}

function writeData(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
    return false;
  }
}

// ========================================================
// 1. PRODUCTS REST APIs
// ========================================================

// [GET] Sabhi products fetch karein
app.get('/api/products', (req, res) => {
  const products = readData(PRODUCTS_FILE);
  res.json(products);
});

// [POST] Naya product add karein (Admin)
app.post('/api/products', (req, res) => {
  const products = readData(PRODUCTS_FILE);
  const newProduct = {
    id: Date.now(),
    name: req.body.name,
    category: req.body.category,
    price: Number(req.body.price),
    originalPrice: Number(req.body.originalPrice),
    image: req.body.image,
    description: req.body.description || "Quality assured product.",
    rating: req.body.rating || 4.8,
    reviewsCount: req.body.reviewsCount || 1,
    inStock: true
  };

  products.unshift(newProduct);
  writeData(PRODUCTS_FILE, products);
  res.status(201).json({ success: true, product: newProduct });
});

// [PUT] Existing product ko edit/update karein (Admin)
app.put('/api/products/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const products = readData(PRODUCTS_FILE);
  const index = products.findIndex(p => p.id === id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  products[index] = {
    ...products[index],
    ...req.body,
    id: id // ID change nahi honi chahiye
  };

  writeData(PRODUCTS_FILE, products);
  res.json({ success: true, product: products[index] });
});

// [DELETE] Product ko remove karein (Admin)
app.delete('/api/products/:id', (req, res) => {
  const id = parseInt(req.params.id);
  let products = readData(PRODUCTS_FILE);
  const initialLength = products.length;

  products = products.filter(p => p.id !== id);

  if (products.length === initialLength) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  writeData(PRODUCTS_FILE, products);
  res.json({ success: true, message: 'Product deleted successfully' });
});

// ========================================================
// 2. AUTHENTICATION APIs (Login & Signup)
// ========================================================

// [POST] Customer Register karein
app.post('/api/auth/register', (req, res) => {
  const { name, email, phone, password } = req.body;
  const cleanEmail = email.trim().toLowerCase();
  const users = readData(USERS_FILE);

  if (cleanEmail === 'admin@shopease.com') {
    return res.status(400).json({ success: false, message: 'This email is reserved for Admin.' });
  }

  if (users.some(u => u.email === cleanEmail)) {
    return res.status(400).json({ success: false, message: 'Account with this email already exists!' });
  }

  const newUser = {
    id: Date.now(),
    name: name.trim(),
    email: cleanEmail,
    phone: phone.trim(),
    password: password,
    role: 'customer'
  };

  users.push(newUser);
  writeData(USERS_FILE, users);

  res.status(201).json({
    success: true,
    user: { name: newUser.name, email: newUser.email, phone: newUser.phone, role: newUser.role }
  });
});

// [POST] Customer / Admin Login karein
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const cleanEmail = email.trim().toLowerCase();
  const users = readData(USERS_FILE);

  const user = users.find(u => u.email === cleanEmail && u.password === password);

  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid email or password!' });
  }

  res.json({
    success: true,
    user: { name: user.name, email: user.email, phone: user.phone, role: user.role }
  });
});

// [PUT] Customer Profile Update karein
app.put('/api/auth/profile', (req, res) => {
  const { email, name, phone, address } = req.body;
  const cleanEmail = (email || '').trim().toLowerCase();
  const users = readData(USERS_FILE);
  const userIndex = users.findIndex(u => u.email === cleanEmail);

  if (userIndex === -1) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  if (name) users[userIndex].name = name.trim();
  if (phone) users[userIndex].phone = phone.trim();
  if (address) users[userIndex].address = address.trim();

  writeData(USERS_FILE, users);

  res.json({
    success: true,
    user: {
      name: users[userIndex].name,
      email: users[userIndex].email,
      phone: users[userIndex].phone,
      address: users[userIndex].address || '',
      role: users[userIndex].role
    }
  });
});

// ========================================================
// 3. ORDERS & BILLING APIs
// ========================================================

// [GET] Sabhi customer orders fetch karein (Admin)
app.get('/api/orders', (req, res) => {
  const orders = readData(ORDERS_FILE);
  res.json(orders);
});

// [POST] Naya customer order & bill save karein
app.post('/api/orders', (req, res) => {
  const orders = readData(ORDERS_FILE);
  const newOrder = {
    id: Date.now(),
    orderId: req.body.orderId || ('#ORD-' + Math.floor(1000 + Math.random() * 9000)),
    customerName: req.body.customerName,
    customerEmail: req.body.customerEmail || '',
    customerPhone: req.body.customerPhone,
    customerAddress: req.body.customerAddress,
    paymentMethod: req.body.paymentMethod,
    itemsSummary: req.body.itemsSummary,
    subtotal: Number(req.body.subtotal),
    discount: Number(req.body.discount || 0),
    finalTotal: Number(req.body.finalTotal),
    date: new Date().toLocaleDateString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  };

  orders.unshift(newOrder);
  writeData(ORDERS_FILE, orders);
  res.status(201).json({ success: true, order: newOrder });
});

// [DELETE] Sabhi orders clear karein (Admin)
app.delete('/api/orders', (req, res) => {
  writeData(ORDERS_FILE, []);
  res.json({ success: true, message: 'All orders cleared' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🚀 ShopEase Backend Server running on port ${PORT}`);
  console.log(`👉 Storefront URL:  http://localhost:${PORT}`);
  console.log(`👉 Admin Panel URL: http://localhost:${PORT}/admin.html`);
  console.log(`===============================================`);
});

