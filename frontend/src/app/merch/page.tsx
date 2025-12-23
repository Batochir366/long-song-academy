"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart } from "lucide-react";

const merchItems = [
  {
    id: 1,
    name: "Traditional Mongolian Deel",
    category: "Clothing",
    price: "$189",
    description:
      "Authentic handcrafted deel in traditional colors, perfect for performances and cultural events.",
    image: "/mongolian-ger-yurt.jpg",
    inStock: true,
  },
  {
    id: 2,
    name: "Morin Khuur (Horse Head Fiddle)",
    category: "Instruments",
    price: "$599",
    description:
      "Professional-grade morin khuur, the traditional Mongolian string instrument.",
    image: "/mongolian-ger-yurt.jpg",
    inStock: true,
  },
  {
    id: 3,
    name: "Urtiin Duu Collection - Digital Album",
    category: "Music",
    price: "$19",
    description:
      "Complete collection of traditional long songs performed by master artists.",
    image: "/mongolian-ger-yurt.jpg",
    inStock: true,
  },
  {
    id: 4,
    name: "Silk Performance Scarf",
    category: "Accessories",
    price: "$45",
    description:
      "Elegant silk scarf with traditional Mongolian patterns, ideal for performances.",
    image: "/mongolian-ger-yurt.jpg",
    inStock: true,
  },
  {
    id: 5,
    name: "Urtiin Duu Instructional Book",
    category: "Books",
    price: "$35",
    description:
      "Comprehensive guide to Mongolian long song techniques and history.",
    image: "/mongolian-ger-yurt.jpg",
    inStock: true,
  },
  {
    id: 6,
    name: "Traditional Mongolian Hat",
    category: "Clothing",
    price: "$79",
    description:
      "Handmade traditional Mongolian hat with authentic embroidery and design.",
    image: "/mongolian-ger-yurt.jpg",
    inStock: true,
  },
  {
    id: 7,
    name: "Throat Singing & Long Song CD Set",
    category: "Music",
    price: "$29",
    description:
      "Three-disc collection featuring the best of Mongolian vocal traditions.",
    image: "/mongolian-ger-yurt.jpg",
    inStock: false,
  },
  {
    id: 8,
    name: "Embroidered Performance Boots",
    category: "Clothing",
    price: "$149",
    description:
      "Traditional Mongolian boots with intricate embroidery, handcrafted by local artisans.",
    image: "/mongolian-ger-yurt.jpg",
    inStock: true,
  },
  {
    id: 9,
    name: "Miniature Ger Model",
    category: "Decor",
    price: "$89",
    description:
      "Detailed handcrafted miniature of a traditional Mongolian ger (yurt).",
    image: "/mongolian-ger-yurt.jpg",
    inStock: true,
  },
];

export default function MerchPage() {
  const [filter, setFilter] = useState<string>("All");

  const categories = [
    "All",
    "Clothing",
    "Instruments",
    "Music",
    "Accessories",
    "Books",
    "Decor",
  ];
  const filteredItems =
    filter === "All"
      ? merchItems
      : merchItems.filter((item) => item.category === filter);

  return (
    <div className="min-h-screen">
      <div className="pt-24 pb-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h1 className="font-serif text-5xl md:text-6xl mb-6 text-foreground">
              Merchandise
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Discover authentic Mongolian cultural items, from traditional
              clothing and instruments to music collections and handcrafted
              decor.
            </p>
          </div>

          {/* Filter Buttons */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {categories.map((category) => (
              <Button
                key={category}
                variant={filter === category ? "default" : "outline"}
                onClick={() => setFilter(category)}
                className="rounded-full"
              >
                {category}
              </Button>
            ))}
          </div>

          {/* Merch Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredItems.map((item) => (
              <Card
                key={item.id}
                className="border-border bg-card overflow-hidden hover:shadow-xl transition-shadow"
              >
                <div className="relative aspect-square overflow-hidden bg-muted">
                  <img
                    src={item.image || "/placeholder.svg"}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                  {!item.inStock && (
                    <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                      <Badge variant="secondary" className="text-lg px-4 py-2">
                        Out of Stock
                      </Badge>
                    </div>
                  )}
                </div>
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline">{item.category}</Badge>
                    {item.inStock && (
                      <span className="text-xs text-muted-foreground bg-accent/20 px-2 py-1 rounded-full">
                        In Stock
                      </span>
                    )}
                  </div>
                  <h3 className="font-serif text-2xl text-card-foreground">
                    {item.name}
                  </h3>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </CardContent>
                <CardFooter className="flex items-center justify-between">
                  <span className="text-2xl font-semibold text-primary">
                    {item.price}
                  </span>
                  <Button className="rounded-full" disabled={!item.inStock}>
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    {item.inStock ? "Add to Cart" : "Unavailable"}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
