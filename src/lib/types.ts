export type SoldBy = "unit" | "kg";

/** bolos = tamanho/estilo; tortas = kg por circunferência + massa + sabores tradicional/especial; docinhos = sabores */
export type ProductKind = "bolos" | "tortas" | "docinhos" | "default";

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
  /** Galeria (capa = images[0]). Usado no carrossel de tortas. */
  images?: string[];
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

export type TortaSizeOption = {
  cm: number;
  kg: number;
  fatias: string;
};

export type StoreSettings = {
  storeName: string;
  tagline: string;
  whatsapp: string;
  about: string;
  /** Tamanhos de torta (cm / kg / fatias). Se vazio, usa o padrão do sistema. */
  tortaSizes?: TortaSizeOption[];
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
  /** Valor adicional (ex.: topo/decoração). */
  extraAmount?: number;
  status: OrderStatus;
  notes: string;
  deliveryDate: string;
  deliveryTime?: string;
  createdAt: string;
  updatedAt: string;
};
