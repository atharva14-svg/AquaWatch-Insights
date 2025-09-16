import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function MapView() {
  const mapImage = PlaceHolderImages.find(img => img.id === 'india-map');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Geospatial Overview</CardTitle>
      </CardHeader>
      <CardContent className="aspect-[3/2] w-full">
        {mapImage && (
          <div className="relative h-full w-full overflow-hidden rounded-lg">
            <Image
              src={mapImage.imageUrl}
              alt={mapImage.description}
              fill
              className="object-cover"
              data-ai-hint={mapImage.imageHint}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
