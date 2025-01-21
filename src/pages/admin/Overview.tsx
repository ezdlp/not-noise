import { Card } from "@/components/ui/card";

function Overview() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Overview</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <h3 className="font-medium">Total Smart Links</h3>
          <p className="text-2xl font-bold">0</p>
        </Card>
        <Card className="p-4">
          <h3 className="font-medium">Total Views</h3>
          <p className="text-2xl font-bold">0</p>
        </Card>
        <Card className="p-4">
          <h3 className="font-medium">Total Clicks</h3>
          <p className="text-2xl font-bold">0</p>
        </Card>
        <Card className="p-4">
          <h3 className="font-medium">Average CTR</h3>
          <p className="text-2xl font-bold">0%</p>
        </Card>
      </div>
    </div>
  );
}

export default Overview;