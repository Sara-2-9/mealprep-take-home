/**
 * One-shot real-generation smoke test (NOT committed to CI — uses the real
 * OpenAI key from .env). Run with: bun scripts/e2e-generation.ts
 */
import { generateMealPlan } from "../lib/llm/client";
import { weeklyCost } from "../lib/mealPlan";

const request = {
  budget: 60,
  dietaryNeeds: ["veggie", "gluten-free"] as never[],
  nutritionalGoals: ["high-protein"] as never[],
};

console.log(
  `Generating plan: budget €${request.budget}, needs=${request.dietaryNeeds}, goals=${request.nutritionalGoals}`,
);
const started = Date.now();
const { plan, totalCost } = await generateMealPlan(request);
const secs = ((Date.now() - started) / 1000).toFixed(1);

console.log(`\n✅ Plan generated in ${secs}s — weekly cost €${totalCost}`);
for (const day of plan.days) {
  const meal = day.meal;
  console.log(
    `${day.day.padEnd(9)} ${meal.name} — ${meal.prepTimeMinutes}min, ` +
      `${meal.servings} servings, €${meal.pricePerServing}/serving, ` +
      `${meal.ingredients.length} ingredients, ${meal.steps.length} steps`,
  );
}
console.log(`\nweeklyCost check: €${weeklyCost(plan).toFixed(2)}`);
