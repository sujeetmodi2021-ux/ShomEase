/**
 * ========================================================
 * ADMIN DASHBOARD CONTROLLER
 * File: js/admin.js
 * ========================================================
 */

// LocalStorage helpers for Orders
const OrderStore = {
    key: "shopease_orders",
    getAll() {
        const data = localStorage.getItem(this.key);
        return data ? JSON.parse(data) : [];
    },
    clear() {
        localStorage.removeItem(this.key);
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Tab Switching & Breadcrumb Updates
    const navTabs = document.querySelectorAll('.nav-tab[data-tab]');
    const tabPanes = document.querySelectorAll('.tab-pane');

    navTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            navTabs.forEach(t => t.classList.remove('active'));
            tabPanes.forEach(p => p.classList.remove('active'));

            tab.classList.add('active');
            const targetId = tab.getAttribute('data-tab');
            const targetPane = document.getElementById(targetId);
            if (targetPane) targetPane.classList.add('active');

            // Update Breadcrumb
            const breadcrumb = document.getElementById('breadcrumbTitle');
            if (breadcrumb) {
                breadcrumb.textContent = targetId === 'productsTab' ? 'Products Inventory' : 'Orders & Billing';
            }
        });
    });

    // Sidebar Mobile Toggle
    const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
    const sidebar = document.getElementById('admincnSidebar');
    if (sidebarToggleBtn && sidebar) {
        sidebarToggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('mobile-open');
        });
    }

    // 2. Initial Data Render
    renderDashboard();

    // Fresh products sync from server
    await fetchProductsFromBackend();
    renderDashboard();

    const addModal = document.getElementById('addProductModal');
    const addProductForm = document.getElementById('addProductForm');

    // Add Product Modal Open
    document.getElementById('openAddProductModalBtn').addEventListener('click', () => {
        addProductForm.reset();
        document.getElementById('editProdId').value = '';
        const prodImg = document.getElementById('prodImage');
        const urlInp = document.getElementById('prodImageUrlInput');
        const fileInp = document.getElementById('prodImageFileInput');
        if (prodImg) prodImg.value = '';
        if (urlInp) urlInp.value = '';
        if (fileInp) fileInp.value = '';
        updateImagePreview('');
        switchImageMode('upload');
        document.getElementById('modalTitle').textContent = "Add New Product to Store";
        document.getElementById('modalSubmitBtn').textContent = "Save & Publish to Store";
        addModal.classList.add('active');
    });

    // Modal Close
    document.getElementById('closeAddProductModalBtn').addEventListener('click', () => {
        addModal.classList.remove('active');
        updateImagePreview('');
    });

    // Tab mode switcher (Upload vs URL)
    document.getElementById('tabUploadImage')?.addEventListener('click', () => switchImageMode('upload'));
    document.getElementById('tabUrlImage')?.addEventListener('click', () => switchImageMode('url'));

    // File Selector & Drop Zone setup
    const fileInput = document.getElementById('prodImageFileInput');
    const browseBtn = document.getElementById('browseFileBtn');
    const dropZone = document.getElementById('fileDropZone');

    browseBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        fileInput?.click();
    });

    dropZone?.addEventListener('click', () => {
        fileInput?.click();
    });

    fileInput?.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
            handleImageFile(e.target.files[0]);
        }
    });

    // Drag & Drop events
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone?.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.add('dragover');
        });
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone?.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.remove('dragover');
        });
    });

    dropZone?.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        if (dt && dt.files && dt.files[0]) {
            handleImageFile(dt.files[0]);
        }
    });

    // Web URL input change listener
    const urlInput = document.getElementById('prodImageUrlInput');
    if (urlInput) {
        urlInput.addEventListener('input', (e) => {
            const val = e.target.value.trim();
            const prodImgInput = document.getElementById('prodImage');
            if (prodImgInput) prodImgInput.value = val;
            updateImagePreview(val);
        });
    }

    // Clear / Remove Image button
    const btnClearImage = document.getElementById('btnClearImage');
    btnClearImage?.addEventListener('click', () => {
        const prodImg = document.getElementById('prodImage');
        const urlInp = document.getElementById('prodImageUrlInput');
        const fileInp = document.getElementById('prodImageFileInput');
        if (prodImg) prodImg.value = '';
        if (urlInp) urlInp.value = '';
        if (fileInp) fileInp.value = '';
        updateImagePreview('');
    });

    // Category Filter Chips (Support both classes)
    const categoryChips = document.querySelectorAll('.category-chip, .amz-chip');
    categoryChips.forEach(chip => {
        chip.addEventListener('click', () => {
            categoryChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            AdminFilterState.category = chip.getAttribute('data-cat') || 'all';
            renderProductsGrid();
        });
    });

    // Inventory Search Bar
    const inventorySearch = document.getElementById('adminInventorySearch');
    if (inventorySearch) {
        inventorySearch.addEventListener('input', (e) => {
            AdminFilterState.search = e.target.value.toLowerCase().trim();
            renderProductsGrid();
        });
    }

    // 4. Handle Add / Edit Product Form Submit
    addProductForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const editId = document.getElementById('editProdId').value;
        const finalImage = (document.getElementById('prodImage').value || '').trim();

        if (!finalImage) {
            alert("Please choose an image file from your device or paste an image URL!");
            return;
        }

        const productData = {
            name: document.getElementById('prodName').value.trim(),
            category: document.getElementById('prodCategory').value,
            price: Number(document.getElementById('prodPrice').value),
            originalPrice: Number(document.getElementById('prodOriginalPrice').value),
            image: finalImage,
            description: document.getElementById('prodDesc').value.trim() || "Quality assured product."
        };

        if (editId) {
            // Agar edit kar rahe hain toh UPDATE karein
            productData.id = parseInt(editId);
            await updateProduct(productData);
            alert("Product and image updated successfully!");
        } else {
            // Agar naya product hai toh SAVE karein
            productData.id = Date.now();
            productData.rating = 4.8;
            productData.reviewsCount = 1;
            productData.inStock = true;
            await saveNewProduct(productData);
            alert("New Product published successfully to your Storefront!");
        }

        // Reset & Close Modal
        addProductForm.reset();
        document.getElementById('editProdId').value = '';
        const urlInp = document.getElementById('prodImageUrlInput');
        const fileInp = document.getElementById('prodImageFileInput');
        if (urlInp) urlInp.value = '';
        if (fileInp) fileInp.value = '';
        updateImagePreview('');
        addModal.classList.remove('active');
        renderDashboard();
    });

    // 5. Clear All Orders
    document.getElementById('clearAllOrdersBtn').addEventListener('click', () => {
        if (confirm("Are you sure you want to clear all order history?")) {
            OrderStore.clear();
            renderDashboard();
        }
    });
});

// Application State for Admin Inventory Filters
const AdminFilterState = {
    category: 'all',
    search: ''
};

/**
 * Render Overview Stats, Product Cards & Orders Table (AdminCN Theme)
 */
function renderDashboard() {
    const products = getAllProducts();
    const orders = OrderStore.getAll();

    // 1. Calculate Real Business Statistics
    const totalProdEl = document.getElementById('statTotalProducts');
    const totalOrdEl = document.getElementById('statTotalOrders');
    const totalRevEl = document.getElementById('statTotalRevenue');
    const avgOrderEl = document.getElementById('statAvgOrder');

    if (totalProdEl) totalProdEl.textContent = products.length;
    if (totalOrdEl) totalOrdEl.textContent = orders.length;

    const totalRevenue = orders.reduce((sum, ord) => sum + (ord.finalTotal || 0), 0);
    if (totalRevEl) totalRevEl.textContent = '₹' + totalRevenue.toLocaleString('en-IN');

    const avgOrder = orders.length > 0 ? Math.round(totalRevenue / orders.length) : 0;
    if (avgOrderEl) avgOrderEl.textContent = '₹' + avgOrder.toLocaleString('en-IN');

    // Update Sidebar Badges
    const sideProdBadge = document.getElementById('sidebarProductBadge');
    const sideOrdBadge = document.getElementById('sidebarOrderBadge');
    if (sideProdBadge) sideProdBadge.textContent = products.length;
    if (sideOrdBadge) sideOrdBadge.textContent = orders.length;

    // 2. Render Products Grid
    renderProductsGrid();

    // 3. Render Orders Datatable
    const orderTbody = document.getElementById('adminOrdersTable');
    if (orderTbody) {
        if (orders.length === 0) {
            orderTbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:#64748b; padding: 2.5rem;">No customer orders placed yet. Orders will automatically appear here!</td></tr>`;
        } else {
            orderTbody.innerHTML = orders.map(ord => `
              <tr>
                <td><span style="font-family: monospace; font-weight: 700; color: #3b82f6; background: #eff6ff; padding: 0.2rem 0.5rem; border-radius: 4px;">#${ord.orderId}</span></td>
                <td><strong>${ord.customerName}</strong></td>
                <td><span style="color: #64748b;">${ord.customerPhone}</span></td>
                <td><small style="color: #64748b; max-width: 220px; display: block;">${ord.customerAddress}</small></td>
                <td><span style="font-size: 0.85rem;">${ord.itemsSummary}</span></td>
                <td><strong style="color: #0f172a; font-size: 0.95rem;">₹${(ord.finalTotal || 0).toLocaleString('en-IN')}</strong></td>
                <td><span class="status-badge paid"><i class="fa-solid fa-circle-check"></i> Paid</span></td>
                <td><small style="color: #94a3b8;">${ord.date}</small></td>
              </tr>
            `).join('');
        }
    }
}

/**
 * Render Products in Modern AdminCN Card View
 */
function renderProductsGrid() {
    let products = getAllProducts();

    // 1. Category Filter
    if (AdminFilterState.category !== 'all') {
        products = products.filter(p => (p.category || '').toLowerCase() === AdminFilterState.category.toLowerCase());
    }

    // 2. Search Filter (Matches Title, Category, Description & Keywords)
    if (AdminFilterState.search) {
        const q = AdminFilterState.search.toLowerCase().trim();
        products = products.filter(p => {
            const name = (p.name || '').toLowerCase();
            const cat = (p.category || '').toLowerCase();
            const desc = (p.description || '').toLowerCase();
            const kw = Array.isArray(p.keywords) 
              ? p.keywords.join(' ').toLowerCase() 
              : (p.keywords || '').toLowerCase();
            return name.includes(q) || cat.includes(q) || desc.includes(q) || kw.includes(q);
        });
    }

    // Update catalog counter
    const countElem = document.getElementById('amzCatalogCount');
    if (countElem) {
        countElem.textContent = `Showing ${products.length} product${products.length === 1 ? '' : 's'}`;
    }

    const prodContainer = document.getElementById('adminProductsContainer') || document.getElementById('adminProductsTable');
    if (!prodContainer) return;

    // Handle Empty State
    if (products.length === 0) {
        if (prodContainer.tagName === 'TBODY') {
            prodContainer.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 2rem;">No products found matching your search.</td></tr>`;
        } else {
            prodContainer.innerHTML = `
              <div class="admincn-empty-state">
                <i class="fa-solid fa-box-open"></i>
                <h3>No products found</h3>
                <p>Try searching with another keyword or change your category filter.</p>
                <button type="button" class="btn-shadcn-primary" onclick="document.getElementById('openAddProductModalBtn').click()" style="margin-top: 1rem;">
                  <i class="fa-solid fa-plus"></i> Add New Product
                </button>
              </div>`;
        }
        return;
    }

    // Fallback Table render
    if (prodContainer.tagName === 'TBODY') {
        prodContainer.innerHTML = products.map(p => `
          <tr>
            <td><img src="${p.image}" class="table-img" alt="${p.name}"></td>
            <td><strong>${p.name}</strong></td>
            <td><span style="text-transform: capitalize;">${p.category}</span></td>
            <td><strong>₹${Number(p.price).toLocaleString('en-IN')}</strong></td>
            <td><del style="color:#94a3b8">₹${Number(p.originalPrice || p.price * 1.3).toLocaleString('en-IN')}</del></td>
            <td>
              <button class="btn-edit" onclick="openEditProductModal(${p.id})">
                <i class="fa-solid fa-pen-to-square"></i> Edit
              </button>
              <button class="btn-delete" onclick="deleteProductById(${p.id})">
                <i class="fa-solid fa-trash"></i> Delete
              </button>
            </td>
          </tr>
        `).join('');
    } else {
        // Modern AdminCN Card View
        prodContainer.innerHTML = products.map(p => {
            const originalPrice = p.originalPrice || Math.round(p.price * 1.35);
            const discountPercent = originalPrice > p.price
                ? Math.round(((originalPrice - p.price) / originalPrice) * 100)
                : 20;
            const rating = p.rating || 4.5;
            const reviewsCount = p.reviewsCount || Math.floor((p.id * 19) % 240 + 38);

            return `
              <div class="admincn-product-card admin-product-card" data-id="${p.id}" data-category="${p.category}">
                <!-- Header Badge Row -->
                <div class="card-header-badge-row">
                  <span class="badge-pill-category">${p.category}</span>
                  <span class="badge-pill-stock">In Stock</span>
                </div>

                <!-- Card Image Box -->
                <div class="card-image-box admin-card-media">
                  <img src="${p.image}" alt="${p.name}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1560393464-5c69a73c5770?w=500&auto=format&fit=crop&q=80'">
                  
                  <!-- Hover Action Overlay -->
                  <div class="card-hover-overlay admin-card-actions">
                    <button type="button" class="btn-card-action btn-card-edit" onclick="openEditProductModal(${p.id})" title="Edit Product">
                      <i class="fa-solid fa-pen-to-square"></i> Edit
                    </button>
                    <button type="button" class="btn-card-action btn-card-delete" onclick="deleteProductById(${p.id})" title="Delete Product">
                      <i class="fa-solid fa-trash-can"></i> Delete
                    </button>
                  </div>
                </div>

                <!-- Card Body Details -->
                <div class="card-body-details admin-card-body">
                  <h3 class="product-item-title admin-card-title" title="${p.name}">
                    ${p.name}
                  </h3>

                  <!-- Star Rating -->
                  <div class="rating-row">
                    <div class="stars-list">
                      <i class="fa-solid fa-star"></i>
                      <i class="fa-solid fa-star"></i>
                      <i class="fa-solid fa-star"></i>
                      <i class="fa-solid fa-star"></i>
                      <i class="fa-solid fa-star-half-stroke"></i>
                    </div>
                    <span class="rating-num">${rating}</span>
                    <span class="reviews-cnt">(${reviewsCount})</span>
                  </div>

                  <!-- Price Row -->
                  <div class="price-row">
                    <span class="current-price">₹${Number(p.price).toLocaleString('en-IN')}</span>
                    ${p.originalPrice ? `<span class="original-price">₹${Number(p.originalPrice).toLocaleString('en-IN')}</span>` : ''}
                    ${discountPercent > 0 ? `<span class="discount-tag">${discountPercent}% OFF</span>` : ''}
                  </div>
                </div>
              </div>
            `;
        }).join('');
    }
}

/**
 * Delete a product by its ID
 */
async function deleteProductById(id) {
    if (confirm("Do you really want to remove this item from your website?")) {
        await removeProduct(id);
        renderDashboard();
    }
}

/**
 * Open Modal with Existing Product Data to Edit
 */
function openEditProductModal(id) {
    const product = getProductById(id);
    if (!product) return;

    // Form ke andar purana data fill karein
    document.getElementById('editProdId').value = product.id;
    document.getElementById('prodName').value = product.name;
    document.getElementById('prodCategory').value = product.category;
    document.getElementById('prodPrice').value = product.price;
    document.getElementById('prodOriginalPrice').value = product.originalPrice;
    document.getElementById('prodDesc').value = product.description || '';

    // Image data set karein
    const prodImgInput = document.getElementById('prodImage');
    if (prodImgInput) prodImgInput.value = product.image;

    const urlInput = document.getElementById('prodImageUrlInput');
    const isBase64 = product.image && product.image.startsWith('data:');
    if (urlInput) urlInput.value = isBase64 ? '' : product.image;

    // Image mode switch karein
    if (isBase64 || !product.image) {
        switchImageMode('upload');
    } else {
        switchImageMode('url');
    }

    // Selected image ka preview load karein
    updateImagePreview(product.image);

    // Title aur Button ka text badlein
    document.getElementById('modalTitle').textContent = "Edit Product Details";
    document.getElementById('modalSubmitBtn').textContent = "Update & Save Changes";

    // Modal open karein
    document.getElementById('addProductModal').classList.add('active');
}

/**
 * Switch Image Mode (Choose from Computer vs Paste URL)
 */
function switchImageMode(mode) {
    const tabUpload = document.getElementById('tabUploadImage');
    const tabUrl = document.getElementById('tabUrlImage');
    const panelUpload = document.getElementById('panelUploadImage');
    const panelUrl = document.getElementById('panelUrlImage');

    if (mode === 'upload') {
        if (tabUpload) tabUpload.classList.add('active');
        if (tabUrl) tabUrl.classList.remove('active');
        if (panelUpload) panelUpload.style.display = 'block';
        if (panelUrl) panelUrl.style.display = 'none';
    } else {
        if (tabUrl) tabUrl.classList.add('active');
        if (tabUpload) tabUpload.classList.remove('active');
        if (panelUrl) panelUrl.style.display = 'block';
        if (panelUpload) panelUpload.style.display = 'none';
    }
}

/**
 * Client-side Image Compressor (Fast, keeps storage lightweight)
 */
function compressImage(file, maxWidth = 1200, maxHeight = 1200, quality = 0.85) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                let width = img.width;
                let height = img.height;

                if (width > maxWidth || height > maxHeight) {
                    if (width > height) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    } else {
                        width = Math.round((width * maxHeight) / height);
                        height = maxHeight;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
                resolve(canvas.toDataURL(outputType, quality));
            };
            img.onerror = reject;
            img.src = event.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * Handle Image File Selection (From Local PC / Device)
 */
async function handleImageFile(file) {
    if (!file || !file.type.startsWith('image/')) {
        alert("Please select a valid image file (JPG, PNG, WEBP, GIF).");
        return;
    }

    const statusBadge = document.getElementById('previewStatus');
    if (statusBadge) {
        statusBadge.textContent = "Processing...";
        statusBadge.style.color = "#0284c7";
        statusBadge.style.background = "#e0f2fe";
    }

    try {
        const dataUrl = await compressImage(file);
        const prodImgInput = document.getElementById('prodImage');
        if (prodImgInput) prodImgInput.value = dataUrl;

        updateImagePreview(dataUrl);

        if (statusBadge) {
            const nameTrunc = file.name.length > 18 ? file.name.substring(0, 15) + '...' : file.name;
            statusBadge.textContent = `File: ${nameTrunc}`;
            statusBadge.style.color = "#10b981";
            statusBadge.style.background = "#ecfdf5";
        }
    } catch (err) {
        console.error("Image file reading error:", err);
        alert("Could not load image file. Please try another image.");
    }
}

/**
 * Update Image Preview in Add/Edit Product Modal
 */
function updateImagePreview(url) {
    const previewImg = document.getElementById('prodImagePreview');
    const placeholder = document.getElementById('imagePreviewPlaceholder');
    const statusBadge = document.getElementById('previewStatus');
    const btnClear = document.getElementById('btnClearImage');

    if (!previewImg || !placeholder) return;

    const trimmedUrl = (url || '').trim();

    if (trimmedUrl) {
        if (btnClear) btnClear.style.display = 'inline-flex';
        if (statusBadge) {
            statusBadge.textContent = "Loading...";
            statusBadge.style.color = "#0284c7";
            statusBadge.style.background = "#e0f2fe";
        }

        previewImg.onload = () => {
            previewImg.style.display = 'block';
            placeholder.style.display = 'none';
            if (statusBadge) {
                statusBadge.textContent = trimmedUrl.startsWith('data:') ? "File Selected" : "Active";
                statusBadge.style.color = "#10b981";
                statusBadge.style.background = "#ecfdf5";
            }
        };

        previewImg.onerror = () => {
            previewImg.style.display = 'none';
            placeholder.innerHTML = `
                <i class="fa-solid fa-triangle-exclamation" style="color: #ef4444; font-size: 2rem;"></i>
                <span style="color: #ef4444; font-weight: 500;">Failed to load image. Check the URL or file!</span>
            `;
            placeholder.style.display = 'flex';
            if (statusBadge) {
                statusBadge.textContent = "Error";
                statusBadge.style.color = "#ef4444";
                statusBadge.style.background = "#fee2e2";
            }
        };

        previewImg.src = trimmedUrl;
    } else {
        if (btnClear) btnClear.style.display = 'none';
        previewImg.src = '';
        previewImg.style.display = 'none';
        placeholder.innerHTML = `
            <i class="fa-regular fa-image"></i>
            <span>No image selected yet</span>
        `;
        placeholder.style.display = 'flex';
        if (statusBadge) {
            statusBadge.textContent = "No Image";
            statusBadge.style.color = "#64748b";
            statusBadge.style.background = "#f1f5f9";
        }
    }
}
