"use client";

import { MainLayout } from "@/components/layout/main-layout";
import { TaskBoard } from "@/components/tasks/task-board";
import { ActivityFeed } from "@/components/activity/activity-feed";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Home() {
  return (
    <MainLayout>
      <div className="flex flex-col h-full">
        <div className="border-b p-4">
          <Tabs defaultValue="board" className="w-full">
            <TabsList>
              <TabsTrigger value="board">Task Board</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>
            <TabsContent value="board" className="mt-0">
              <div className="h-[calc(100vh-120px)]">
                <TaskBoard />
              </div>
            </TabsContent>
            <TabsContent value="activity" className="mt-0">
              <div className="h-[calc(100vh-120px)] p-4">
                <ActivityFeed />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
}
