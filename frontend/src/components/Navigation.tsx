"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-muted backdrop-blur-md border-b border-gray-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 bg-muted">
        <div className="flex items-center justify-between h-16 md:h-20">
          <Link href="/" className="flex items-center">
            <img
              src="/logo-white-01.png"
              alt="URTIN DUU"
              className="h-8 md:h-10 w-auto drop-shadow-lg"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4 lg:gap-6">
            <Link
              href="/class"
              className="text-gray-900 hover:text-[#8B6F47] transition-colors font-semibold uppercase text-sm"
            >
              АНГИ
            </Link>
            {/* <Link
              href="/merch"
              className="text-gray-900 hover:text-[#8B6F47] transition-colors font-semibold uppercase text-sm"
            >
              MERCH
            </Link> */}
            {/* <Link
              href="/about"
              className="text-gray-900 hover:text-[#8B6F47] transition-colors font-semibold uppercase text-sm"
            >
              ABOUT
            </Link> */}

            {/* Clerk Auth - Desktop */}
            <div className="flex items-center gap-3 ml-4 pl-4 border-l border-gray-300">
              <SignedOut>
                <SignInButton mode="modal">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-900 hover:text-primary"
                  >
                    Нэвтрэх
                  </Button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <Button
                    size="sm"
                    className="bg-primary text-white hover:bg-primary/90"
                  >
                    Бүртгүүлэх
                  </Button>
                </SignUpButton>
              </SignedOut>
              <SignedIn>
                <Link
                  href="/bookings"
                  className="text-gray-900 hover:text-primary transition-colors text-sm"
                >
                  Цаг захиалга
                </Link>
                <UserButton showName />
              </SignedIn>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-gray-900"
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 space-y-4 bg-white">
            <Link
              href="/class"
              className="block text-gray-900 hover:text-primary transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Анги
            </Link>

            {/* Clerk Auth - Mobile */}
            <div className="pt-4 border-t border-gray-200 space-y-3">
              <SignedOut>
                <SignInButton mode="modal">
                  <Button
                    variant="outline"
                    className="w-full border-gray-300 text-gray-900 hover:bg-gray-50"
                    size="sm"
                  >
                    Нэвтрэх
                  </Button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <Button
                    className="w-full bg-[#8B6F47] text-white hover:bg-[#8B6F47]/90"
                    size="sm"
                  >
                    Бүртгүүлэх
                  </Button>
                </SignUpButton>
              </SignedOut>
              <SignedIn>
                <Link
                  href="/bookings"
                  className="block text-gray-900 hover:text-[#8B6F47] transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  Цаг захиалга
                </Link>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    Хэрэглэгчийн мэдээлэл
                  </span>
                  <UserButton />
                </div>
              </SignedIn>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
