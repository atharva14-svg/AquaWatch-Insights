'use client';

import { predictGroundwaterLevels } from '@/ai/flows/predict-groundwater-levels';
import { suggestConservationStrategies } from '@/ai/flows/suggest-conservation-strategies';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { zodResolver } from '@hookform/resolvers/zod';
import { BrainCircuit, Droplets, Loader2, ShieldAlert, ShieldCheck, Sparkles } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { MetricCard } from './metric-card';
import { StationChart } from './station-chart';
import { type Station, type TimeSeriesData } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Separator } from './ui/separator';

interface FarmerViewProps {
  stations: Station[];
}

const predictionSchema = z.object({
  predictionDays: z.coerce.number().min(1, "Must be at least 1 day").max(365, "Cannot predict more than 365 days"),
});

type PredictionFormData = z.infer<typeof predictionSchema>;

export default function FarmerView({ stations }: FarmerViewProps) {
  const [selectedStationId, setSelectedStationId] = useState<string | undefined>(stations[0]?.id);
  const [isLoadingPrediction, setIsLoadingPrediction] = useState(false);
  const [isLoadingStrategies, setIsLoadingStrategies] = useState(false);
  const [predictedData, setPredictedData] = useState<TimeSeriesData[] | null>(null);
  const [strategies, setStrategies] = useState<{ strategies: string[], rationale: string } | null>(null);
  const { toast } = useToast();

  const selectedStation = useMemo(() => stations.find(s => s.id === selectedStationId), [stations, selectedStationId]);

  const predictionForm = useForm<PredictionFormData>({
    resolver: zodResolver(predictionSchema),
    defaultValues: {
      predictionDays: 30,
    },
  });

  const handleStationChange = (stationId: string) => {
    setSelectedStationId(stationId);
    setPredictedData(null);
    setStrategies(null);
    predictionForm.reset();
  };

  const onPredictionSubmit = async (data: PredictionFormData) => {
    if (!selectedStation) return;

    setIsLoadingPrediction(true);
    setPredictedData(null);
    try {
      const historicalData = JSON.stringify(selectedStation.timeSeries.slice(-90)); // Use last 90 days for prediction
      const result = await predictGroundwaterLevels({
        stationId: selectedStation.id,
        historicalData,
        predictionDays: data.predictionDays,
      });
      const parsedPredictions: {date: string, level: number}[] = JSON.parse(result.predictedLevels);
      setPredictedData(parsedPredictions);
    } catch (error) {
      console.error("Prediction failed:", error);
      toast({
        variant: "destructive",
        title: "Prediction Failed",
        description: "Could not generate groundwater level predictions.",
      });
    } finally {
      setIsLoadingPrediction(false);
    }
  };

  const handleGetStrategies = async () => {
    if (!selectedStation) return;
    
    setIsLoadingStrategies(true);
    setStrategies(null);
    try {
        const last30Days = selectedStation.timeSeries.slice(-30);
        const predictedLevel = predictedData ? predictedData[predictedData.length-1].level : selectedStation.currentLevel;

        const result = await suggestConservationStrategies({
            currentGroundwaterLevel: selectedStation.currentLevel,
            predictedGroundwaterLevel: predictedLevel,
            location: selectedStation.district,
            landUse: selectedStation.landUse,
            historicalData: JSON.stringify(last30Days),
        });
        setStrategies(result);
    } catch (error) {
        console.error("Failed to get strategies:", error);
        toast({
            variant: "destructive",
            title: "Failed to Get Strategies",
            description: "Could not generate conservation strategies.",
        });
    } finally {
        setIsLoadingStrategies(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Select Monitoring Station</CardTitle>
          <CardDescription>Choose a station to view detailed data and get AI-powered insights.</CardDescription>
        </CardHeader>
        <CardContent>
          <Select onValueChange={handleStationChange} value={selectedStationId}>
            <SelectTrigger className="w-full md:w-[300px]">
              <SelectValue placeholder="Select a station" />
            </SelectTrigger>
            <SelectContent>
              {stations.map(station => (
                <SelectItem key={station.id} value={station.id}>
                  {station.name} - ({station.district})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedStation && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
                <MetricCard 
                    title="Current Level" 
                    value={`${selectedStation.currentLevel} m`} 
                    icon={<Droplets />}
                    status={selectedStation.status}
                />
                <MetricCard 
                    title="Status"
                    value={selectedStation.status}
                    icon={
                        selectedStation.status === 'Critical' ? <ShieldAlert className="text-destructive" /> :
                        selectedStation.status === 'Warning' ? <ShieldAlert className="text-yellow-500" /> :
                        <ShieldCheck className="text-green-500" />
                    }
                    status={selectedStation.status}
                />
            </div>
            <StationChart 
                data={[...selectedStation.timeSeries, ...(predictedData || [])]}
                title="Groundwater Level Trend"
                description={`Historical and predicted levels for ${selectedStation.name}.`}
            />
          </div>

          <div className="space-y-6">
            <Card>
              <Form {...predictionForm}>
                <form onSubmit={predictionForm.handleSubmit(onPredictionSubmit)}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BrainCircuit className="h-5 w-5 text-primary" />
                      Predictive Analytics
                    </CardTitle>
                    <CardDescription>Forecast future groundwater levels using AI.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={predictionForm.control}
                      name="predictionDays"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Days to Predict</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="e.g., 30" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                  <CardFooter>
                    <Button type="submit" disabled={isLoadingPrediction}>
                      {isLoadingPrediction && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Predict Levels
                    </Button>
                  </CardFooter>
                </form>
              </Form>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary"/>
                        AI Recommendations
                    </CardTitle>
                    <CardDescription>Get AI-powered conservation strategies.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoadingStrategies ? (
                        <div className="flex items-center justify-center p-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : strategies ? (
                        <div className="space-y-4 text-sm">
                            <div>
                                <h4 className="font-semibold mb-2">Suggested Strategies:</h4>
                                <ul className="list-disc pl-5 space-y-1">
                                    {strategies.strategies.map((s, i) => <li key={i}>{s}</li>)}
                                </ul>
                            </div>
                            <Separator />
                            <div>
                                <h4 className="font-semibold mb-2">Rationale:</h4>
                                <p className="text-muted-foreground">{strategies.rationale}</p>
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">Click the button below to generate strategies based on current and predicted data.</p>
                    )}
                </CardContent>
                <CardFooter>
                    <Button onClick={handleGetStrategies} disabled={isLoadingStrategies}>
                        {isLoadingStrategies && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Get Strategies
                    </Button>
                </CardFooter>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
