import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "V9 Showcase | SAAS IDEA AI MVP FACTORY",
  description: "Превращаем бизнес-идею в готовый MVP — демонстрационная витрина для V9 Market Validation",
};

export default function V9ShowcaseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
