document.addEventListener('DOMContentLoaded', () => {
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

    const cart = {};

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
                items.forEach(item => {
                    const itemRow = document.createElement('div');
                    itemRow.className = 'cart-item';
                    itemRow.innerHTML = `
                        <div class="cart-item-info">
                            <strong>${item.name}</strong>
                            <span>¥${item.price} x ${item.quantity}</span>
                        </div>
                        <span class="cart-item-total">¥${item.price * item.quantity}</span>
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
            cartIcon.textContent = `🛒 Cart (${quantity})`;
        }
    }

    function addToCart(card) {
        if (!card) return;

        const name = card.querySelector('h3')?.textContent?.trim() || 'Product';
        const priceText = card.querySelector('.price')?.textContent || '¥0';
        const price = Number(priceText.replace(/[^0-9]/g, ''));

        if (!cart[name]) {
            cart[name] = { name, price, quantity: 0 };
        }

        cart[name].quantity += 1;
        updateCartDisplay();
        showToast(`${name} added to cart`);
        card.classList.add('is-added');
        setTimeout(() => card.classList.remove('is-added'), 500);
    }

    document.addEventListener('click', event => {
        const button = event.target.closest('.add-to-cart');
        if (button) {
            addToCart(button.closest('.product-card'));
            openCart();
        }
    });

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

    if (productSearch && productGrid) {
        const cards = Array.from(productGrid.querySelectorAll('.product-card'));

        productSearch.addEventListener('input', () => {
            const term = productSearch.value.trim().toLowerCase();
            let visibleCount = 0;

            cards.forEach(card => {
                const text = card.textContent.toLowerCase();
                const matches = text.includes(term);
                card.classList.toggle('is-hidden', !matches);
                if (matches) visibleCount += 1;
            });

            let emptyState = productGrid.querySelector('.empty-state');
            if (!emptyState) {
                emptyState = document.createElement('div');
                emptyState.className = 'empty-state';
                emptyState.textContent = 'No products matched your search. Try a different keyword.';
                productGrid.appendChild(emptyState);
            }

            emptyState.style.display = visibleCount === 0 ? 'block' : 'none';
        });
    }

    updateCartDisplay();
});
