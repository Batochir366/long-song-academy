'use client'

import { AdminSidebar } from "@/components/AdminSidebar";
import { AdminHeader } from "@/components/AdminHeader";
import ClassroomPage from "@/components/ClassroomPage";

export default function Classroom() {
  return (
    <div className="flex min-h-screen w-full">
      <AdminSidebar />
      <div className="flex-1 flex flex-col">
        <AdminHeader />
        <main className="flex-1">
          <ClassroomPage />
        </main>
      </div>
    </div>
  );
}
