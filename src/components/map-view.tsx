
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Station } from '@/lib/types';

interface MapViewProps {
  stations: Station[];
}

export default function MapView({ stations }: MapViewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Geospatial Overview</CardTitle>
      </CardHeader>
      <CardContent className="aspect-[3/2] w-full p-0 relative overflow-hidden rounded-lg">
        <iframe
          src="https://bhuvan-app1.nrsc.gov.in/gwis/gwis.php"
          title="Bhuvan Geo-Portal"
          className="w-full h-full border-0"
        />
      </CardContent>
    </Card>
  );
}
