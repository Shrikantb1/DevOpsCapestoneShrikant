const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3002;
const DATA_FILE = path.join(__dirname, 'carts.json');
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://localhost:3001';

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Initialize carts data
const initData = () => {
  if (!fs.existsSync(DATA_FILE)) {
    const initialData = { carts: {} };
    fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2));
    console.log('Carts data initialized');
  }
};

// Read carts from file
const readCarts = () => {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading carts:', error);
    return { carts: {} };
  }
};

// Write carts to file
const writeCarts = (data) => {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing carts:', error);
  }
};

// Fetch product details from product service
const fetchProductDetails = async (productId) => {
  try {
    const response = await axios.get(`${PRODUCT_SERVICE_URL}/api/products/${productId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching product ${productId}:`, error.message);
    return null;
  }
};

// Routes

// Get cart for user
app.get('/api/cart/:userId', async (req, res) => {
  const { userId } = req.params;
  const data = readCarts();
  const cart = data.carts[userId] || { items: [], total: 0 };
  
  console.log(`[GET /api/cart/${userId}] Fetching cart with ${cart.items.length} items`);
  
  // Enrich with product details
  const enrichedItems = await Promise.all(
    cart.items.map(async (item) => {
      const product = await fetchProductDetails(item.productId);
      return { 
        ...item, 
        product,
        subtotal: product ? product.price * item.quantity : 0
      };
    })
  );
  
  // Calculate total
  const total = enrichedItems.reduce((sum, item) => sum + item.subtotal, 0);
  
  res.json({ items: enrichedItems, total });
});

// Add item to cart
// Add item to cart
app.post('/api/cart/:userId/items', async (req, res) => {
  const { userId } = req.params;
  const { productId, quantity } = req.body;
  
  if (!productId || !quantity || quantity < 1) {
    return res.status(400).json({ error: 'Invalid productId or quantity' });
  }
  
  // Verify product exists
  const product = await fetchProductDetails(productId);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  
  const data = readCarts();
  if (!data.carts[userId]) {
    data.carts[userId] = { items: [] };
  }
  
  const existingItem = data.carts[userId].items.find(i => i.productId === productId);
  if (existingItem) {
    existingItem.quantity += quantity;
    console.log(`[POST /api/cart/${userId}/items] Updated quantity for product ${productId} to ${existingItem.quantity}`);
  } else {
    data.carts[userId].items.push({ productId, quantity });
    console.log(`[POST /api/cart/${userId}/items] Added product ${productId} to cart with quantity ${quantity}`);
  }
  
  writeCarts(data);
  res.json({ success: true, cart: data.carts[userId] });
});





// Update item quantity
app.put('/api/cart/:userId/items/:productId', (req, res) => {
  const { userId, productId } = req.params;
  const { quantity } = req.body;
  
  if (!quantity || quantity < 0) {
    return res.status(400).json({ error: 'Invalid quantity' });
  }
  
  const data = readCarts();
  if (!data.carts[userId]) {
    return res.status(404).json({ error: 'Cart not found' });
  }
  
  const item = data.carts[userId].items.find(i => i.productId === parseInt(productId));
  if (!item) {
    return res.status(404).json({ error: 'Item not found in cart' });
  }
  
  if (quantity === 0) {
    // Remove item if quantity is 0
    data.carts[userId].items = data.carts[userId].items.filter(
      i => i.productId !== parseInt(productId)
    );
    console.log(`[PUT /api/cart/${userId}/items/${productId}] Removed item (quantity = 0)`);
  } else {
    item.quantity = quantity;
    console.log(`[PUT /api/cart/${userId}/items/${productId}] Updated quantity to ${quantity}`);
  }
  
  writeCarts(data);
  res.json({ success: true, cart: data.carts[userId] });
});

// Remove item from cart
app.delete('/api/cart/:userId/items/:productId', (req, res) => {
  const { userId, productId } = req.params;
  
  const data = readCarts();
  if (data.carts[userId]) {
    const initialLength = data.carts[userId].items.length;
    data.carts[userId].items = data.carts[userId].items.filter(
      i => i.productId !== parseInt(productId)
    );
    
    if (data.carts[userId].items.length < initialLength) {
      writeCarts(data);
      console.log(`[DELETE /api/cart/${userId}/items/${productId}] Removed item from cart`);
    }
  }
  
  res.json({ success: true });
});

// Clear entire cart
app.delete('/api/cart/:userId', (req, res) => {
  const { userId } = req.params;
  
  const data = readCarts();
  data.carts[userId] = { items: [] };
  writeCarts(data);
  
  console.log(`[DELETE /api/cart/${userId}] Cleared cart`);
  res.json({ success: true });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'cart-service',
    timestamp: new Date().toISOString(),
    productServiceUrl: PRODUCT_SERVICE_URL
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Cart Service API',
    version: '1.0.0',
    endpoints: {
      'GET /api/cart/:userId': 'Get user cart',
      'POST /api/cart/:userId/items': 'Add item to cart',
      'PUT /api/cart/:userId/items/:productId': 'Update item quantity',
      'DELETE /api/cart/:userId/items/:productId': 'Remove item from cart',
      'DELETE /api/cart/:userId': 'Clear cart',
      'GET /health': 'Health check'
    }
  });
});

// Initialize data and start server
initData();

app.listen(PORT, () => {
  console.log('========================================');
  console.log(`Cart Service running on port ${PORT}`);
  console.log(`http://localhost:${PORT}`);
  console.log(`Product Service: ${PRODUCT_SERVICE_URL}`);
  console.log('========================================');
});
