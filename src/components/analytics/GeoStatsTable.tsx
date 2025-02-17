
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
    if (sortColumn !== column) return <ArrowUpDown className="ml-2 h-4 w-4" />;
    return sortDirection === 'asc' ? (
      <ArrowUp className="ml-2 h-4 w-4" />
    ) : (
      <ArrowDown className="ml-2 h-4 w-4" />
    );
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  return (
    <Card className="p-6">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                className="cursor-pointer hover:bg-neutral-50 transition-colors"
                onClick={() => handleSort('country')}
              >
                Country
                {getSortIcon('country')}
              </TableHead>
              <TableHead 
                className="text-right cursor-pointer hover:bg-neutral-50 transition-colors"
                onClick={() => handleSort('views')}
              >
                Views
                {getSortIcon('views')}
              </TableHead>
              <TableHead 
                className="text-right cursor-pointer hover:bg-neutral-50 transition-colors"
                onClick={() => handleSort('clicks')}
              >
                Clicks
                {getSortIcon('clicks')}
              </TableHead>
              <TableHead 
                className="text-right cursor-pointer hover:bg-neutral-50 transition-colors"
                onClick={() => handleSort('ctr')}
              >
                CTR
                {getSortIcon('ctr')}
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
