
import React from 'react';
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";

interface SpotifyStats {
  total: number;
  tracked: number;
  averageScore: number;
  recentUpdates: number;
}

interface StatsGridProps {
  stats: SpotifyStats;
}

export function StatsGrid({ stats }: StatsGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Total Pro Links</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Links with Popularity Data</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.tracked}</div>
          <div className="text-xs text-muted-foreground mt-1">
            {stats.total ? `${Math.round((stats.tracked / stats.total) * 100)}% of total` : '0%'}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Average Popularity Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.averageScore}</div>
          <div className="text-xs text-muted-foreground mt-1">
            Max score is 100
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Updates Last 7 Days</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.recentUpdates}</div>
        </CardContent>
      </Card>
    </div>
  );
}
