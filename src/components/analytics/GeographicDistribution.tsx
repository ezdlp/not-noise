import { Card } from "@/components/ui/card";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
} from "react-simple-maps";

interface GeographicDistributionProps {
  data: Array<{
    country: string;
    count: number;
  }>;
  total: number;
}

export function GeographicDistribution({ data, total }: GeographicDistributionProps) {
  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold mb-4">Geographic Distribution</h2>
      <div className="h-[400px]">
        <ComposableMap>
          <Geographies geography="/world-110m.json">
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill="#DDD"
                  stroke="#FFF"
                  strokeWidth={0.5}
                />
              ))
            }
          </Geographies>
          {data.map(({ country, count }) => (
            <div key={country} className="flex justify-between items-center mb-2">
              <span>{country}</span>
              <span className="text-muted-foreground">
                {((count / total) * 100).toFixed(1)}%
              </span>
            </div>
          ))}
        </ComposableMap>
      </div>
    </Card>
  );
}