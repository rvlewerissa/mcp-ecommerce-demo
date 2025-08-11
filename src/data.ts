export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
}

export const products: Product[] = [
  {
    id: "1",
    name: "Wireless Headphones",
    description: "High-quality wireless Bluetooth headphones with noise cancellation",
    price: 199.99,
    category: "Electronics"
  },
  {
    id: "2",
    name: "JavaScript: The Good Parts",
    description: "Essential book for JavaScript developers by Douglas Crockford",
    price: 29.99,
    category: "Books"
  },
  {
    id: "3",
    name: "Cotton T-Shirt",
    description: "Comfortable 100% cotton t-shirt in various colors",
    price: 19.99,
    category: "Clothing"
  },
  {
    id: "4",
    name: "Laptop Stand",
    description: "Adjustable aluminum laptop stand for better ergonomics",
    price: 49.99,
    category: "Electronics"
  },
  {
    id: "5",
    name: "The Pragmatic Programmer",
    description: "Classic programming book for improving your coding skills",
    price: 34.99,
    category: "Books"
  },
  {
    id: "6",
    name: "Running Shoes",
    description: "Lightweight running shoes with excellent cushioning",
    price: 89.99,
    category: "Clothing"
  },
  {
    id: "7",
    name: "USB-C Hub",
    description: "Multi-port USB-C hub with HDMI, USB 3.0, and charging ports",
    price: 79.99,
    category: "Electronics"
  }
];