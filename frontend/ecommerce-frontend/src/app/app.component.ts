import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { ProductService, Product } from './services/product.service';
import { CartService, Cart } from './services/cart.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'E-Commerce Microservices';
  products: Product[] = [];
  cart: Cart = { items: [], total: 0 };
  showCart = false;
  loading = false;
  error: string | null = null;

  constructor(
    private productService: ProductService,
    private cartService: CartService
  ) {}

  ngOnInit() {
    // Only load data in browser, not during SSR/build
    if (typeof window !== 'undefined') {
      this.loadProducts();
      this.loadCart();
    }
  }

  loadProducts() {
    this.loading = true;
    this.error = null;
    this.productService.getProducts().subscribe({
      next: (data) => {
        this.products = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading products:', err);
        this.error = 'Failed to load products. Please make sure the Product Service is running.';
        this.loading = false;
      }
    });
  }

  loadCart() {
    this.cartService.getCart().subscribe({
      next: (data) => {
        this.cart = data;
      },
      error: (err) => {
        console.error('Error loading cart:', err);
      }
    });
  }

  addToCart(product: Product) {
    this.cartService.addToCart(product.id, 1).subscribe({
      next: () => {
        this.loadCart();
        alert(`${product.name} added to cart!`);
      },
      error: (err) => {
        console.error('Error adding to cart:', err);
        alert('Failed to add item to cart.');
      }
    });
  }

  updateQuantity(item: any, change: number) {
    const newQuantity = item.quantity + change;
    if (newQuantity < 1) {
      this.removeFromCart(item.productId);
      return;
    }

    this.cartService.updateQuantity(item.productId, newQuantity).subscribe({
      next: () => {
        this.loadCart();
      },
      error: (err) => {
        console.error('Error updating quantity:', err);
      }
    });
  }

  removeFromCart(productId: number) {
    if (!confirm('Remove this item from cart?')) {
      return;
    }

    this.cartService.removeFromCart(productId).subscribe({
      next: () => {
        this.loadCart();
      },
      error: (err) => {
        console.error('Error removing from cart:', err);
      }
    });
  }

  clearCart() {
    if (!confirm('Clear entire cart?')) {
      return;
    }

    this.cartService.clearCart().subscribe({
      next: () => {
        this.loadCart();
      },
      error: (err) => {
        console.error('Error clearing cart:', err);
      }
    });
  }

  toggleCart() {
    this.showCart = !this.showCart;
  }

  getCartItemCount(): number {
    return this.cart.items.reduce((sum, item) => sum + item.quantity, 0);
  }
}
