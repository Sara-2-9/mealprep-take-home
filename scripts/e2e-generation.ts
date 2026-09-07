/**
 * One-shot real-generation smoke test (NOT committed to CI — uses the real
 * OpenAI key from .env). Run with: bun scripts/e2e-generation.ts
 *
 * v2: 3 meals per day (breakfast, lunch, dinner).
 */
import { generateMealPlan } from "../src/lib/llm/client";
import { weeklyCost } from "../src/lib/meal-plan";

const request = {
  budget: 120,
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
  console.log(`\n📅 ${day.day}:`);
  for (const meal of day.meals) {
    console.log(
      `  ${meal.type.padEnd(10)} ${meal.name} — ${meal.prepTimeMinutes}min, ` +
        `${meal.servings} servings, €${meal.pricePerServing}/serving, ` +
        `${meal.ingredients.length} ingredients, ${meal.steps.length} steps`,
    );
  }
}
console.log(`\nweeklyCost check: €${weeklyCost(plan).toFixed(2)}`);
