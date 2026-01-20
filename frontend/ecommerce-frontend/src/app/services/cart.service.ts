import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface CartItem {
  productId: number;
  quantity: number;
  product?: any;
  subtotal?: number;
}

export interface Cart {
  items: CartItem[];
  total: number;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private apiUrl = environment.cartServiceUrl;
  private userId = 'user123'; // Hardcoded for demo

  constructor(private http: HttpClient) { }

  getCart(): Observable<Cart> {
    return this.http.get<Cart>(`${this.apiUrl}/api/cart/${this.userId}`);
  }

  addToCart(productId: number, quantity: number = 1): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/cart/${this.userId}/items`, {
      productId,
      quantity
    });
  }

  updateQuantity(productId: number, quantity: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/api/cart/${this.userId}/items/${productId}`, {
      quantity
    });
  }

  removeFromCart(productId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/api/cart/${this.userId}/items/${productId}`);
  }

  clearCart(): Observable<any> {
    return this.http.delete(`${this.apiUrl}/api/cart/${this.userId}`);
  }
}
