export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  featured: boolean;
  active: boolean;
  createdAt: string;
};

export type Promotion = {
  id: string;
  title: string;
  description: string;
  discountLabel: string;
  image: string;
  active: boolean;
  createdAt: string;
};

export type NewsItem = {
  id: string;
  title: string;
  content: string;
  image: string;
  active: boolean;
  createdAt: string;
};

export type StoreSettings = {
  storeName: string;
  tagline: string;
  whatsapp: string;
  about: string;
};

export type StoreData = {
  settings: StoreSettings;
  products: Product[];
  promotions: Promotion[];
  news: NewsItem[];
};

export type UserRole = "cliente" | "empreendedor" | "admin";

export type User = {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: UserRole;
  active: boolean;
  createdAt: string;
};

export type OrderItem = {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
};

export type OrderStatus =
  | "pendente"
  | "confirmado"
  | "pronto"
  | "entregue"
  | "cancelado";

export type Order = {
  id: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: OrderItem[];
  totalPrice: number;
  status: OrderStatus;
  notes: string;
  deliveryDate: string;
  deliveryTime?: string;
  createdAt: string;
  updatedAt: string;
};
