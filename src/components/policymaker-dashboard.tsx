

'use client';

import { Droplets, MapPin, ShieldAlert, BarChart, Lightbulb, TrendingUp } from 'lucide-react';
import type { Station, TimeSeriesData } from '@/lib/types';
import { MetricCard } from './metric-card';
import { StationChart } from './station-chart';
import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bar, BarChart as RechartsBarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import dynamic from 'next/dynamic';

const MapView = dynamic(() => import('./map-view'), { ssr: false });


interface PolicymakerDashboardProps {
  stations: Station[];
}

interface DistrictStatus {
  district: string;
  Critical: number;
  Warning: number;
  Normal: number;
}

export default function PolicymakerDashboard({ stations }: PolicymakerDashboardProps) {
  const { totalStations, criticalCount, warningCount, normalCount, overallTimeSeries, maharashtraDistrictStatus } = useMemo(() => {
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
    
    const maharashtraStations = stations.filter(s => s.state === 'Maharashtra');
    const districtStatusMap: {[key: string]: DistrictStatus} = {};
    maharashtraStations.forEach(station => {
        if(!districtStatusMap[station.district]) {
            districtStatusMap[station.district] = { district: station.district, Critical: 0, Warning: 0, Normal: 0 };
        }
        districtStatusMap[station.district][station.status]++;
    });
    const maharashtraDistrictStatus = Object.values(districtStatusMap);

    return { totalStations, criticalCount, warningCount, normalCount, overallTimeSeries, maharashtraDistrictStatus };
  }, [stations]);

  // Mock data for graphic strategies
  const graphicStrategies = {
    labels: ['Water Harvesting', 'Crop Rotation', 'Drip Irrigation', 'Reduce Pumping', 'Awareness'],
    data: [75, 60, 85, 50, 70],
  };

  return (
    <Tabs defaultValue="overview">
        <TabsList>
            <TabsTrigger value="overview">Overall Overview</TabsTrigger>
            <TabsTrigger value="maharashtra">Maharashtra View</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-6 space-y-6">
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
        </TabsContent>
        <TabsContent value="maharashtra" className="mt-6 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BarChart className="h-5 w-5 text-primary" />
                        District-wise Station Status in Maharashtra
                    </CardTitle>
                    <CardDescription>
                        Number of stations in Critical, Warning, and Normal status for each district.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <RechartsBarChart data={maharashtraDistrictStatus}>
                            <XAxis dataKey="district" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="Critical" fill="hsl(var(--destructive))" />
                            <Bar dataKey="Warning" fill="hsl(var(--chart-4))" />
                            <Bar dataKey="Normal" fill="hsl(var(--chart-2))" />
                        </RechartsBarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Lightbulb className="h-5 w-5 text-primary" />
                        Graphic Conservation Strategies
                    </CardTitle>
                    <CardDescription>AI-suggested strategies to improve groundwater levels.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <RechartsBarChart data={graphicStrategies.labels.map((label, index) => ({ name: label, value: graphicStrategies.data[index] }))} layout="vertical">
                            <XAxis type="number" />
                            <YAxis type="category" dataKey="name" width={120} />
                            <Tooltip />
                            <Bar dataKey="value" fill="hsl(var(--primary))" name="Effectiveness (%)" />
                        </RechartsBarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </TabsContent>
    </Tabs>
  );
}
