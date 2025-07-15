import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { MenuDisplay } from "@/components/menu-display";
import { FilterProvider } from "@/context/filter-context";
import FilterBar from "@/components/FilterBar";
import { VirtualBaristaChat } from "@/components/virtual-barista-chat";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  image_url: string | null;
  category: string | null;
  tags: string[] | null;
  created_at: string | null;
  is_active: boolean;
}

interface Experience {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  image_url: string | null;
  category: string | null;
  duration_minutes: number | null;
  tags: string[] | null;
  created_at: string | null;
  is_active: boolean;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
}

export const metadata = {
  title: "The Water Bar | Hydration & Wellness",
};

export default async function HomePage() {
  const supabase = await createClient();

  const { data: drinksData, error: drinksError } = await supabase
    .from("products")
    .select<"*", Product>("*")
    .eq("is_active", true);
  const { data: wellnessData, error: wellnessError } = await supabase
    .from("experiences")
    .select<"*", Experience>("*")
    .eq("is_active", true);

  if (drinksError) {
    console.error("Error fetching drinks:", drinksError.message);
  }
  if (wellnessError) {
    console.error("Error fetching wellness experiences:", wellnessError.message);
  }

  const drinks: MenuItem[] = (drinksData || []).map((d: Product) => ({
    id: d.id,
    name: d.name,
    description: d.description || "No description available.",
    price: d.price || 0,
    image: d.image_url || "/refreshing-summer-drink.png",
  }));

  const wellnessExperiences: MenuItem[] = (wellnessData || []).map((w: Experience) => ({
    id: w.id,
    name: w.name,
    description: w.description || "No description available.",
    price: w.price || 0,
    image: w.image_url || "/holistic-wellness.png",
  }));

  const allMenuItems = [...drinks, ...wellnessExperiences];

  return (
    <FilterProvider>
      <div className="w-full bg-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
          <div className="my-2 w-full">
            <FilterBar />
          </div>
          <MenuDisplay
            initialDrinks={drinks}
            initialWellnessExperiences={wellnessExperiences}
          />
        </div>
      </div>
      <VirtualBaristaChat menuItems={allMenuItems} />
    </FilterProvider>
  );
}