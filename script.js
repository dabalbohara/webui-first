document.addEventListener('DOMContentLoaded', () => {
    // ============ DOM Elements ============
    const navBtn = document.querySelector('.nav-toggle');
    const nav = document.getElementById('primary-navigation');
    const shopBtn = document.querySelector('.shop-btn');
    const modal = document.getElementById('shop-modal');
    const closeButtons = modal ? modal.querySelectorAll('.close-modal') : [];
    const viewProductsBtn = modal ? modal.querySelector('.view-products') : null;
    const productsSection = document.getElementById('products');
    const cartIcon = document.querySelector('.cart-icon');
    const cartPanel = document.getElementById('cart-panel');
    const closeCartBtn = document.querySelector('.close-cart');
    const cartItemsContainer = cartPanel ? cartPanel.querySelector('.cart-items') : null;
    const cartTotalElement = document.getElementById('cart-total');
    const checkoutBtn = document.querySelector('.checkout-btn');
    const productSearch = document.getElementById('product-search');
    const productGrid = document.querySelector('.product-grid');
    const toast = document.getElementById('toast');
    const year = document.getElementById('year');
    const themeToggle = document.querySelector('.theme-toggle') || createThemeToggle();
    const sortSelect = document.getElementById('sort-products') || createSortSelect();

    function createThemeToggle() {
        const toggle = document.createElement('button');
        toggle.className = 'theme-toggle';
        toggle.type = 'button';
        toggle.textContent = '🌙';
        toggle.setAttribute('aria-label', 'Switch theme');
        document.querySelector('.navbar')?.appendChild(toggle);
        return toggle;
    }

    function createSortSelect() {
        const toolbar = document.querySelector('.product-toolbar');
        if (!toolbar) return null;

        const sortWrapper = document.createElement('label');
        sortWrapper.className = 'sort-wrapper';
        sortWrapper.innerHTML = `
            <span class="sort-label">Sort by</span>
            <select id="sort-products" class="sort-select">
                <option value="default">Featured</option>
                <option value="low">Price: Low to High</option>
                <option value="high">Price: High to Low</option>
            </select>
        `;

        toolbar.appendChild(sortWrapper);
        return sortWrapper.querySelector('#sort-products');
    }

    // ============ Storage Manager (Advanced) ============
    const StorageManager = {
        getItem: (key, defaultValue = null) => {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            } catch (e) {
                console.error(`Storage error reading ${key}:`, e);
                return defaultValue;
            }
        },
        setItem: (key, value) => {
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (e) {
                console.error(`Storage error writing ${key}:`, e);
                return false;
            }
        },
        removeItem: (key) => {
            try {
                localStorage.removeItem(key);
                return true;
            } catch (e) {
                console.error(`Storage error removing ${key}:`, e);
                return false;
            }
        }
    };

    // ============ Initialize Cart with LocalStorage ============
    let cart = StorageManager.getItem('userCart', {});

    // ============ Analytics Tracker (Advanced) ============
    const Analytics = {
        log: (event, data = {}) => {
            const timestamp = new Date().toISOString();
            const eventData = { event, timestamp, ...data };
            let events = StorageManager.getItem('analytics', []);
            events.push(eventData);
            if (events.length > 50) events = events.slice(-50); // Keep last 50
            StorageManager.setItem('analytics', events);
            console.log('📊 Event logged:', eventData);
        }
    };

    // ============ Wishlist Manager (Advanced) ============
    const WishlistManager = {
        wishlist: StorageManager.getItem('userWishlist', []),
        add: function (productName, price) {
            if (!this.wishlist.some(item => item.name === productName)) {
                this.wishlist.push({ name: productName, price, dateAdded: new Date().toISOString() });
                StorageManager.setItem('userWishlist', this.wishlist);
                Analytics.log('wishlist_add', { product: productName, price });
                showToast(`${productName} added to wishlist ❤️`);
                return true;
            }
            return false;
        },
        remove: function (productName) {
            this.wishlist = this.wishlist.filter(item => item.name !== productName);
            StorageManager.setItem('userWishlist', this.wishlist);
            Analytics.log('wishlist_remove', { product: productName });
        },
        has: function (productName) {
            return this.wishlist.some(item => item.name === productName);
        },
        getTotal: function () {
            return this.wishlist.reduce((sum, item) => sum + item.price, 0);
        }
    };

    // ============ Search History (Advanced) ============
    const SearchHistory = {
        history: StorageManager.getItem('searchHistory', []),
        add: function (term) {
            if (term && !this.history.includes(term)) {
                this.history.unshift(term);
                if (this.history.length > 10) this.history.pop();
                StorageManager.setItem('searchHistory', this.history);
            }
        },
        get: function () {
            return this.history;
        },
        clear: function () {
            this.history = [];
            StorageManager.removeItem('searchHistory');
        }
    };

    // ============ Theme Manager (Advanced) ============
    const ThemeManager = {
        mode: StorageManager.getItem('themeMode', 'light'),
        apply: function () {
            const isDark = this.mode === 'dark';
            document.body.classList.toggle('dark', isDark);
            if (themeToggle) {
                themeToggle.textContent = isDark ? '☀️' : '🌙';
                themeToggle.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
            }
        },
        toggle: function () {
            this.mode = this.mode === 'dark' ? 'light' : 'dark';
            StorageManager.setItem('themeMode', this.mode);
            this.apply();
            Analytics.log('theme_toggle', { theme: this.mode });
            showToast(`Theme switched to ${this.mode}`);
        }
    };

    if (themeToggle) {
        themeToggle.addEventListener('click', () => ThemeManager.toggle());
    }

    ThemeManager.apply();

    // ============ Utility: Debounce Function ============
    function debounce(func, delay) {
        let timeoutId;
        return function (...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    }

    // ============ Utility: Throttle Function ============
    function throttle(func, limit) {
        let inThrottle;
        return function (...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    if (year) {
        year.textContent = new Date().getFullYear();
    }

    if (navBtn && nav) {
        navBtn.addEventListener('click', () => {
            const open = nav.classList.toggle('open');
            navBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
        });

        document.querySelectorAll('.navbar a').forEach(link => {
            link.addEventListener('click', () => {
                if (nav.classList.contains('open')) {
                    nav.classList.remove('open');
                    navBtn.setAttribute('aria-expanded', 'false');
                }
            });
        });
    }

    function showToast(message) {
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add('show');
        clearTimeout(showToast.timeout);
        showToast.timeout = setTimeout(() => {
            toast.classList.remove('show');
        }, 1800);
    }

    function openModal() {
        if (!modal) return;
        modal.classList.add('open');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        if (!modal) return;
        modal.classList.remove('open');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    function openCart() {
        if (!cartPanel) return;
        cartPanel.classList.add('open');
        cartPanel.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }

    function closeCart() {
        if (!cartPanel) return;
        cartPanel.classList.remove('open');
        cartPanel.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    function updateCartDisplay() {
        const items = Object.values(cart);

        if (cartItemsContainer) {
            cartItemsContainer.innerHTML = '';

            if (items.length === 0) {
                cartItemsContainer.innerHTML = '<p class="empty-cart">Your cart is empty.</p>';
            } else {
                items.forEach((item, index) => {
                    const itemRow = document.createElement('div');
                    itemRow.className = 'cart-item';
                    const subtotal = item.price * item.quantity;

                    itemRow.innerHTML = `
                        <div class="cart-item-info">
                            <strong>${item.name}</strong>
                            <span>¥${item.price} each</span>
                            <div class="cart-quantity-controls">
                                <button class="quantity-btn decrement" data-name="${item.name}" aria-label="Decrease quantity">−</button>
                                <span>${item.quantity}</span>
                                <button class="quantity-btn increment" data-name="${item.name}" aria-label="Increase quantity">+</button>
                            </div>
                        </div>
                        <div class="cart-item-actions">
                            <span class="cart-item-total">¥${subtotal}</span>
                            <button class="cart-item-remove" data-name="${item.name}">Remove</button>
                        </div>
                    `;
                    cartItemsContainer.appendChild(itemRow);
                });
            }
        }

        const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        if (cartTotalElement) {
            cartTotalElement.textContent = `¥${total}`;
        }

        if (cartIcon) {
            const quantity = items.reduce((sum, item) => sum + item.quantity, 0);
            const countSpan = cartIcon.querySelector('#cart-count');
            if (countSpan) {
                countSpan.textContent = quantity;
            } else {
                cartIcon.textContent = `🛒 Cart (${quantity})`;
            }
        }

        // Save cart to localStorage
        StorageManager.setItem('userCart', cart);

        cartItemsContainer?.querySelectorAll('.cart-item-remove').forEach(btn => {
            btn.addEventListener('click', () => {
                const productName = btn.dataset.name;
                if (!productName || !cart[productName]) return;
                delete cart[productName];
                updateCartDisplay();
                showToast(`${productName} removed from cart`);
                Analytics.log('cart_remove', { product: productName });
            });
        });

        cartItemsContainer?.querySelectorAll('.quantity-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const productName = btn.dataset.name;
                if (!productName || !cart[productName]) return;
                if (btn.classList.contains('decrement')) {
                    cart[productName].quantity = Math.max(1, cart[productName].quantity - 1);
                } else {
                    cart[productName].quantity += 1;
                }
                updateCartDisplay();
                showToast(`${cart[productName].name} quantity updated`);
                Analytics.log('cart_update', { product: productName, quantity: cart[productName].quantity });
            });
        });
    }

    function addToCart(card) {
        if (!card) return;

        const name = card.querySelector('h3')?.textContent?.trim() || 'Product';
        const priceText = card.querySelector('.price')?.textContent || '¥0';
        const price = Number(priceText.replace(/[^0-9]/g, ''));

        if (isNaN(price) || price < 0) {
            showToast('Invalid price for this product');
            return;
        }

        if (!cart[name]) {
            cart[name] = { name, price, quantity: 0 };
        }

        cart[name].quantity += 1;
        updateCartDisplay();
        showToast(`${name} added to cart`);
        card.classList.add('is-added');
        Analytics.log('cart_add', { product: name, price });
        setTimeout(() => card.classList.remove('is-added'), 500);
    }

    if (shopBtn) {
        shopBtn.addEventListener('click', openModal);
    }

    closeButtons.forEach(button => button.addEventListener('click', closeModal));

    if (modal) {
        modal.addEventListener('click', event => {
            if (event.target === modal) {
                closeModal();
            }
        });
    }

    if (viewProductsBtn && productsSection) {
        viewProductsBtn.addEventListener('click', () => {
            closeModal();
            productsSection.scrollIntoView({ behavior: 'smooth' });
        });
    }

    if (cartIcon) {
        cartIcon.addEventListener('click', openCart);
    }

    if (closeCartBtn) {
        closeCartBtn.addEventListener('click', closeCart);
    }

    if (cartPanel) {
        cartPanel.addEventListener('click', event => {
            if (event.target === cartPanel) {
                closeCart();
            }
        });
    }

    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            showToast('Checkout coming soon!');
        });
    }

    function handleCardTilt(event) {
        const card = event.currentTarget;
        const rect = card.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width - 0.5) * 18;
        const y = ((event.clientY - rect.top) / rect.height - 0.5) * -18;
        card.style.transform = `perspective(900px) rotateX(${y}deg) rotateY(${x}deg)`;
    }

    function resetCardTilt(event) {
        const card = event.currentTarget;
        card.style.transform = '';
    }

    function enhanceProductCards() {
        if (!productGrid) return;

        productGrid.querySelectorAll('.product-card').forEach(card => {
            if (!card.querySelector('.product-actions')) {
                const actionArea = document.createElement('div');
                actionArea.className = 'product-actions';
                actionArea.innerHTML = `
                    <button type="button" class="wishlist-btn" aria-label="Add to wishlist">🤍</button>
                    <button type="button" class="quick-view-btn">Quick view</button>
                `;
                card.appendChild(actionArea);
            }

            if (!card.dataset.tiltAttached) {
                card.dataset.tiltAttached = 'true';
                card.addEventListener('mousemove', handleCardTilt);
                card.addEventListener('mouseleave', resetCardTilt);
            }
        });
    }

    // ============ Auto-fix product images based on product title ==========
    function fixProductImages() {
        if (!productGrid) return;
        productGrid.querySelectorAll('.product-card').forEach(card => {
            const title = card.querySelector('h3')?.textContent?.trim();
            if (!title) return;

            const img = card.querySelector('img');
            if (!img) return;

            // Prefer an explicit descriptive alt and lazy loading
            img.alt = title;
            img.loading = 'lazy';

            // If the current src looks generic or doesn't include keywords from the title,
            // replace it with a targeted Unsplash query for better relevance.
            try {
                const currentSrc = img.getAttribute('src') || '';
                const lowerSrc = currentSrc.toLowerCase();
                const nameKey = encodeURIComponent(title.replace(/\s+/g, '+'));

                // If image already contains the product name, leave it. Otherwise update.
                if (!lowerSrc.includes(title.split(' ')[0].toLowerCase()) && !lowerSrc.includes(nameKey.toLowerCase())) {
                    // Use Unsplash source with size for consistency
                    img.src = `https://source.unsplash.com/600x400/?${nameKey}`;
                }
            } catch (e) {
                // Silently ignore errors and keep existing image
                console.warn('fixProductImages error for', title, e);
            }
        });
    }

    function setImageFallbacks() {
        if (!productGrid) return;
        productGrid.querySelectorAll('img').forEach(img => {
            img.onerror = () => {
                img.onerror = null;
                img.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22600%22 height=%22400%22%3E%3Crect width=%22600%22 height=%22400%22 fill=%22%23e2e8f0%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22%23626c7d%22 font-family=%22Inter,system-ui,sans-serif%22 font-size=%2224%22%3EImage not available%3C/text%3E%3C/svg%3E';
            };
        });
    }

    function createBackToTop() {
        const button = document.createElement('button');
        button.className = 'back-to-top';
        button.type = 'button';
        button.textContent = '↑';
        button.title = 'Back to top';
        document.body.appendChild(button);

        window.addEventListener('scroll', throttle(() => {
            button.classList.toggle('visible', window.scrollY > 450);
        }, 150));

        button.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    function renderProducts() {
        if (!productGrid) return;

        const cards = Array.from(productGrid.querySelectorAll('.product-card'));
        const visibleCards = cards.filter(card => !card.classList.contains('is-hidden'));
        const hiddenCards = cards.filter(card => card.classList.contains('is-hidden'));

        let emptyState = productGrid.querySelector('.empty-state');
        if (!emptyState) {
            emptyState = document.createElement('div');
            emptyState.className = 'empty-state';
            emptyState.textContent = 'No products matched your search. Try a different keyword.';
            productGrid.appendChild(emptyState);
        }

        const sortedCards = [...visibleCards].sort((a, b) => {
            const priceA = Number((a.querySelector('.price')?.textContent || '¥0').replace(/[^0-9]/g, ''));
            const priceB = Number((b.querySelector('.price')?.textContent || '¥0').replace(/[^0-9]/g, ''));

            if (sortSelect && sortSelect.value === 'low') {
                return priceA - priceB;
            }

            if (sortSelect && sortSelect.value === 'high') {
                return priceB - priceA;
            }

            return 0;
        });

        cards.forEach(card => card.remove());
        [...sortedCards, ...hiddenCards].forEach(card => productGrid.appendChild(card));
        emptyState.style.display = visibleCards.length === 0 ? 'block' : 'none';
        enhanceProductCards();
    }

    if (productSearch && productGrid) {
        // Debounced search for better performance
        const debouncedSearch = debounce(() => {
            const term = productSearch.value.trim().toLowerCase();

            if (term) {
                SearchHistory.add(term);
                Analytics.log('search', { term, timestamp: new Date().toISOString() });
            }

            const cards = Array.from(productGrid.querySelectorAll('.product-card'));
            let visibleCount = 0;

            cards.forEach(card => {
                const text = card.textContent.toLowerCase();
                const matches = text.includes(term);
                card.classList.toggle('is-hidden', !matches);
                if (matches) visibleCount += 1;
            });

            renderProducts();
            if (visibleCount === 0 && term) {
                showToast('No matching products found');
            }
        }, 300); // 300ms delay

        productSearch.addEventListener('input', () => {
            debouncedSearch();
            updateSearchSuggestions();
        });

        // Add clear button functionality
        const searchContainer = productSearch.parentElement;
        if (searchContainer && !searchContainer.querySelector('.search-clear-btn')) {
            const clearBtn = document.createElement('button');
            clearBtn.className = 'search-clear-btn';
            clearBtn.type = 'button';
            clearBtn.innerHTML = '✕';
            searchContainer.style.position = 'relative';
            searchContainer.appendChild(clearBtn);

            clearBtn.addEventListener('click', () => {
                productSearch.value = '';
                debouncedSearch();
                updateSearchSuggestions();
                productSearch.focus();
            });
        }

        if (searchContainer && !searchContainer.querySelector('.search-suggestions')) {
            const suggestions = document.createElement('div');
            suggestions.className = 'search-suggestions';
            searchContainer.appendChild(suggestions);

            suggestions.addEventListener('click', event => {
                const suggestion = event.target.closest('.search-suggestion');
                if (!suggestion) return;
                productSearch.value = suggestion.textContent.trim();
                debouncedSearch();
                productSearch.focus();
            });

            productSearch.addEventListener('focus', updateSearchSuggestions);
            productSearch.addEventListener('blur', () => {
                setTimeout(() => suggestions.classList.remove('visible'), 180);
            });
        }

        function updateSearchSuggestions() {
            const suggestions = searchContainer?.querySelector('.search-suggestions');
            if (!suggestions) return;
            const history = SearchHistory.get().slice(0, 5);
            if (!history.length) {
                suggestions.innerHTML = '<span>No recent searches</span>';
                suggestions.classList.remove('visible');
                return;
            }
            suggestions.innerHTML = history.map(term => `<button type="button" class="search-suggestion">${term}</button>`).join('');
            suggestions.classList.add('visible');
        }

        updateSearchSuggestions();
    }

    if (sortSelect) {
        sortSelect.addEventListener('change', renderProducts);
    }

    // ============ Advanced Event Delegation (Advanced) ============
    document.addEventListener('click', event => {
        // Add to Cart
        const addBtn = event.target.closest('.add-to-cart');
        if (addBtn) {
            addToCart(addBtn.closest('.product-card'));
            openCart();
            return;
        }

        // Wishlist Toggle
        const wishlistBtn = event.target.closest('.wishlist-btn');
        if (wishlistBtn) {
            const card = wishlistBtn.closest('.product-card');
            const productName = card.querySelector('h3')?.textContent?.trim() || 'Product';
            const priceText = card.querySelector('.price')?.textContent || '¥0';
            const price = Number(priceText.replace(/[^0-9]/g, ''));

            if (WishlistManager.has(productName)) {
                WishlistManager.remove(productName);
                wishlistBtn.classList.remove('in-wishlist');
                wishlistBtn.textContent = '🤍';
            } else {
                WishlistManager.add(productName, price);
                wishlistBtn.classList.add('in-wishlist');
                wishlistBtn.textContent = '❤️';
            }
            return;
        }

        // Quick View
        const quickViewBtn = event.target.closest('.quick-view-btn');
        if (quickViewBtn) {
            const card = quickViewBtn.closest('.product-card');
            const productName = card.querySelector('h3')?.textContent?.trim() || 'Product';
            const price = card.querySelector('.price')?.textContent || '¥0';
            const description = card.querySelector('p')?.textContent || 'No description';

            showToast(`Quick view: ${productName} - ${price}`);
            Analytics.log('quick_view', { product: productName });
            return;
        }
    });

    // ============ Keyboard Shortcuts (Advanced) ============
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + K: Focus search
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            productSearch?.focus();
            showToast('🔍 Search focused');
        }

        // Escape: Close modals
        if (e.key === 'Escape') {
            if (modal && modal.classList.contains('open')) {
                closeModal();
            }
            if (cartPanel && cartPanel.classList.contains('open')) {
                closeCart();
            }
        }

        // Ctrl/Cmd + Shift + W: Toggle wishlist view
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'W') {
            e.preventDefault();
            const wishlistCount = WishlistManager.wishlist.length;
            const wishlistTotal = WishlistManager.getTotal();
            showToast(`❤️ Wishlist: ${wishlistCount} items • ¥${wishlistTotal}`);
            Analytics.log('wishlist_view', { items: wishlistCount, total: wishlistTotal });
        }
    });

    // ============ RECOMMENDED PRODUCTS SECTION ============
    const RecommendedManager = {
        recommendedProducts: [
            {
                name: 'Wireless Headphones',
                price: 4000,
                img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=80',
                badge: '⭐ TOP'
            },
            {
                name: 'Smart Watch',
                price: 7999,
                img: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=80',
                badge: '🔥 HOT'
            },
            {
                name: 'Bluetooth Earbuds',
                price: 2500,
                img: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500&auto=format&fit=crop&q=80',
                badge: '💰 SALE'
            },
            {
                name: 'Wireless Gaming Mouse',
                price: 2999,
                img: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=500&auto=format&fit=crop&q=80',
                badge: '✨ NEW'
            },
            {
                name: 'Mechanical Keyboard',
                price: 3999,
                img: 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=500&auto=format&fit=crop&q=80',
                badge: '⭐ TOP'
            },
            {
                name: 'Portable Bluetooth Speaker',
                price: 3499,
                img: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500&auto=format&fit=crop&q=80',
                badge: '💰 SALE'
            }
        ],

        init: function () {
            this.renderRecommended();
            this.setupCarousel();
        },

        renderRecommended: function () {
            const grid = document.getElementById('recommended-grid');
            if (!grid) return;

            const self = this;
            grid.innerHTML = this.recommendedProducts.map(product => `
                <div class="recommended-card">
                    <span class="recommended-badge">${product.badge}</span>
                    <img src="${product.img}" alt="${product.name}" loading="lazy">
                    <h3>${product.name}</h3>
                    <p class="price">¥${product.price.toLocaleString()}</p>
                    <div class="recommended-actions">
                        <button class="recommend-add-btn" data-product="${product.name}" data-price="${product.price}">Add Cart</button>
                        <button class="recommend-view-btn">Quick View</button>
                    </div>
                </div>
            `).join('');

            // Add event listeners to recommended product buttons
            grid.querySelectorAll('.recommend-add-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const productName = e.target.dataset.product;
                    const price = parseInt(e.target.dataset.price);
                    self.addToCartFromRecommended(productName, price, e.target);
                });
            });
        },

        addToCartFromRecommended: function (productName, price, btn) {
            if (!cart[productName]) {
                cart[productName] = { name: productName, price: price, quantity: 0 };
            }
            cart[productName].quantity += 1;
            StorageManager.setItem('userCart', cart);
            Analytics.log('add_to_cart', { product: productName, price, source: 'recommended' });
            updateCartDisplay();
            showToast(`${productName} added to cart! 🛒`);
            btn.textContent = '✓ Added';
            setTimeout(() => {
                btn.textContent = 'Add Cart';
            }, 2000);
        },

        setupCarousel: function () {
            const prevBtn = document.querySelector('.carousel-prev');
            const nextBtn = document.querySelector('.carousel-next');
            const grid = document.getElementById('recommended-grid');

            if (!prevBtn || !nextBtn || !grid) return;

            let scrollPosition = 0;
            const scrollAmount = 260; // card width + gap

            prevBtn.addEventListener('click', () => {
                scrollPosition = Math.max(0, scrollPosition - scrollAmount);
                grid.style.transform = `translateX(-${scrollPosition}px)`;
            });

            nextBtn.addEventListener('click', () => {
                const maxScroll = grid.scrollWidth - grid.parentElement.clientWidth;
                scrollPosition = Math.min(maxScroll, scrollPosition + scrollAmount);
                grid.style.transform = `translateX(-${scrollPosition}px)`;
            });
        }
    };

    // Initialize recommended products
    RecommendedManager.init();

    setImageFallbacks();
    updateCartDisplay();
    renderProducts();
    createBackToTop();
});
