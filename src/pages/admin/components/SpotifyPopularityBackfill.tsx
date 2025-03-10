
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BackfillControls, BackfillFooterControls } from './spotify-popularity/BackfillControls';
import { BackfillLogs } from './spotify-popularity/BackfillLogs';
import { BackfillProgress } from './spotify-popularity/BackfillProgress';
import { StatsGrid } from './spotify-popularity/StatsGrid';
import { TrendsChart } from './spotify-popularity/TrendsChart';
import { useSpotifyBackfill } from './spotify-popularity/useSpotifyBackfill';

export default function SpotifyPopularityBackfill() {
  const [activeTab, setActiveTab] = useState("backfill");
  const {
    batchSize,
    setBatchSize,
    isRunning,
    logs,
    isComplete,
    progress,
    processed,
    totalEstimate,
    error,
    stats,
    trendData,
    runBackfill,
    resetProcess
  } = useSpotifyBackfill();

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Spotify Popularity Tracking</CardTitle>
        <CardDescription>
          Track and backfill Spotify popularity data for Pro users' smart links
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="backfill">Backfill Tool</TabsTrigger>
            <TabsTrigger value="stats">Statistics</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
          </TabsList>
          
          <TabsContent value="backfill" className="space-y-4">
            <BackfillControls
              batchSize={batchSize}
              isRunning={isRunning}
              onBatchSizeChange={setBatchSize}
              onReset={resetProcess}
              onRun={runBackfill}
            />
            
            <BackfillProgress
              progress={progress}
              processed={processed}
              totalEstimate={totalEstimate}
            />
            
            <BackfillLogs
              logs={logs}
              error={error}
              isComplete={isComplete}
            />
          </TabsContent>
          
          <TabsContent value="stats">
            <StatsGrid stats={stats} />
          </TabsContent>
          
          <TabsContent value="trends">
            <TrendsChart trendData={trendData} />
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between">
        <BackfillFooterControls
          isRunning={isRunning}
          onReset={resetProcess}
          onRun={runBackfill}
        />
      </CardFooter>
    </Card>
  );
}
