// global.js
const apiUrl = 'https://dakshas-artistry-backend-production.up.railway.app/api';

// ─────────────────────────────────────────
//  1. UI: DRAWERS & TOASTS
// ─────────────────────────────────────────
window.openCart = function() {
    const drawer = document.getElementById('cartDrawer');
    const overlay = document.getElementById('drawerOverlay');
    if(drawer) drawer.classList.add('open');
    if(overlay) overlay.classList.add('open');
};

window.closeCart = function() {
    const drawer = document.getElementById('cartDrawer');
    const overlay = document.getElementById('drawerOverlay');
    if(drawer) drawer.classList.remove('open');
    if(overlay) overlay.classList.remove('open');
};

window.openWishlist = function() {
    const drawer = document.getElementById('wishlistDrawer');
    const overlay = document.getElementById('drawerOverlay');
    if(drawer) drawer.classList.add('open');
    if(overlay) overlay.classList.add('open');
};

window.closeWishlist = function() {
    const drawer = document.getElementById('wishlistDrawer');
    const overlay = document.getElementById('drawerOverlay');
    if(drawer) drawer.classList.remove('open');
    if(overlay) overlay.classList.remove('open');
};

window.closeAllDrawers = function() {
    window.closeCart();
    window.closeWishlist();
};

let toastTimer;
window.showGlobalToast = function(msg) {
    const t = document.getElementById('toast');
    if (!t) return;
    document.getElementById('toastMsg').innerHTML = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 3200);
};

// ─────────────────────────────────────────
//  2. ADD TO DATABASE (CART & WISHLIST)
// ─────────────────────────────────────────
window.addToCart = async function(productId, qty = 1) {
    const token = localStorage.getItem('customerToken');
    if (!token) {
        showGlobalToast("Please sign in to add items.");
        setTimeout(() => window.location.href = 'login.html', 1500);
        return;
    }
    try {
        const res = await fetch(`${apiUrl}/cart`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ product_id: productId, qty: qty })
        });
        if (res.ok) {
            showGlobalToast("Added to your bag ✦");
            syncGlobalState();
        }
    } catch (err) {
        console.error("Cart addition failed", err);
    }
};

window.toggleWishlist = async function(productId) {
    const token = localStorage.getItem('customerToken');
    if (!token) {
        showGlobalToast("Please sign in to save favorites.");
        setTimeout(() => window.location.href = 'login.html', 1500);
        return;
    }
    try {
        // Check database to see if we should Add or Remove
        const checkRes = await fetch(`${apiUrl}/wishlist`, { headers: { 'Authorization': `Bearer ${token}` } });
        const currentWishlist = await checkRes.json();
        const exists = currentWishlist.some(item => item.id === productId);

        if (exists) {
            await fetch(`${apiUrl}/wishlist/${productId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
            showGlobalToast("Removed from wishlist.");
        } else {
            await fetch(`${apiUrl}/wishlist`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ product_id: productId })
            });
            showGlobalToast("Saved to wishlist ♥");
        }
        syncGlobalState();
    } catch (err) {
        console.error("Wishlist addition failed", err);
    }
};

// Wrappers to prevent clicks on buttons from accidentally triggering links
window.handleAddCart = function(e, productId) {
    e.preventDefault();
    e.stopPropagation();
    window.addToCart(productId, 1);
};

window.handleToggleWishlist = function(e, productId) {
    e.preventDefault();
    e.stopPropagation();
    
    // Optimistic UI update (turns heart red instantly)
    const btn = e.currentTarget;
    btn.classList.toggle('wishlisted');
    const icon = btn.querySelector('i');
    if (btn.classList.contains('wishlisted')) {
        icon.classList.remove('fa-regular');
        icon.classList.add('fa-solid');
    } else {
        icon.classList.remove('fa-solid');
        icon.classList.add('fa-regular');
    }
    
    window.toggleWishlist(productId);
};

// ─────────────────────────────────────────
//  3. REMOVE FROM DATABASE
// ─────────────────────────────────────────
window.removeCartItem = async function(productId) {
    const token = localStorage.getItem('customerToken');
    if (!token) return;
    try {
        await fetch(`${apiUrl}/cart/${productId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
        showGlobalToast("Item removed from bag.");
        syncGlobalState();
    } catch (err) {}
};

window.removeWishlistItem = async function(productId) {
    const token = localStorage.getItem('customerToken');
    if (!token) return;
    try {
        await fetch(`${apiUrl}/wishlist/${productId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
        showGlobalToast("Removed from wishlist.");
        syncGlobalState();
    } catch (err) {}
};

window.moveToCart = async function(productId) {
    const token = localStorage.getItem('customerToken');
    if (!token) return;
    try {
        await fetch(`${apiUrl}/cart`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ product_id: productId, qty: 1 })
        });
        await fetch(`${apiUrl}/wishlist/${productId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
        showGlobalToast("Moved to your bag ✦");
        syncGlobalState(); 
    } catch (err) {}
};

// ─────────────────────────────────────────
//  4. FETCH & RENDER UI DRAWERS
// ─────────────────────────────────────────
window.syncGlobalState = async function() {
    const token = localStorage.getItem('customerToken');
    if (!token) return;

    try {
        // --- CART ---
        const cartRes = await fetch(`${apiUrl}/cart`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (cartRes.ok) {
            const cartItems = await cartRes.json();
            const totalQty = cartItems.reduce((sum, item) => sum + item.qty, 0);
            
            document.querySelectorAll('.cart-counter-badge').forEach(badge => {
                badge.innerText = totalQty;
                badge.classList.toggle('visible', totalQty > 0);
                badge.style.display = ''; 
            });

            const cartContainer = document.getElementById('cartItems');
            const cartFooter = document.getElementById('cartFooter');
            if (cartContainer && cartFooter) {
                if (cartItems.length === 0) {
                    cartContainer.innerHTML = '<div class="drawer-empty"><i class="fa-solid fa-bag-shopping"></i><p>Your bag is empty.</p></div>';
                    cartFooter.style.display = 'none';
                } else {
                    cartFooter.style.display = 'block';
                    const subtotal = cartItems.reduce((s, i) => s + (i.price * i.qty), 0);
                    cartContainer.innerHTML = cartItems.map(item => `
                        <div class="drawer-item">
                            <img src="${item.img || 'images/default.png'}" alt="${item.name}" class="drawer-item-img" onerror="this.src='images/default.png'">
                            <div class="drawer-item-info">
                                <h4>${item.name}</h4>
                                <p>Qty: ${item.qty}</p>
                                <div class="drawer-item-price">₹${(item.price * item.qty).toLocaleString('en-IN')}</div>
                                <div class="action-row">
                                    <button class="drawer-item-btn danger" onclick="removeCartItem(${item.id})">Remove</button>
                                </div>
                            </div>
                        </div>`).join('');
                    document.getElementById('cartSubtotal').textContent = `₹${subtotal.toLocaleString('en-IN')}`;
                    document.getElementById('cartTotal').textContent = `₹${subtotal.toLocaleString('en-IN')}`;
                }
            }
        }

        // --- WISHLIST ---
        const wishRes = await fetch(`${apiUrl}/wishlist`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (wishRes.ok) {
            const wishItems = await wishRes.json();
            
            document.querySelectorAll('.wishlist-counter-badge').forEach(badge => {
                badge.innerText = wishItems.length;
                badge.classList.toggle('visible', wishItems.length > 0);
                badge.style.display = ''; 
            });

            const wishContainer = document.getElementById('wishlistItems');
            if (wishContainer) {
                if (wishItems.length === 0) {
                    wishContainer.innerHTML = '<div class="drawer-empty"><i class="fa-regular fa-heart"></i><p>You haven\'t saved any favorites yet.</p></div>';
                } else {
                    wishContainer.innerHTML = wishItems.map(item => `
                        <div class="drawer-item">
                            <img src="${item.img || 'images/default.png'}" alt="${item.name}" class="drawer-item-img" onerror="this.src='images/default.png'">
                            <div class="drawer-item-info">
                                <h4>${item.name}</h4>
                                <p>${item.shape || 'Standard'}</p>
                                <div class="drawer-item-price">₹${item.price.toLocaleString('en-IN')}</div>
                                <div class="action-row">
                                    <button class="drawer-item-btn" onclick="moveToCart(${item.id})">Move to Bag</button>
                                    <span style="color:var(--mocha); opacity:0.4;">|</span>
                                    <button class="drawer-item-btn danger" onclick="removeWishlistItem(${item.id})">Remove</button>
                                </div>
                            </div>
                        </div>`).join('');
                }
            }
        }
    } catch (error) {
        console.error("Global sync failed:", error);
    }
};

// ─────────────────────────────────────────
//  5. ON LOAD: INITIALIZE STATE & USER ICON
// ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    // 1. Sync Cart/Wishlist State
    window.syncGlobalState();

    // 2. Manage User Icon UI
    const token = localStorage.getItem('customerToken');
    const portalLink = document.getElementById('user-portal-link');
    const portalIcon = document.getElementById('user-portal-icon');
    
    if (token && portalLink && portalIcon) {
        // Direct users to proper dashboard
        const role = localStorage.getItem('userRole');
        portalLink.href = role === 'admin' ? 'admin.html' : 'dashboard.html';
        
        // Swap hollow icon for solid icon
        portalIcon.classList.remove('fa-regular');
        portalIcon.classList.add('fa-solid');
        portalIcon.style.color = "var(--mocha)";
    }
});
