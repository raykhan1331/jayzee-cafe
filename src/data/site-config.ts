// Central editable business config — change data here, not inside components.

export const business = {
  name: "RJ Zee Cafe",
  tagline: "Made for Foodies, Built for Moments.",
  description:
    "Your next favorite food spot — delicious food, beautiful vibes, and the perfect place to enjoy, relax, and create unforgettable moments.",
  phone: "0321-470-9838",
  phoneDial: "+923214709838",
  whatsapp: "923214709838",
  address: "D-Ground, Faisalabad — Near Chacha Samosay Wala",
  mapEmbedQuery: "D-Ground, Faisalabad, Pakistan",
  hours: "12:00 PM – 2:00 AM, Daily",
  currency: "Rs.",
  delivery: {
    charge: 150,
    minOrder: 500,
    freeDeliveryOver: 3000,
    estimatedTime: "35–50 minutes",
    areas: ["D-Ground", "Susan Road", "Peoples Colony", "Madina Town", "Jinnah Colony"],
  },
  social: {
    instagram: "https://instagram.com",
    tiktok: "https://tiktok.com",
    facebook: "https://facebook.com",
  },
};

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  available: boolean;
};

export type MenuCategory = {
  id: string;
  name: string;
  items: MenuItem[];
};

export const menu: MenuCategory[] = [
  {
    id: "burgers",
    name: "Burgers",
    items: [
      {
        id: "b1",
        name: "Zee Smash Burger",
        description: "Double smash patty, cheddar, house sauce, brioche bun.",
        price: 890,
        image:
          "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80",
        available: true,
      },
      {
        id: "b2",
        name: "Spicy Zinger Stack",
        description: "Crispy fried chicken, jalapeños, spicy mayo.",
        price: 950,
        image:
          "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=600&q=80",
        available: true,
      },
    ],
  },
  {
    id: "pizza",
    name: "Pizza",
    items: [
      {
        id: "p1",
        name: "Loaded Pepperoni",
        description: "Double pepperoni, mozzarella, oregano.",
        price: 1350,
        image:
          "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80",
        available: true,
      },
      {
        id: "p2",
        name: "Farmhouse Delight",
        description: "Bell pepper, mushroom, onion, olives, mozzarella.",
        price: 1250,
        image:
          "https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?auto=format&fit=crop&w=600&q=80",
        available: true,
      },
    ],
  },
  {
    id: "coffee",
    name: "Coffee",
    items: [
      {
        id: "c1",
        name: "Caramel Latte",
        description: "Espresso, steamed milk, caramel drizzle.",
        price: 480,
        image:
          "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80",
        available: true,
      },
      {
        id: "c2",
        name: "Iced Mocha",
        description: "Espresso, chocolate, cold milk, whipped cream.",
        price: 520,
        image:
          "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=600&q=80",
        available: true,
      },
    ],
  },
  {
    id: "desserts",
    name: "Desserts",
    items: [
      {
        id: "d1",
        name: "Molten Lava Cake",
        description: "Warm chocolate cake, molten center, vanilla scoop.",
        price: 420,
        image:
          "https://images.unsplash.com/photo-1624353365286-3f8d62daad51?auto=format&fit=crop&w=600&q=80",
        available: true,
      },
      {
        id: "d2",
        name: "Classic Cheesecake",
        description: "Creamy New York style cheesecake, berry compote.",
        price: 450,
        image:
          "https://images.unsplash.com/photo-1524351199678-941a58a3df50?auto=format&fit=crop&w=600&q=80",
        available: true,
      },
    ],
  },
];

// Midnight Deal — active daily between startHour and endHour (cafe local time).
export const midnightDeal = {
  active: true,
  startHour: 0,
  endHour: 3,
  discountPercent: 15,
  title: "🌙 MIDNIGHT DEAL",
  headline: "MIDNIGHT CRAVINGS? WE GOT YOU.",
  description:
    "Special late-night deals for the people who believe the best food moments happen after midnight.",
};
