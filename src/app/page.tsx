"use client";

import { Header } from '@/components/common/header';
import FarmerView from '@/components/farmer-view';
import PolicymakerDashboard from '@/components/policymaker-dashboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { mockStationData } from '@/lib/data';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto p-4 md:p-8">
          <Tabs defaultValue="policymaker" className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
              <TabsTrigger value="policymaker">Policymaker Dashboard</TabsTrigger>
              <TabsTrigger value="farmer">Farmer View</TabsTrigger>
            </TabsList>
            <TabsContent value="policymaker" className="mt-6">
              <PolicymakerDashboard stations={mockStationData} />
            </TabsContent>
            <TabsContent value="farmer" className="mt-6">
              <FarmerView stations={mockStationData} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
