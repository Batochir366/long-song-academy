"use client";

import { Calendar, School, CreditCard } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { title: "Booking", url: "/", icon: Calendar },
  { title: "Classroom", url: "/classroom", icon: School },
  { title: "Payments", url: "/payments", icon: CreditCard },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-20 lg:w-64 flex-col border-r border-border bg-card">
      <div className="p-6 border-b border-border">
        <h2 className="text-lg font-semibold lg:block hidden">Music Admin</h2>
        <div className="lg:hidden flex justify-center">
          <School className="h-6 w-6 text-primary" />
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.url;
          return (
            <Link
              key={item.url}
              href={item.url}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-smooth",
                "hover:bg-accent hover:text-accent-foreground",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground"
              )}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              <span className="lg:block hidden">{item.title}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
