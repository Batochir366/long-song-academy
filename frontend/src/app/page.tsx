"use client";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <div className="absolute top-0 left-0 w-full h-full opacity-50"></div>

      <div className="relative z-10">
        <div className="container mx-auto max-w-6xl">
          <h1 className="font-serif text-5xl md:text-6xl mb-6 text-foreground">
            Home Page
          </h1>
        </div>
      </div>
    </div>
  );
}
