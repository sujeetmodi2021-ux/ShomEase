/**
 * ========================================================
 * MAIN CONTROLLER & APPLICATION BOOTSTRAP
 * File: js/app.js
 * ========================================================
 * Yeh file pure system ka "Controller" hai:
 * - Search, Filter, Sort ko coordinate karti hai
 * - Event listeners attach karti hai (buttons, form submit, etc.)
 * - App start hone par initial render execute karti hai
 */

// Application State
const AppState = {
  currentCategory: 'all',
  searchQuery: '',
  sortBy: 'featured'
};

// Filter & Sort Engine
function getFilteredProducts() {
  let list = getAllProducts();

  // 1. Search Query Filter (Matches Keywords, Product Name, Category & Description)
  if (AppState.searchQuery.trim() !== '') {
    const rawQ = AppState.searchQuery.toLowerCase().trim();
    const queryTokens = rawQ.split(/\s+/).filter(t => t.length > 0);

    list = list.filter(p => {
      const name = (p.name || '').toLowerCase();
      const desc = (p.description || '').toLowerCase();
      const cat = (p.category || '').toLowerCase();
      const kw = Array.isArray(p.keywords)
        ? p.keywords.join(' ').toLowerCase()
        : (p.keywords || '').toLowerCase();

      const combined = `${name} ${cat} ${desc} ${kw}`;

      // Check full phrase match or all space-separated tokens match
      if (combined.includes(rawQ)) return true;
      return queryTokens.every(tok => combined.includes(tok));
    });
  }

  // 2. Category Filter (Apply if not 'all' and list has matches)
  if (AppState.currentCategory !== 'all') {
    const catFiltered = list.filter(p => (p.category || '').toLowerCase() === AppState.currentCategory.toLowerCase());
    // If search had results, but not in current category, prefer search results
    if (catFiltered.length > 0 || AppState.searchQuery.trim() === '') {
      list = catFiltered;
    }
  }

  // 3. Sorting
  if (AppState.sortBy === 'price-low') {
    list.sort((a, b) => a.price - b.price);
  } else if (AppState.sortBy === 'price-high') {
    list.sort((a, b) => b.price - a.price);
  } else if (AppState.sortBy === 'rating') {
    list.sort((a, b) => b.rating - a.rating);
  }

  return list;
}

// Refresh Product Grid
function refreshProducts() {
  const filtered = getFilteredProducts();
  UI.renderProducts(filtered);
}

// ================= EVENT LISTENERS SETUP =================
document.addEventListener('DOMContentLoaded', async () => {
  // Initial Renders
  refreshProducts();
  UI.renderCart();

  // Fresh sync from backend database
  await fetchProductsFromBackend();
  refreshProducts();

  // Listen to Cart changes (via custom event)
  window.addEventListener('cartUpdated', () => {
    UI.renderCart();
  });

  // 1. Search Bar Inputs (Desktop & Mobile)
  const searchInput = document.getElementById('searchInput');
  const mobileSearchInput = document.getElementById('mobileSearchInput');
  const mobileSearchToggleBtn = document.getElementById('mobileSearchToggleBtn');
  const mobileSearchBar = document.getElementById('mobileSearchBar');
  const mobileSearchCloseBtn = document.getElementById('mobileSearchCloseBtn');

  // Desktop Suggestions Elements
  const desktopSearchSuggestions = document.getElementById('desktopSearchSuggestions');
  const desktopSuggestionsList = document.getElementById('desktopSuggestionsList');

  // Search keyword chips click handler
  function handleKeywordChipClick(keyword) {
    if (!keyword) return;
    AppState.searchQuery = keyword;

    if (searchInput) searchInput.value = keyword;
    if (mobileSearchInput) mobileSearchInput.value = keyword;

    // Reset category chip UI to 'all' so all matches are visible
    AppState.currentCategory = 'all';
    const catChips = document.getElementById('categoryChips');
    if (catChips) {
      catChips.querySelectorAll('.category-btn').forEach(b => {
        b.classList.toggle('active', b.getAttribute('data-category') === 'all');
      });
    }

    // Highlight active chip
    document.querySelectorAll('.search-keyword-chip').forEach(c => {
      c.classList.toggle('active', c.getAttribute('data-keyword').toLowerCase() === keyword.toLowerCase());
    });

    if (desktopSearchSuggestions) desktopSearchSuggestions.style.display = 'none';

    refreshProducts();

    // Smooth scroll down to products section
    const prodSection = document.getElementById('products-section');
    if (prodSection) {
      prodSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  // Update suggestions dropdown list based on typed query
  function updateSuggestionsList(query) {
    if (!desktopSuggestionsList) return;
    const q = (query || '').toLowerCase().trim();
    if (!q) {
      desktopSuggestionsList.style.display = 'none';
      desktopSuggestionsList.innerHTML = '';
      return;
    }

    const allProds = getAllProducts();
    const matched = allProds.filter(p => {
      const name = (p.name || '').toLowerCase();
      const kw = Array.isArray(p.keywords) ? p.keywords.join(' ').toLowerCase() : '';
      return name.includes(q) || kw.includes(q);
    }).slice(0, 5);

    if (matched.length > 0) {
      desktopSuggestionsList.style.display = 'flex';
      desktopSuggestionsList.innerHTML = matched.map(p => `
        <div class="suggestion-item" data-name="${p.name}">
          <span><i class="fa-solid fa-magnifying-glass" style="font-size:0.75rem; color:var(--text-muted); margin-right:6px;"></i> ${p.name}</span>
          <span class="item-cat">${p.category}</span>
        </div>
      `).join('');

      desktopSuggestionsList.querySelectorAll('.suggestion-item').forEach(item => {
        item.addEventListener('click', () => {
          const name = item.getAttribute('data-name');
          handleKeywordChipClick(name);
        });
      });
    } else {
      desktopSuggestionsList.style.display = 'none';
      desktopSuggestionsList.innerHTML = '';
    }
  }

  // Delegate clicks on all search keyword chips
  document.addEventListener('click', (e) => {
    const chip = e.target.closest('.search-keyword-chip');
    if (chip) {
      const kw = chip.getAttribute('data-keyword');
      handleKeywordChipClick(kw);
      return;
    }

    // Close desktop suggestions if clicked outside
    const desktopSearchBox = document.getElementById('desktopSearchBox');
    if (desktopSearchBox && !desktopSearchBox.contains(e.target)) {
      if (desktopSearchSuggestions) desktopSearchSuggestions.style.display = 'none';
    }
  });

  // Desktop search input events
  if (searchInput) {
    searchInput.addEventListener('focus', () => {
      if (desktopSearchSuggestions) {
        desktopSearchSuggestions.style.display = 'block';
        updateSuggestionsList(searchInput.value);
      }
    });

    searchInput.addEventListener('input', (e) => {
      AppState.searchQuery = e.target.value;
      if (mobileSearchInput) mobileSearchInput.value = e.target.value;
      updateSuggestionsList(e.target.value);
      refreshProducts();
    });
  }

  // Mobile search input events
  if (mobileSearchInput) {
    mobileSearchInput.addEventListener('input', (e) => {
      AppState.searchQuery = e.target.value;
      if (searchInput) searchInput.value = e.target.value;
      refreshProducts();
    });
  }

  // Mobile search drawer toggle
  if (mobileSearchToggleBtn && mobileSearchBar) {
    mobileSearchToggleBtn.addEventListener('click', () => {
      mobileSearchBar.classList.toggle('active');
      if (mobileSearchBar.classList.contains('active') && mobileSearchInput) {
        mobileSearchInput.focus();
      }
    });
  }

  // Mobile search drawer close
  if (mobileSearchCloseBtn && mobileSearchBar) {
    mobileSearchCloseBtn.addEventListener('click', () => {
      mobileSearchBar.classList.remove('active');
      if (mobileSearchInput) mobileSearchInput.value = '';
      if (searchInput) searchInput.value = '';
      AppState.searchQuery = '';
      refreshProducts();
    });
  }

  // Dynamic typing placeholder animation
  const placeholderKeywords = [
    'Wireless Headphones',
    'Smart Fitness Watch',
    'Women\'s Stilettos Sandals',
    'Running Shoes',
    'Denim Jacket',
    'Laptop Backpack',
    'Polarized Sunglasses',
    'Cotton Hoodie',
    'Formal Leather Shoes'
  ];

  let currentPlaceholderIndex = 0;
  setInterval(() => {
    const activeEl = document.activeElement;
    if (activeEl === searchInput || activeEl === mobileSearchInput) return;

    currentPlaceholderIndex = (currentPlaceholderIndex + 1) % placeholderKeywords.length;
    const kw = placeholderKeywords[currentPlaceholderIndex];
    const text = `Search for "${kw}"...`;

    if (searchInput) searchInput.placeholder = text;
    if (mobileSearchInput) mobileSearchInput.placeholder = text;
  }, 2800);

  // 2. Category Filter Buttons
  const categoryChips = document.getElementById('categoryChips');
  categoryChips.addEventListener('click', (e) => {
    if (e.target.classList.contains('category-btn')) {
      // Remove active class from all buttons
      categoryChips.querySelectorAll('.category-btn').forEach(btn => btn.classList.remove('active'));

      // Activate clicked button
      e.target.classList.add('active');
      AppState.currentCategory = e.target.getAttribute('data-category');
      refreshProducts();
    }
  });

  // 3. Sort Select Dropdown
  const sortSelect = document.getElementById('sortSelect');
  sortSelect.addEventListener('change', (e) => {
    AppState.sortBy = e.target.value;
    refreshProducts();
  });

  // 4. Cart Drawer Controls
  const cartToggleBtn = document.getElementById('cartToggleBtn');
  const closeCartBtn = document.getElementById('closeCartBtn');
  const drawerOverlay = document.getElementById('drawerOverlay');
  const startShoppingBtn = document.getElementById('startShoppingBtn');

  cartToggleBtn.addEventListener('click', () => UI.toggleCartDrawer(true));
  closeCartBtn.addEventListener('click', () => UI.toggleCartDrawer(false));
  drawerOverlay.addEventListener('click', () => UI.toggleCartDrawer(false));
  if (startShoppingBtn) {
    startShoppingBtn.addEventListener('click', () => UI.toggleCartDrawer(false));
  }

  // 5. Coupon Apply
  const applyCouponBtn = document.getElementById('applyCouponBtn');
  const couponInput = document.getElementById('couponInput');
  const couponMessage = document.getElementById('couponMessage');

  applyCouponBtn.addEventListener('click', () => {
    const code = couponInput.value;
    if (!code) {
      couponMessage.textContent = "Please enter a coupon code.";
      couponMessage.className = "coupon-message error";
      return;
    }

    const result = Cart.applyCoupon(code);
    couponMessage.textContent = result.message;
    couponMessage.className = `coupon-message ${result.success ? 'success' : 'error'}`;
  });

  // 6. Checkout Flow
  const proceedCheckoutBtn = document.getElementById('proceedCheckoutBtn');
  const checkoutModal = document.getElementById('checkoutModal');
  const closeCheckoutBtn = document.getElementById('closeCheckoutBtn');
  const checkoutForm = document.getElementById('checkoutForm');
  const checkoutFinalTotal = document.getElementById('checkoutFinalTotal');

  proceedCheckoutBtn.addEventListener('click', () => {
    const totals = Cart.getTotals();
    if (totals.totalCount === 0) {
      UI.showToast("Your cart is empty!", "danger");
      return;
    }
    // Set total inside modal
    checkoutFinalTotal.textContent = UI.formatPrice(totals.finalTotal);
    UI.toggleCartDrawer(false);
    checkoutModal.classList.add('active');
  });

  closeCheckoutBtn.addEventListener('click', () => {
    checkoutModal.classList.remove('active');
  });

  // 7. Checkout Form Submit (Place Order, WhatsApp & Save to Admin)
  checkoutForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // 1. Customer Details retrieve karein
    const name = document.getElementById('custName').value;
    const phone = document.getElementById('custPhone').value;
    const address = document.getElementById('custAddress').value;
    const payment = document.querySelector('input[name="payment"]:checked').value;

    const cartItems = Cart.getItems();
    const totals = Cart.getTotals();
    const randomOrderId = '#ORD-' + Math.floor(1000 + Math.random() * 9000);

    // 2. Admin & Customer ke liye Order Save karein
    const curUser = typeof Auth !== 'undefined' ? Auth.getCurrentUser() : null;
    const orderData = {
      orderId: randomOrderId,
      customerName: name,
      customerEmail: curUser ? curUser.email : '',
      customerPhone: phone,
      customerAddress: address,
      paymentMethod: payment,
      itemsSummary: cartItems.map(i => `${i.name} (x${i.quantity})`).join(', '),
      subtotal: totals.subtotal,
      discount: totals.discount,
      finalTotal: totals.finalTotal,
      date: new Date().toLocaleDateString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    };

    const existingOrders = JSON.parse(localStorage.getItem('shopease_orders') || '[]');
    existingOrders.unshift(orderData);
    localStorage.setItem('shopease_orders', JSON.stringify(existingOrders));

    // Server database par sync karein
    fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderData)
    }).catch(() => console.warn("Saved locally, server offline."));

    // 3. WhatsApp Message Format karein
    let itemsText = cartItems.map(item => `• ${item.name} (x${item.quantity}) - ₹${item.price * item.quantity}`).join('\n');

    let waMessage = `🛍️ *NEW ORDER RECEIVED - ${randomOrderId}*\n\n` +
      `👤 *Customer Name:* ${name}\n` +
      `📞 *Phone:* ${phone}\n` +
      `📍 *Address:* ${address}\n` +
      `💳 *Payment Mode:* ${payment}\n\n` +
      `📦 *Items Ordered:*\n${itemsText}\n\n` +
      `💰 *Subtotal:* ₹${totals.subtotal}\n` +
      (totals.discount > 0 ? `🎟️ *Discount:* -₹${totals.discount}\n` : '') +
      `💵 *Final Total:* ₹${totals.finalTotal}\n\n` +
      `Thank you for shopping with ShopEase!`;

    // 4. Apna WhatsApp Number (Bina + ke)
    const storeWhatsAppNumber = "919876543210";
    const whatsappUrl = `https://wa.me/${storeWhatsAppNumber}?text=${encodeURIComponent(waMessage)}`;

    // WhatsApp open karein
    window.open(whatsappUrl, '_blank');

    // 5. Form Reset & Cart Clear karein
    document.getElementById('orderIdText').textContent = randomOrderId;
    checkoutForm.reset();
    Cart.clear();

    checkoutModal.classList.remove('active');
    document.getElementById('orderSuccessModal').classList.add('active');
  });

  // 8. Order Success & Quick View Close Buttons
  document.getElementById('continueShoppingBtn').addEventListener('click', () => {
    document.getElementById('orderSuccessModal').classList.remove('active');
  });

  document.getElementById('closeQuickViewBtn').addEventListener('click', () => {
    UI.closeModal('quickViewModal');
  });

  // 9. My Orders & Profile Modal Close Buttons
  const closeOrdersBtn = document.getElementById('closeMyOrdersBtn');
  if (closeOrdersBtn) {
    closeOrdersBtn.addEventListener('click', () => {
      UI.closeModal('myOrdersModal');
    });
  }

  const closeProfileBtn = document.getElementById('closeMyProfileBtn');
  if (closeProfileBtn) {
    closeProfileBtn.addEventListener('click', () => {
      UI.closeModal('myProfileModal');
    });
  }

  // 10. Profile Update Form Submit
  const profileForm = document.getElementById('profileUpdateForm');
  if (profileForm) {
    profileForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('profName').value;
      const phone = document.getElementById('profPhone').value;
      const address = document.getElementById('profAddress').value;

      const res = await Auth.updateProfile({ name, phone, address });
      if (res.success) {
        UI.showToast("Account details updated successfully!");
        UI.closeModal('myProfileModal');

        // Update greeting in navbar
        const userPill = document.querySelector('.user-pill-btn span');
        if (userPill) userPill.textContent = `Hi, ${res.user.name.split(' ')[0]}`;

        // Also update checkout fields
        const nameField = document.getElementById('custName');
        const phoneField = document.getElementById('custPhone');
        const addressField = document.getElementById('custAddress');
        if (nameField) nameField.value = res.user.name;
        if (phoneField) phoneField.value = res.user.phone;
        if (addressField && res.user.address) addressField.value = res.user.address;
      }
    });
  }

  // Close modals on clicking backdrop
  window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
      e.target.classList.remove('active');
    }
  });
});

/**
 * Render Customer Orders in Modal
 */
async function openCustomerOrdersModal() {
  const modal = document.getElementById('myOrdersModal');
  const container = document.getElementById('customerOrdersContainer');
  if (!modal || !container) return;

  modal.classList.add('active');
  container.innerHTML = `
    <div style="text-align:center; padding:2rem; color:var(--text-muted);">
      <i class="fa-solid fa-spinner fa-spin" style="font-size:2rem; margin-bottom:0.75rem;"></i>
      <p>Fetching your orders...</p>
    </div>
  `;

  const orders = await Auth.getCustomerOrders();

  if (orders.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding:3rem 1rem; color:var(--text-muted);">
        <i class="fa-solid fa-box-open" style="font-size:3.5rem; opacity:0.3; margin-bottom:1rem;"></i>
        <h3>No Orders Yet</h3>
        <p>You haven't placed any orders with this account yet.</p>
        <button class="btn btn-primary" onclick="UI.closeModal('myOrdersModal')" style="margin-top:1rem;">
          Start Shopping
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = orders.map(ord => `
    <div class="order-history-card">
      <div class="order-card-header">
        <div>
          <strong style="color:var(--text-main); font-size:1.05rem;">${ord.orderId}</strong>
          <div style="font-size:0.8rem; color:var(--text-muted); margin-top:2px;">
            <i class="fa-regular fa-clock"></i> ${ord.date}
          </div>
        </div>
        <span class="order-status-badge">
          <i class="fa-solid fa-circle-check"></i> Order Confirmed
        </span>
      </div>

      <div class="order-items-text">
        <strong>Items Ordered:</strong> ${ord.itemsSummary}
      </div>

      <div class="order-card-footer">
        <div>
          <i class="fa-solid fa-location-dot" style="color:var(--primary); margin-right:4px;"></i>
          <small>${ord.customerAddress}</small>
        </div>
        <div class="order-total-price">
          ₹${Number(ord.finalTotal).toLocaleString('en-IN')}
        </div>
      </div>
    </div>
  `).join('');
}

/**
 * Open Customer Profile Details Modal
 */
function openCustomerProfileModal() {
  const user = Auth.getCurrentUser();
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  document.getElementById('profName').value = user.name || '';
  document.getElementById('profEmail').value = user.email || '';
  document.getElementById('profPhone').value = user.phone || '';
  document.getElementById('profAddress').value = user.address || '';
  document.getElementById('profRole').value = user.role || 'customer';

  document.getElementById('myProfileModal').classList.add('active');
}

