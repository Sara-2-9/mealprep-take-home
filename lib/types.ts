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
  category: { id: string; name: string };
  quantity?: string;
  price: Money;
  unitPrice?: { amount: number; unit: string };
  nutrition?: NutritionPer100g;
  nutriScore?: "a" | "b" | "c" | "d" | "e";
  novaGroup?: number;
  labels?: ProductLabel[];
  allergens?: string[];
}

export type Catalog = Product[];
