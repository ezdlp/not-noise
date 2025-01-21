import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { SmartLinksList } from "@/components/dashboard/SmartLinksList";

export default function Dashboard() {
  return (
    <div className="container mx-auto py-8 px-4">
      <DashboardStats />
      <div className="mt-8">
        <SmartLinksList />
      </div>
    </div>
  );
}