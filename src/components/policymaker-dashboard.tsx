
'use client';

import { Droplets, MapPin, ShieldAlert } from 'lucide-react';
import type { Station, TimeSeriesData } from '@/lib/types';
import { MetricCard } from './metric-card';
import MapView from './map-view';
import { StationChart } from './station-chart';
import { useMemo } from 'react';

interface PolicymakerDashboardProps {
  stations: Station[];
}

export default function PolicymakerDashboard({ stations }: PolicymakerDashboardProps) {
  const { totalStations, criticalCount, warningCount, normalCount, overallTimeSeries } = useMemo(() => {
    const totalStations = stations.length;
    let criticalCount = 0;
    let warningCount = 0;
    let normalCount = 0;
    
    stations.forEach(station => {
      if (station.status === 'Critical') criticalCount++;
      else if (station.status === 'Warning') warningCount++;
      else normalCount++;
    });

    const aggregatedLevels: { [date: string]: { sum: number; count: number } } = {};
    stations.forEach(station => {
      station.timeSeries.slice(-90).forEach(dataPoint => {
        if (!aggregatedLevels[dataPoint.date]) {
          aggregatedLevels[dataPoint.date] = { sum: 0, count: 0 };
        }
        aggregatedLevels[dataPoint.date].sum += dataPoint.level;
        aggregatedLevels[dataPoint.date].count++;
      });
    });

    const overallTimeSeries: TimeSeriesData[] = Object.entries(aggregatedLevels)
      .map(([date, { sum, count }]) => ({
        date,
        level: parseFloat((sum / count).toFixed(2)),
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());


    return { totalStations, criticalCount, warningCount, normalCount, overallTimeSeries };
  }, [stations]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Total Stations" value={totalStations} icon={<MapPin />} />
        <MetricCard title="Critical Stations" value={criticalCount} icon={<ShieldAlert />} status="Critical" />
        <MetricCard title="Warning Stations" value={warningCount} icon={<ShieldAlert />} status="Warning" />
        <MetricCard title="Normal Stations" value={normalCount} icon={<Droplets />} status="Normal" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <MapView stations={stations} />
        <StationChart 
            data={overallTimeSeries}
            title="Overall Groundwater Trend"
            description="Average groundwater level across all stations for the last 90 days."
        />
      </div>
    </div>
  );
}
