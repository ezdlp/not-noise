import { useMemo } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from "react-simple-maps";
import { Card } from "@/components/ui/card";
import { MapIcon } from "lucide-react";

// Using a local copy of the world map data for reliability
const geoUrl = "/world-110m.json";

interface CountryData {
  country: string;
  count: number;
}

interface GeographicDistributionProps {
  data: CountryData[];
  total: number;
}

export function GeographicDistribution({
  data,
  total,
}: GeographicDistributionProps) {
  const countryColorScale = useMemo(() => {
    const maxCount = Math.max(...data.map((d) => d.count));
    return (count: number) => {
      const intensity = maxCount > 0 ? (count / maxCount) * 0.8 : 0;
      return `rgba(104, 81, 251, ${intensity + 0.1})`; // Using our primary color
    };
  }, [data]);

  const countryData = useMemo(() => {
    return data.reduce((acc, { country, count }) => {
      acc[country] = count;
      return acc;
    }, {} as Record<string, number>);
  }, [data]);

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <MapIcon className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Geographic Distribution</h2>
      </div>
      <div className="h-[400px]">
        <ComposableMap projectionConfig={{ scale: 140 }}>
          <ZoomableGroup>
            <Geographies geography={geoUrl}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const count = countryData[geo.properties.name] || 0;
                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={countryColorScale(count)}
                      stroke="#D6D6DA"
                      strokeWidth={0.5}
                      style={{
                        default: { outline: "none" },
                        hover: {
                          fill: "#6851FB",
                          outline: "none",
                          cursor: "pointer",
                        },
                        pressed: { outline: "none" },
                      }}
                    />
                  );
                })
              }
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>
      </div>
      <div className="mt-4 space-y-2">
        <h3 className="font-medium text-sm text-muted-foreground">Top Countries</h3>
        <div className="space-y-1">
          {data
            .sort((a, b) => b.count - a.count)
            .slice(0, 5)
            .map(({ country, count }) => (
              <div
                key={country}
                className="flex justify-between items-center text-sm"
              >
                <span>{country}</span>
                <span className="text-muted-foreground">
                  {((count / total) * 100).toFixed(1)}% ({count})
                </span>
              </div>
            ))}
        </div>
      </div>
    </Card>
  );
}