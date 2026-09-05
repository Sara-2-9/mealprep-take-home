import rawCatalog from "../data/product_catalog_en.json";
import type { Catalog, Product } from "./types";

const catalog = rawCatalog as unknown as Catalog;

/** Indexes built once at module load to keep queries O(1)/cheap. */
const byId = new Map(catalog.map((p) => [p.id, p]));
const byDepartment = new Map<string, Product[]>();
const byLabel = new Map<string, Product[]>();

for (const product of catalog) {
  const dept = product.department?.id;
  if (dept) {
    const list = byDepartment.get(dept) ?? [];
    list.push(product);
    byDepartment.set(dept, list);
  }
  for (const label of product.labels ?? []) {
    const list = byLabel.get(label.id) ?? [];
    list.push(product);
    byLabel.set(label.id, list);
  }
}

export function getCatalog(): Catalog {
  return catalog;
}

export function getProductById(id: string): Product | undefined {
  return byId.get(id);
}

export function getByDepartment(departmentId: string): Product[] {
  return byDepartment.get(departmentId) ?? [];
}

export function getByLabel(labelId: string): Product[] {
  return byLabel.get(labelId) ?? [];
}

export function listLabelIds(): string[] {
  return [...byLabel.keys()];
}

export function listDepartments(): string[] {
  return [...byDepartment.keys()];
}

export function catalogSize(): number {
  return catalog.length;
}
