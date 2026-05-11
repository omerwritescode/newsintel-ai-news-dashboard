export const dynamic = "force-dynamic";

import { supabase } from "@/lib/supabase";
import NewsDashboard from "@/components/ui/news-dashboard";

async function getArticles() {
  const { data, error } = await supabase
    .from("articles")
    .select("*")
    .order("published_at", { ascending: false });

  if (error) {
    console.error(error);
    return [];
  }

  return data;
} 

export default async function Home() {
  const articles = await getArticles();

  return <NewsDashboard articles={articles ?? []} />;
}