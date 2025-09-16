import type { Station, TimeSeriesData } from './types';

const stationsMeta = [
  { id: "DLW12345", name: "Lucknow Central", lat: 26.8467, lng: 80.9462, district: "Lucknow", state: "UP", landUse: 'Urban' as const },
  { id: "DLW12346", name: "Kanpur Industrial", lat: 26.4499, lng: 80.3319, district: "Kanpur", state: "UP", landUse: 'Industrial' as const },
  { id: "DLW12347", name: "Agra Agricultural", lat: 27.1767, lng: 78.0081, district: "Agra", state: "UP", landUse: 'Agriculture' as const },
  { id: "DLW12348", name: "Varanasi Urban", lat: 25.3176, lng: 82.9739, district: "Varanasi", state: "UP", landUse: 'Urban' as const },
  { id: "DLW12349", name: "Allahabad Junction", lat: 25.4358, lng: 81.8463, district: "Prayagraj", state: "UP", landUse: 'Urban' as const },
  { id: "DLW12350", name: "Meerut Rural", lat: 28.9845, lng: 77.7064, district: "Meerut", state: "UP", landUse: 'Rural' as const },
  { id: "DLW12351", name: "Ghaziabad Metro", lat: 28.6692, lng: 77.4538, district: "Ghaziabad", state: "UP", landUse: 'Industrial' as const },
  { id: "DLW12352", name: "Bareilly North", lat: 28.3670, lng: 79.4304, district: "Bareilly", state: "UP", landUse: 'Agriculture' as const },
];

const getStatus = (level: number): 'Critical' | 'Warning' | 'Normal' => {
  if (level < 5) return "Critical";
  if (level < 10) return "Warning";
  return "Normal";
};

// A simple pseudo-random number generator to ensure deterministic data
const seededRandom = (seed: number) => {
    let s = Math.sin(seed) * 10000;
    return s - Math.floor(s);
};

const generateTimeSeries = (baseLevel: number, seed: number): TimeSeriesData[] => {
  const data: TimeSeriesData[] = [];
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - (364 - i));
    const variation = (seededRandom(seed + i) - 0.5) * 2;
    const seasonal = Math.sin((date.getMonth() / 12) * 2 * Math.PI) * 2;
    const level = Math.max(0.5, baseLevel + variation + seasonal);
    data.push({
      date: date.toISOString().split('T')[0],
      level: Math.round(level * 100) / 100,
    });
  }
  return data;
};

const generateMockData = (): Station[] => {
  return stationsMeta.map((station, index) => {
    const seed = index + 1; // Use index as part of the seed
    const baseLevel = (seededRandom(seed) * 18) + 2; // Base level between 2 and 20
    const timeSeries = generateTimeSeries(baseLevel, seed);
    const currentLevel = timeSeries[timeSeries.length - 1].level;
    const status = getStatus(currentLevel);

    return {
      ...station,
      currentLevel,
      status,
      timeSeries,
    };
  });
};

export const mockStationData = generateMockData();
