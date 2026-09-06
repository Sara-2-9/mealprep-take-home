export interface Money {
  amount: number;
  currency: string;
}

export interface NutritionPer100g {
  energyKcal100g?: number;
  fat100g?: number;
  saturatedFat100g?: number;
  carbohydrates100g?: number;
  sugars100g?: number;
  fiber100g?: number;
  proteins100g?: number;
  salt100g?: number;
}

export interface ProductLabel {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  barcode: string;
  name: string;
  brand?: string;
  department: { id: string; name: string };
  /** 93 catalog products have a null category — always guard access */
  category?: { id: string; name: string } | null;
  quantity?: string;
  price: Money;
  unitPrice?: { amount: number; unit: string };
  nutrition?: NutritionPer100g;
  nutriScore?: "a" | "b" | "c" | "d" | "e";
  novaGroup?: number;
  labels?: ProductLabel[];
  /** Allergen entries are { id, name } objects, e.g. { id: "en:gluten" } */
  allergens?: ProductLabel[];
}

export type Catalog = Product[];
