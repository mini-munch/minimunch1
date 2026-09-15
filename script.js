// 1. Products ordered exactly as requested
const products = [
    { id: 1, name: "Cake Rusk", weight: "500 g", price: 800, img: "4-cr.png" },
    { id: 2, name: "Nan Khatai", weight: "500 g", price: 800, img: "5-nan.png" },
    { id: 3, name: "Sugar-Free Cake Rusk", weight: "500 g", price: 1000, img: "3-sfc.png" },
    { id: 4, name: "Plain Tea Cake", weight: "", price: 600, img: "2-cake.png" },
    { id: 5, name: "Cake Rusk", weight: "1000 g", price: 1600, img: "8-cr1000.png" },
    { id: 6, name: "Nan Khatai", weight: "1000 g", price: 1600, img: "7-nan1000.png" },
    { id: 7, name: "Sugar-Free Cake Rusk", weight: "1000 g", price: 2000, img: "6-sfc1000.png" }
];

let cart = [];
const FREE_DELIVERY_THRESHOLD = 2000;
const DELIVERY_CHARGE = 200;

// 2. Render Products to the Page
const productsGrid = document.getElementById('products-grid');
products.forEach(product => {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
        <img src="${product.img}" alt="${product.name}" class="product-img">
        <button class="add-to-cart" onclick="addToCart(${product.id}, this)">Add to Cart 🛒</button>
    `;
    productsGrid.appendChild(card);
});

// 3. Cart Functions
function addToCart(productId, btnElement) {
    const product = products.find(p => p.id === productId);
    const existingItem = cart.find(item => item.id === productId);

    if (existingItem) {
        existingItem.qty++;
    } else {
        cart.push({ ...product, qty: 1 });
    }
    updateCartUI();
    
    // Quick mobile-friendly animation
    const originalText = btnElement.innerText;
    btnElement.innerText = "Added! ✔️";
    btnElement.style.backgroundColor = "#2e7d32";
    setTimeout(() => {
        btnElement.innerText = originalText;
        btnElement.style.backgroundColor = "#ff5722";
    }, 1000);
}

function updateQty(productId, change) {
    const item = cart.find(i => i.id === productId);
    if (!item) return;
    
    item.qty += change;
    if (item.qty <= 0) {
        cart = cart.filter(i => i.id !== productId);
    }
    updateCartUI();
}

function updateCartUI() {
    const cartItemsContainer = document.getElementById('cart-items');
    const cartCount = document.getElementById('cart-count');
    const promoBanner = document.getElementById('delivery-promo');
    const cartSummary = document.getElementById('cart-summary');
    
    cartItemsContainer.innerHTML = '';
    let subtotal = 0;
    let count = 0;

    cart.forEach(item => {
        subtotal += item.price * item.qty;
        count += item.qty;
        
        const weightText = item.weight ? `(${item.weight})` : '';
        cartItemsContainer.innerHTML += `
            <div class="cart-item">
                <div class="cart-item-info">
                    <h4>${item.name} ${weightText}</h4>
                    <p>Rs ${item.price}</p>
                </div>
                <div class="cart-qty-controls">
                    <button onclick="updateQty(${item.id}, -1)">-</button>
                    <span>${item.qty}</span>
                    <button onclick="updateQty(${item.id}, 1)">+</button>
                </div>
            </div>
        `;
    });

    cartCount.innerText = count;

    if (cart.length === 0) {
        // Empty Cart State
        cartItemsContainer.innerHTML = '<p style="text-align:center; color:#777; margin:20px 0;">Your cart is empty.</p>';
        promoBanner.style.display = 'none';
        cartSummary.style.display = 'none';
        document.getElementById('show-checkout-btn').style.display = 'none';
        document.getElementById('checkout-form').classList.add('hidden');
    } else {
        // Calculate Delivery Logic
        let deliveryFee = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_CHARGE;
        let grandTotal = subtotal + deliveryFee;

        // Update Promo Message
        promoBanner.style.display = 'block';
        if (deliveryFee === 0) {
            promoBanner.innerHTML = "🎉 Congratulations! You qualified for <strong>FREE Delivery!</strong>";
            promoBanner.style.background = "#d4edda";
            promoBanner.style.color = "#155724";
            promoBanner.style.borderColor = "#c3e6cb";
        } else {
            let needed = FREE_DELIVERY_THRESHOLD - subtotal;
            promoBanner.innerHTML = `🚚 Add <strong>Rs ${needed}</strong> more to your order for <strong>FREE Delivery!</strong>`;
            promoBanner.style.background = "#fff3cd";
            promoBanner.style.color = "#856404";
            promoBanner.style.borderColor = "#ffeeba";
        }

        // Update Prices
        document.getElementById('cart-subtotal').innerText = `Rs ${subtotal}`;
        document.getElementById('cart-delivery').innerText = deliveryFee === 0 ? 'FREE' : `Rs ${deliveryFee}`;
        document.getElementById('cart-grand-total').innerText = `Rs ${grandTotal}`;
        
        cartSummary.style.display = 'block';
        document.getElementById('show-checkout-btn').style.display = 'block';
    }
}

// 4. Modal Controls
function toggleCart() {
    document.getElementById('cart-modal').classList.toggle('hidden');
    document.getElementById('checkout-form').classList.add('hidden');
    
    // Only show the "Proceed to Checkout" button if items exist
    if(cart.length > 0) {
        document.getElementById('show-checkout-btn').style.display = 'block';
    }
}

function showCheckoutForm() {
    document.getElementById('show-checkout-btn').style.display = 'none';
    document.getElementById('checkout-form').classList.remove('hidden');
}

function closeSuccess() {
    document.getElementById('success-modal').classList.add('hidden');
}

// 5. Submit Order (Linked to Google Sheets)
function submitOrder(event) {
    event.preventDefault();
    if (cart.length === 0) return alert("Your cart is empty!");

    const name = document.getElementById('cust-name').value;
    const phone = document.getElementById('cust-phone').value;
    const address = document.getElementById('cust-address').value;
    
    // Format order details for Excel
    let orderDetails = cart.map(item => `${item.qty}x ${item.name} ${item.weight ? '('+item.weight+')' : ''}`).join('\n');
    let grandTotal = document.getElementById('cart-grand-total').innerText;
    let deliveryStatus = document.getElementById('cart-delivery').innerText;
    
    // Append delivery info to the final order string
    orderDetails += `\n[Delivery: ${deliveryStatus}]`;

    // Show loading UI
    document.getElementById('submit-btn').style.display = 'none';
    document.getElementById('loading-msg').classList.remove('hidden');

    // !!! PASTE YOUR GOOGLE SCRIPT URL RIGHT HERE BELOW !!!
    const scriptURL = 'https://script.google.com/macros/s/AKfycbw-Q6dFiM6UpP12tHZs18_Ceu-uLI9f90Im_5ABWc2IZDWK_bJiPvpPOmM3iQVhfwSbrg/exec'; 

    const formData = new FormData();
    formData.append('name', name);
    formData.append('phone', phone);
    formData.append('address', address);
    formData.append('order', orderDetails);
    formData.append('total', grandTotal);

    // Send data to Google Sheets
    fetch(scriptURL, { method: 'POST', body: formData })
        .then(response => {
            // Show Success Modal
            document.getElementById('cart-modal').classList.add('hidden');
            document.getElementById('success-modal').classList.remove('hidden');
            
            // Reset everything for the next order
            cart = [];
            updateCartUI();
            document.getElementById('checkout-form').reset();
            document.getElementById('submit-btn').style.display = 'block';
            document.getElementById('loading-msg').classList.add('hidden');
        })
        .catch(error => {
            alert('Something went wrong. Please try again or contact us on WhatsApp.');
            document.getElementById('submit-btn').style.display = 'block';
            document.getElementById('loading-msg').classList.add('hidden');
        });
}

// 6. Initialize empty UI when page loads
updateCartUI();
