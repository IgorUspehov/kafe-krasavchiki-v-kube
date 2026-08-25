import scenariosData from "@/lib/niche-scenarios.json";

const SCENARIO_KEY_MAP: Record<string, string> = {
  restaurant_crm: "restaurant",
  massage_salon_crm: "massage_salon",
  car_service_crm: "car_service",
  fitness: "fitness_club",
  barbershop: "barbershop",
  car_wash: "car_wash",
  ecommerce_crm: "ecommerce",
  logistics_crm: "logistics",
  delivery: "logistics",
};

const scenarios = scenariosData as Record<string, unknown>;

export function pickNicheScenario(businessType: string) {
  const key = scenarios[businessType] ? businessType : SCENARIO_KEY_MAP[businessType] ?? businessType;
  return scenarios[key] ?? scenarios.beauty_salon;
}
