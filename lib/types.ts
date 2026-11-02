export type Product = {
  id: string;
  name: string;
  brand: string;
  category: string;
  pack: string;
  price: number | null;
  postalCode: string;
  updatedAt: string;
  observedAt: string | null;
  source: "mercadona-online" | "manual";
  sourceUrl: string;
  aliases: string[];
  verified: boolean;
};

export type RecipeIngredient = { name: string; quantity: string; category: string };

export type Recipe = {
  id: string;
  name: string;
  meal: "Desayuno" | "Comida" | "Merienda" | "Cena";
  time: number;
  ingredients: RecipeIngredient[];
  instructions: string[];
  tags: string[];
};

export type PlannedMeal = {
  id: string;
  date: string;
  meal: Recipe["meal"];
  recipeId: string;
  servings: number;
  approved: boolean;
};

export type PantryItem = { productId: string; enough: boolean };

export type ShoppingItem = {
  id: string;
  name: string;
  category: string;
  quantity: string;
  productId: string | null;
  price: number | null;
  bought: boolean;
  paidPrice: number | null;
};

export type ShoppingDate = { id: string; date: string };

export type Household = {
  name: string;
  budget: number;
  postalCode: string;
  adults: number;
  children: { small: number; primary: number; teen: number };
  priority: "ahorro";
  cooking: "diario" | "batch" | "mixto";
  meals: string[];
  exclusions: string;
  allergies: string;
  essentials: string;
};

export type AppData = {
  household: Household;
  products: Product[];
  recipes: Recipe[];
  menu: PlannedMeal[];
  pantry: PantryItem[];
  shopping: ShoppingItem[];
  shoppingDates: ShoppingDate[];
  month: string;
  onboarded: boolean;
};

