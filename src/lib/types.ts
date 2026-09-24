export type SoldBy = "unit" | "kg";

/** default = produto normal/torta; docinhos = cadastro rápido por sabor */
export type ProductKind = "default" | "docinhos";

export type ProductVariant = {
  id: string;
  size: string;
  style: string;
  price: number;
  image: string;
};

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  /** Preço por unidade ou por kg, conforme `soldBy`. */
  soldBy: SoldBy;
  kind: ProductKind;
  image: string;
  category: string;
  featured: boolean;
  active: boolean;
  createdAt: string;
  variants?: ProductVariant[];
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
  soldBy?: SoldBy;
  variantId?: string;
  variantLabel?: string;
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
