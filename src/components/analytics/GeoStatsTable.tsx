
import { useState, useMemo } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { countries } from "@/lib/countries";
import { cn } from "@/lib/utils";

interface GeoStats {
  countryCode: string;
  views: number;
  clicks: number;
  ctr: number;
}

type SortColumn = 'country' | 'views' | 'clicks' | 'ctr';
type SortDirection = 'asc' | 'desc';

interface GeoStatsTableProps {
  data: GeoStats[];
}

export function GeoStatsTable({ data }: GeoStatsTableProps) {
  const [sortColumn, setSortColumn] = useState<SortColumn>('views');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
      const modifier = sortDirection === 'asc' ? 1 : -1;
      
      if (sortColumn === 'country') {
        const countryA = countries.find(c => c.code === a.countryCode)?.name || 'Unknown';
        const countryB = countries.find(c => c.code === b.countryCode)?.name || 'Unknown';
        return countryA.localeCompare(countryB) * modifier;
      }
      
      return (a[sortColumn] - b[sortColumn]) * modifier;
    });
  }, [data, sortColumn, sortDirection]);

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  const getSortIcon = (column: SortColumn) => {
    if (column === sortColumn) {
      return sortDirection === 'asc' ? (
        <ArrowUp className="ml-2 h-4 w-4 text-primary" />
      ) : (
        <ArrowDown className="ml-2 h-4 w-4 text-primary" />
      );
    }
    return <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />;
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-6 text-[#111827] font-poppins">Geographic Breakdown</h2>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                className={cn(
                  "group cursor-pointer hover:bg-neutral-50 transition-colors w-[200px]",
                  sortColumn === 'country' && "text-primary"
                )}
                onClick={() => handleSort('country')}
              >
                <div className="flex items-center">
                  Country
                  {getSortIcon('country')}
                </div>
              </TableHead>
              <TableHead 
                className={cn(
                  "group cursor-pointer hover:bg-neutral-50 transition-colors text-right",
                  sortColumn === 'views' && "text-primary"
                )}
                onClick={() => handleSort('views')}
              >
                <div className="flex items-center justify-end">
                  Views
                  {getSortIcon('views')}
                </div>
              </TableHead>
              <TableHead 
                className={cn(
                  "group cursor-pointer hover:bg-neutral-50 transition-colors text-right",
                  sortColumn === 'clicks' && "text-primary"
                )}
                onClick={() => handleSort('clicks')}
              >
                <div className="flex items-center justify-end">
                  Clicks
                  {getSortIcon('clicks')}
                </div>
              </TableHead>
              <TableHead 
                className={cn(
                  "group cursor-pointer hover:bg-neutral-50 transition-colors text-right",
                  sortColumn === 'ctr' && "text-primary"
                )}
                onClick={() => handleSort('ctr')}
              >
                <div className="flex items-center justify-end">
                  CTR
                  {getSortIcon('ctr')}
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  No geographic data available
                </TableCell>
              </TableRow>
            ) : (
              sortedData.map((row) => (
                <TableRow key={row.countryCode}>
                  <TableCell className="font-medium">
                    {countries.find(c => c.code === row.countryCode)?.name || 'Unknown'}
                  </TableCell>
                  <TableCell className="text-right">{formatNumber(row.views)}</TableCell>
                  <TableCell className="text-right">{formatNumber(row.clicks)}</TableCell>
                  <TableCell className="text-right">
                    {(row.ctr * 100).toFixed(1)}%
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
