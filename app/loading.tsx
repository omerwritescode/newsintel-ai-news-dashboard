import NewsDashboard from "@/components/ui/news-dashboard";

export default function Loading() {
  return <NewsDashboard articles={[]} loading={true} />;
}