
'use client';

import { useState } from 'react';
import { Map, Marker, Overlay } from 'pigeon-maps';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Station } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Droplets, MapPin, TrendingUp, X } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { StationChart } from './station-chart';

interface MapViewProps {
  stations: Station[];
}

const statusColors: { [key in Station['status']]: string } = {
  Normal: 'hsl(var(--chart-2))',
  Warning: 'hsl(var(--chart-4))',
  Critical: 'hsl(var(--destructive))',
};

export default function MapView({ stations }: MapViewProps) {
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);

  const indiaCenter: [number, number] = [20.5937, 78.9629];

  return (
    <Card className="relative">
      <CardHeader>
        <CardTitle>Geospatial Overview</CardTitle>
      </CardHeader>
      <CardContent className="aspect-[3/2] w-full p-0 overflow-hidden rounded-lg">
        <Map defaultCenter={indiaCenter} defaultZoom={5}>
          {stations.map(station => (
            <Marker
              key={station.id}
              width={30}
              anchor={[station.lat, station.lng]}
              color={statusColors[station.status]}
              onClick={() => setSelectedStation(station)}
            />
          ))}
        </Map>
      </CardContent>
      {selectedStation && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-4">
            <Card className="w-full max-w-2xl max-h-full flex flex-col">
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <CardTitle className="flex items-center gap-2">
                           <MapPin className="h-5 w-5"/> {selectedStation.name}
                        </CardTitle>
                        <Button variant="ghost" size="icon" onClick={() => setSelectedStation(null)} className="-mt-2 -mr-2">
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto space-y-4">
                    <div className="flex justify-between items-center text-sm">
                        <p className="text-muted-foreground">{selectedStation.district}, {selectedStation.state}</p>
                        <Badge 
                            className={cn(
                                selectedStation.status === 'Critical' && 'bg-destructive/80 text-destructive-foreground',
                                selectedStation.status === 'Warning' && 'bg-yellow-500/80 text-white',
                                selectedStation.status === 'Normal' && 'bg-green-500/80 text-white',
                            )}
                        >
                            {selectedStation.status}
                        </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                            <Droplets className="h-5 w-5 text-primary" />
                            <div>
                                <p className="text-muted-foreground">Current Level</p>
                                <p className="font-semibold">{selectedStation.currentLevel} m</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                           <TrendingUp className="h-5 w-5 text-primary" />
                            <div>
                                <p className="text-muted-foreground">Land Use</p>
                                <p className="font-semibold">{selectedStation.landUse}</p>
                            </div>
                        </div>
                    </div>

                   <div className='h-[200px]'>
                     <StationChart data={selectedStation.timeSeries.slice(-90)} title="90-Day Trend" description='' />
                   </div>
                </CardContent>
            </Card>
        </div>
      )}
    </Card>
  );
}
