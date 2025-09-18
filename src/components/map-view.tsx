
'use client';

import { MapPin, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Station } from '@/lib/types';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface MapViewProps {
  stations: Station[];
}

const statusColorMap = {
  Normal: 'text-green-500',
  Warning: 'text-yellow-500',
  Critical: 'text-destructive',
};

// These are approximate coordinates for the bounding box of India to scale lat/lng
const INDIA_BOUNDS = {
  latMin: 6.5,
  latMax: 35.5,
  lngMin: 68.0,
  lngMax: 97.5,
};

export default function MapView({ stations }: MapViewProps) {
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);

  const getPosition = (lat: number, lng: number) => {
    const top = ((INDIA_BOUNDS.latMax - lat) / (INDIA_BOUNDS.latMax - INDIA_BOUNDS.latMin)) * 100;
    const left = ((lng - INDIA_BOUNDS.lngMin) / (INDIA_BOUNDS.lngMax - INDIA_BOUNDS.lngMin)) * 100;
    return { top: `${top}%`, left: `${left}%` };
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Geospatial Overview</CardTitle>
      </CardHeader>
      <CardContent className="aspect-[3/2] w-full p-0 relative overflow-hidden rounded-lg bg-gray-200">
        <div className="w-full h-full bg-blue-100">
           {/* A simple background map can be an SVG or another low-res image here if needed */}
        </div>

        {stations.map((station) => (
          <div
            key={station.id}
            className="absolute -translate-x-1/2 -translate-y-1/2 transform cursor-pointer group"
            style={getPosition(station.lat, station.lng)}
            onClick={() => setSelectedStation(station)}
          >
            <MapPin className={cn('h-6 w-6', statusColorMap[station.status], 'transition-transform group-hover:scale-125')} />
            <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-max px-2 py-1 text-xs text-white bg-gray-800 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
              {station.name}
            </span>
          </div>
        ))}
        
        {selectedStation && (
            <div 
                className="absolute top-0 left-0 m-2 bg-white rounded-lg shadow-lg p-3 max-w-xs z-10 border"
                style={{ ...getPosition(selectedStation.lat, selectedStation.lng), top: 'auto', left: 'auto', right: '0.5rem', bottom: '0.5rem' }}
                onClick={(e) => e.stopPropagation()}
            >
                <button 
                    onClick={() => setSelectedStation(null)}
                    className="absolute top-1 right-1 text-gray-500 hover:text-gray-800"
                >
                    <X className="h-4 w-4" />
                </button>
                <h4 className="font-bold text-sm mb-1">{selectedStation.name}</h4>
                <p className="text-xs text-muted-foreground">{selectedStation.district}, {selectedStation.state}</p>
                <div className="mt-2 text-xs space-y-1">
                    <p>Level: <span className="font-semibold">{selectedStation.currentLevel}m</span></p>
                    <p>Status: <span className={cn('font-semibold', statusColorMap[selectedStation.status])}>{selectedStation.status}</span></p>
                </div>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
