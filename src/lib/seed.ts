import { StoreData } from "./types";

export const defaultStore: StoreData = {
  settings: {
    storeName: "MK Gourmet",
    tagline: "Peças feitas com carinho, do nosso ateliê para a sua casa.",
    whatsapp: "5511999999999",
    about:
      "Uma loja acolhedora para descobrir novidades, promoções e encomendar pelo WhatsApp com facilidade.",
  },
  products: [
    {
      id: "p1",
      name: "Kit Presente Latte",
      description:
        "Seleção especial com aroma suave e embalagem delicada — ideal para presentear.",
      price: 89.9,
      image:
        "https://images.unsplash.com/photo-1511920170033-f8396924c348?w=800&q=80",
      category: "Kits",
      featured: true,
      active: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: "p2",
      name: "Vela Caramelo",
      description:
        "Vela artesanal com notas quentes de caramelo e baunilha. Queima limpa e aconchegante.",
      price: 54.0,
      image:
        "https://images.unsplash.com/photo-1603006905003-be475563bc59?w=800&q=80",
      category: "Casa",
      featured: true,
      active: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: "p3",
      name: "Sachê Espresso",
      description:
        "Sachê aromático com fragrância intensa — perfeito para gavetas e closets.",
      price: 28.5,
      image:
        "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80",
      category: "Aromas",
      featured: false,
      active: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: "p4",
      name: "Caixa Mocha Especial",
      description:
        "Caixa com itens selecionados da temporada. Quantidade limitada.",
      price: 129.0,
      image:
        "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800&q=80",
      category: "Kits",
      featured: true,
      active: true,
      createdAt: new Date().toISOString(),
    },
  ],
  promotions: [
    {
      id: "promo1",
      title: "Combo Café da Manhã",
      description: "Leve 2 itens da linha aromas e ganhe frete especial na região.",
      discountLabel: "15% OFF",
      image:
        "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=1000&q=80",
      active: true,
      createdAt: new Date().toISOString(),
    },
  ],
  news: [
    {
      id: "n1",
      title: "Nova coleção de outono",
      content:
        "Chegaram peças com tons terrosos e acabamento artesanal. Confira no catálogo e peça pelo WhatsApp.",
      image:
        "https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=1000&q=80",
      active: true,
      createdAt: new Date().toISOString(),
    },
  ],
};
