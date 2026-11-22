/**
 * ========================================================
 * UI PRESENTATION & DOM RENDERER
 * File: js/ui.js
 * ========================================================
 * Yeh file User Interface (HTML Screen) par dynamic cheezein dikhati hai:
 * - Product cards ko screen par render karna
 * - Cart drawer me items dikhana
 * - Modals open / close karna
 * - Toast alert messages show karna
 */

const UI = {
  // Currency formatter helper (₹ INR)
  formatPrice(num) {
    return '₹' + Number(num).toLocaleString('en-IN');
  },

  /**
   * Toast notification show karein
   */
  showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icon = type === 'success' 
      ? '<i class="fa-solid fa-circle-check"></i>' 
      : '<i class="fa-solid fa-triangle-exclamation"></i>';

    toast.innerHTML = `${icon} <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(20px)';
      toast.style.transition = '0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  },

  /**
   * Product cards ko render karna
   */
  renderProducts(productsList) {
    const grid = document.getElementById('productGrid');
    const noProducts = document.getElementById('noProducts');

    if (!productsList || productsList.length === 0) {
      grid.innerHTML = '';
      noProducts.style.display = 'block';
      return;
    }

    noProducts.style.display = 'none';

    grid.innerHTML = productsList.map(product => {
      const discountPercent = Math.round(
        ((product.originalPrice - product.price) / product.originalPrice) * 100
      );

      return `
        <article class="product-card" data-id="${product.id}" onclick="UI.openQuickView(${product.id})" role="button" tabindex="0">
          <div class="product-image-wrap">
            <span class="badge-discount">${discountPercent}% OFF</span>
            <img src="${product.image}" alt="${product.name}" loading="lazy">
          </div>

          <div class="product-info">
            <div class="product-category">${product.category}</div>
            <h3 class="product-title" title="${product.name}">${product.name}</h3>
            
            <div class="product-rating">
              <i class="fa-solid fa-star"></i>
              <strong>${product.rating}</strong>
              <span>(${product.reviewsCount})</span>
            </div>

            <div class="product-price-box">
              <span class="current-price">${this.formatPrice(product.price)}</span>
              <span class="original-price">${this.formatPrice(product.originalPrice)}</span>
            </div>

            <button class="btn-add-cart" onclick="event.stopPropagation(); UI.handleAddToCart(${product.id})">
              <i class="fa-solid fa-cart-plus"></i> Add to Cart
            </button>
          </div>
        </article>
      `;
    }).join('');
  },

  /**
   * Cart Drawer ke items aur totals update karna
   */
  renderCart() {
    const items = Cart.getItems();
    const totals = Cart.getTotals();

    // Badges update
    document.getElementById('cartCount').textContent = totals.totalCount;
    document.getElementById('cartDrawerCount').textContent = totals.totalCount;

    const cartContainer = document.getElementById('cartItemsContainer');
    const emptyView = document.getElementById('cartEmptyView');
    const cartFooter = document.getElementById('cartFooter');

    if (items.length === 0) {
      cartContainer.innerHTML = '';
      emptyView.style.display = 'block';
      cartFooter.style.display = 'none';
      return;
    }

    emptyView.style.display = 'none';
    cartFooter.style.display = 'block';

    // Cart items list render
    cartContainer.innerHTML = items.map(item => `
      <div class="cart-item">
        <img src="${item.image}" alt="${item.name}" class="cart-item-img">
        <div class="cart-item-details">
          <h4 class="cart-item-title">${item.name}</h4>
          <div class="cart-item-price">${this.formatPrice(item.price)}</div>
          <div class="cart-qty-ctrl">
            <button onclick="Cart.updateQuantity(${item.id}, ${item.quantity - 1})">-</button>
            <span>${item.quantity}</span>
            <button onclick="Cart.updateQuantity(${item.id}, ${item.quantity + 1})">+</button>
          </div>
        </div>
        <button class="cart-item-remove" onclick="Cart.removeItem(${item.id})" aria-label="Remove item">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </div>
    `).join('');

    // Summary numbers update
    document.getElementById('subtotalPrice').textContent = this.formatPrice(totals.subtotal);
    document.getElementById('totalPrice').textContent = this.formatPrice(totals.finalTotal);

    const discountRow = document.getElementById('discountRow');
    const discountPrice = document.getElementById('discountPrice');

    if (totals.discount > 0) {
      discountRow.style.display = 'flex';
      discountPrice.textContent = `-${this.formatPrice(totals.discount)}`;
    } else {
      discountRow.style.display = 'none';
    }
  },

  /**
   * Drawer Toggle
   */
  toggleCartDrawer(show = true) {
    const drawer = document.getElementById('cartDrawer');
    const overlay = document.getElementById('drawerOverlay');

    if (show) {
      drawer.classList.add('active');
      overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    } else {
      drawer.classList.remove('active');
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    }
  },

  /**
   * Quick View Modal open karna
   */
  openQuickView(productId) {
    const product = getProductById(productId);
    if (!product) return;

    const modal = document.getElementById('quickViewModal');
    const content = document.getElementById('quickViewContent');

    content.innerHTML = `
      <img src="${product.image}" alt="${product.name}" class="quick-view-img">
      <div class="quick-view-info">
        <span class="product-category">${product.category}</span>
        <h2>${product.name}</h2>
        <div class="product-rating">
          <i class="fa-solid fa-star"></i>
          <strong>${product.rating}</strong>
          <span>(${product.reviewsCount} verified reviews)</span>
        </div>
        <div class="product-price-box" style="margin: 0.8rem 0;">
          <span class="current-price" style="font-size: 1.5rem;">${this.formatPrice(product.price)}</span>
          <span class="original-price">${this.formatPrice(product.originalPrice)}</span>
        </div>
        <p class="quick-view-desc">${product.description}</p>
        <button class="btn btn-primary btn-block" onclick="UI.handleAddToCart(${product.id}); UI.closeModal('quickViewModal');">
          <i class="fa-solid fa-cart-plus"></i> Add to Cart Now
        </button>
      </div>
    `;

    modal.classList.add('active');
  },

  /**
   * Add to Cart helper wrapper
   */
  handleAddToCart(productId) {
    Cart.addItem(productId, 1);
    this.showToast('Item added to cart!');
  },

  /**
   * Modal close helper
   */
  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
  }
};

