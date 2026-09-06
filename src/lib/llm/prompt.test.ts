import { describe, expect, test } from "bun:test";
import { buildMealPlanMessages, buildRetryMessage } from "./prompt";

const BASE = {
  budget: 80,
  dietaryNeeds: [] as never[],
  nutritionalGoals: [] as never[],
};

describe("buildMealPlanMessages", () => {
  test("returns a system + user message pair", () => {
    const [system, user] = buildMealPlanMessages(BASE);
    expect(system.role).toBe("system");
    expect(user.role).toBe("user");
    expect(typeof system.content).toBe("string");
    expect(typeof user.content).toBe("string");
  });

  test("interpolates the budget into the hard constraint", () => {
    const [system, user] = buildMealPlanMessages({ ...BASE, budget: 45 });
    expect(system.content as string).toContain("≤ €45");
    expect(user.content as string).toContain("Weekly budget: €45.");
  });

  test("forbids the model from estimating prices", () => {
    const [system] = buildMealPlanMessages(BASE);
    expect(system.content as string).toContain(
      "NEVER estimate or output prices",
    );
    expect(system.content as string).toContain("grams");
  });

  test("maps dietary needs and goals to human labels", () => {
    const [, user] = buildMealPlanMessages({
      ...BASE,
      dietaryNeeds: ["veggie"],
      nutritionalGoals: ["high-protein", "low-salt"],
    });
    const content = user.content as string;
    expect(content).toContain("Dietary needs: vegetarian (no meat, no fish).");
    expect(content).toContain("Nutritional goals: high protein, low salt.");
  });

  test('collapses "none" and empty selections to "none"', () => {
    const cases: import("../../state/flow-store").DietaryNeed[][] = [
      [],
      ["none"],
    ];
    for (const dietaryNeeds of cases) {
      const [, user] = buildMealPlanMessages({ ...BASE, dietaryNeeds });
      expect(user.content as string).toContain("Dietary needs: none.");
    }
  });

  test("basket lines carry unit price, macros and nutri-score", () => {
    const [, user] = buildMealPlanMessages(BASE);
    const content = user.content as string;
    expect(content).toContain("Catalog basket");
    expect(content).toContain("€/kg");
    expect(content).toContain("per 100g");
    expect(content).toContain("nutri-score");
  });

  test("dietary filtering is reflected in the basket", () => {
    const [, unrestricted] = buildMealPlanMessages(BASE);
    const [, vegan] = buildMealPlanMessages({
      ...BASE,
      dietaryNeeds: ["vegan"],
    });
    // Vegan filtering removes carne/pesce/salumi/latticini departments
    expect((vegan.content as string).length).toBeLessThan(
      (unrestricted.content as string).length,
    );
  });
});

describe("buildRetryMessage", () => {
  test("carries the rejection reason back to the model", () => {
    const msg = buildRetryMessage("weekly cost €99 exceeds the €80 budget");
    expect(msg.role).toBe("user");
    expect(msg.content as string).toContain("€99 exceeds the €80 budget");
  });
});
