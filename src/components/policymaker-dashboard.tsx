

'use client';

import { Droplets, MapPin, ShieldAlert, BarChart, Lightbulb, TrendingUp, Download, ChevronsRight, ArrowDownRight, ArrowUpRight, AlertTriangle } from 'lucide-react';
import type { Station, TimeSeriesData } from '@/lib/types';
import { MetricCard } from './metric-card';
import { StationChart } from './station-chart';
import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bar, BarChart as RechartsBarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, AreaChart, Area } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import dynamic from 'next/dynamic';
import { Button } from './ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { cn } from '@/lib/utils';
import { Badge } from './ui/badge';

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
  const { 
      totalStations, 
      criticalCount, 
      warningCount, 
      normalCount, 
      overallTimeSeries, 
      maharashtraStations, 
      maharashtraDistrictStatus,
      topMaharashtraCities,
      rankedCities
  } = useMemo(() => {
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

    const populations: {[key: string]: number} = { "Pune": 3124458, "Nagpur": 2405665, "Nashik": 1486053, "Aurangabad": 1175116, "Solapur": 951558, "Mumbai": 12442373 };
    const topMaharashtraCities = maharashtraStations
        .filter(s => Object.keys(populations).includes(s.district))
        .sort((a, b) => (populations[b.district] || 0) - (populations[a.district] || 0))
        .slice(0, 6);

    const rankedCities = maharashtraStations.map(station => {
        const preMonsoon = station.timeSeries.find(d => new Date(d.date).getMonth() === 4); // May
        const postMonsoon = station.timeSeries.find(d => new Date(d.date).getMonth() === 10); // November
        let change = 0;
        if(preMonsoon && postMonsoon) {
            change = ((postMonsoon.level - preMonsoon.level) / preMonsoon.level) * 100;
        }
        return { ...station, change };
    }).sort((a, b) => b.change - a.change);


    return { totalStations, criticalCount, warningCount, normalCount, overallTimeSeries, maharashtraStations, maharashtraDistrictStatus, topMaharashtraCities, rankedCities };
  }, [stations]);

  // Mock data for graphic strategies
  const graphicStrategies = {
    labels: ['Water Harvesting', 'Crop Rotation', 'Drip Irrigation', 'Reduce Pumping', 'Awareness'],
    data: [75, 60, 85, 50, 70],
  };

  const policySummaryPoints = [
      { title: 'Top Cities with Declining Trends', content: 'Nagpur, Pune, and Nashik show the most significant 10-year declining groundwater trends, indicating severe long-term stress. Immediate demand-side management is crucial.', icon: <TrendingUp className="text-destructive"/> },
      { title: 'Strong Post-Monsoon Recovery', content: 'Stations in Aurangabad and Solapur show strong post-monsoon recovery, suggesting effective natural recharge in these basalt aquifer regions.', icon: <TrendingUp className="text-green-500" /> },
      { title: 'Suggested Local Interventions', content: 'For hard-rock aquifers in Pune and Nashik, prioritize artificial recharge through injection wells and check dams. In alluvial areas of Nagpur, promote rainwater harvesting.', icon: <Lightbulb /> },
  ]

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
                <MapView 
                    stations={stations}
                    center={[20.5937, 78.9629]}
                    zoom={5}
                    title="Geospatial Overview"
                />
                <StationChart 
                    data={overallTimeSeries}
                    title="Overall Groundwater Trend"
                    description="Average groundwater level across all stations for the last 90 days."
                />
            </div>
        </TabsContent>
        <TabsContent value="maharashtra" className="mt-6 space-y-6">
             <div className="grid gap-6 lg:grid-cols-3">
                <div className='lg:col-span-2'>
                    <MapView 
                        stations={maharashtraStations}
                        center={[19.7515, 75.7139]}
                        zoom={6}
                        title="Maharashtra Geospatial Overview"
                        showDepthCategory
                    />
                </div>
                <div className='space-y-4'>
                    <Card>
                        <CardHeader>
                            <CardTitle className='text-lg'>Policy Summary</CardTitle>
                        </CardHeader>
                        <CardContent className='space-y-4'>
                           {policySummaryPoints.map((point, index) => (
                               <div key={index} className='flex items-start gap-3'>
                                   <div className='text-primary mt-1'>{point.icon}</div>
                                   <div>
                                       <h4 className='font-semibold'>{point.title}</h4>
                                       <p className='text-sm text-muted-foreground'>{point.content}</p>
                                   </div>
                               </div>
                           ))}
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle className='text-lg'>Data Export</CardTitle>
                        </CardHeader>
                        <CardContent className='flex gap-4'>
                           <Button variant="outline"><Download className='mr-2 h-4 w-4'/> Download CSV</Button>
                           <Button variant="outline"><ChevronsRight className='mr-2 h-4 w-4'/> Sample JSON</Button>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Groundwater Trends: Top 6 Cities by Population</CardTitle>
                    <CardDescription>Time-series data for the last 5 years.</CardDescription>
                </CardHeader>
                <CardContent className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
                    {topMaharashtraCities.map(city => (
                        <div key={city.id} className='h-[200px]'>
                             <h4 className='text-sm font-semibold mb-2 flex items-center gap-2'>
                                {city.name}
                                {city.status === 'Critical' && <AlertTriangle className="h-4 w-4 text-destructive" />}
                            </h4>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={city.timeSeries.slice(-365*5)}>
                                    <defs>
                                        <linearGradient id={`color${city.id}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="date" tickFormatter={(value) => new Date(value).getFullYear().toString()} tick={{fontSize: 12}} />
                                    <YAxis domain={['dataMin - 2', 'dataMax + 2']} tick={{fontSize: 12}}/>
                                    <Tooltip contentStyle={{fontSize: '12px'}}/>
                                    <Area type="monotone" dataKey="level" stroke="hsl(var(--primary))" fillOpacity={1} fill={`url(#color${city.id})`} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    ))}
                </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
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
                        <CardTitle>Pre vs. Post-Monsoon Change</CardTitle>
                        <CardDescription>Ranked list of cities by % groundwater level change.</CardDescription>
                    </CardHeader>
                    <CardContent>
                       <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>City</TableHead>
                                    <TableHead className='text-right'>% Change</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {rankedCities.slice(0, 5).map(city => (
                                    <TableRow key={city.id}>
                                        <TableCell>{city.name}</TableCell>
                                        <TableCell className='text-right'>
                                            <Badge variant={city.change > 0 ? "default" : "destructive"} className='flex items-center gap-1 w-fit ml-auto'>
                                                {city.change > 0 ? <ArrowUpRight className='h-3 w-3' /> : <ArrowDownRight className='h-3 w-3' />}
                                                {city.change.toFixed(2)}%
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                       </Table>
                    </CardContent>
                </Card>
            </div>
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
