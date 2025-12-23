"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Skip auth check for sign-in page
    if (pathname === "/sign-in") {
      setIsChecking(false);
      return;
    }

    // Check for admin token in localStorage
    const adminToken = localStorage.getItem("adminToken");

    if (!adminToken) {
      const redirectUrl = pathname !== "/" ? `/sign-in?redirect=${encodeURIComponent(pathname)}` : "/sign-in";
      router.push(redirectUrl);
    } else {
      setIsChecking(false);
    }
  }, [pathname, router]);

  // Show loading state or nothing while checking
  if (isChecking && pathname !== "/sign-in") {
    return null;
  }

  return <>{children}</>;
}

