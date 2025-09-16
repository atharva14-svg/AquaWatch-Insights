export interface TimeSeriesData {
  date: string;
  level: number;
}

export interface Station {
  id: string;
  name: string;
  lat: number;
  lng: number;
  district: string;
  state: string;
  currentLevel: number;
  status: 'Critical' | 'Warning' | 'Normal';
  landUse: 'Agriculture' | 'Urban' | 'Industrial' | 'Rural';
  timeSeries: TimeSeriesData[];
}
