const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001;
const DATA_FILE = path.join(__dirname, 'products.json');

app.use(cors());
app.use(bodyParser.json());

// Initialize products data
const initData = () => {
  if (!fs.existsSync(DATA_FILE)) {
    const initialProducts = [
      { id: 1, name: 'Laptop', price: 999, description: 'High-performance laptop'},
      { id: 2, name: 'Mouse', price: 29, description: 'Wireless mouse' },
      { id: 3, name: 'Keyboard', price: 79, description: 'Mechanical keyboard'},
      { id: 4, name: 'Monitor', price: 299, description: '27-inch 4K monitor' }
    ];
    fs.writeFileSync(DATA_FILE, JSON.stringify(initialProducts, null, 2));
  }
};

// Get all products
app.get('/api/products', (req, res) => {
  const products = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  res.json(products);
});

// Get single product
app.get('/api/products/:id', (req, res) => {
  const products = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  const product = products.find(p => p.id === parseInt(req.params.id));
  if (product) {
    res.json(product);
  } else {
    res.status(404).json({ error: 'Product not found' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'product-service' });
});

initData();

app.listen(PORT, () => {
  console.log(`Product service running on port ${PORT}`);
});
