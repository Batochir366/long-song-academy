"use client";

import { AdminHeader } from "@/components/AdminHeader";
import { AdminSidebar } from "@/components/AdminSidebar";
import PaymentsPage from "@/components/PaymentsPage";

export default function Payments() {
  return (
    <div className="flex min-h-screen w-full">
      <AdminSidebar />
      <div className="flex-1 flex flex-col">
        <AdminHeader />
        <main className="flex-1">
          <PaymentsPage />
        </main>
      </div>
    </div>
  );
}
