"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, PlayCircle } from "lucide-react";

const trailLessons = [
  {
    id: 1,
    title: "Introduction & Overview",
    duration: "45 min",
    description:
      "Welcome to the world of Urtiin Duu and understanding its cultural significance",
    thumbnail: "/mongolian-ger-yurt.jpg",
  },
  {
    id: 2,
    title: "History of Urtiin Duu",
    duration: "60 min",
    description:
      "Explore the rich history and traditions of Mongolian long song",
    thumbnail: "/mongolian-ger-yurt.jpg",
  },
];

export default function TrailPage() {
  return (
    <div className="min-h-screen">
      <div className="pt-24 pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          {/* Trail Header */}
          <div className="mb-12">
            <Badge className="mb-4">Free Trial Lessons</Badge>
            <h1 className="font-serif text-5xl md:text-6xl mb-6 text-foreground">
              Experience Urtiin Duu
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl">
              Start your journey with our free trial lessons. Discover the
              beauty of Mongolian long song and learn the basics from master
              teacher Sarangerel before joining the full class.
            </p>
          </div>

          {/* CTA Card */}
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 mb-12">
            <CardContent className="pt-8 pb-8 text-center">
              <h2 className="font-serif text-3xl mb-4 text-foreground">
                Ready to Continue Your Journey?
              </h2>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto leading-relaxed">
                Join our exclusive class to access all 8 comprehensive lessons,
                downloadable resources, and book private 1:1 sessions with
                Sarangerel.
              </p>
              <a
                href="https://www.messenger.com/t/721001717772761"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button size="lg" className="rounded-full">
                  Become a Member
                </Button>
              </a>
            </CardContent>
          </Card>

          {/* Trail Lessons */}
          <div className="mb-12">
            <h2 className="font-serif text-3xl md:text-4xl mb-8 text-foreground">
              Free Trial Lessons
            </h2>
            <div className="space-y-4">
              {trailLessons.map((lesson, index) => (
                <Card
                  key={lesson.id}
                  className="border-border bg-card hover:shadow-lg transition-all overflow-hidden group cursor-pointer"
                >
                  <Link href={`/class/lessons/${lesson.id}`}>
                    <div className="flex flex-col md:flex-row">
                      <div className="relative md:w-64 aspect-video md:aspect-auto overflow-hidden">
                        <img
                          src={lesson.thumbnail || "/placeholder.svg"}
                          alt={lesson.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <PlayCircle className="w-16 h-16 text-white" />
                        </div>
                        <div className="absolute top-3 left-3">
                          <Badge
                            variant="secondary"
                            className="bg-background/90"
                          >
                            Lesson {index + 1}
                          </Badge>
                        </div>
                        <div className="absolute top-3 right-3">
                          <Badge className="bg-primary">Free</Badge>
                        </div>
                      </div>
                      <CardContent className="flex-1 pt-6">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-serif text-xl md:text-2xl text-card-foreground">
                            {lesson.title}
                          </h3>
                          <Badge
                            variant="outline"
                            className="ml-4 whitespace-nowrap"
                          >
                            <Clock className="w-3 h-3 mr-1" />
                            {lesson.duration}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground leading-relaxed">
                          {lesson.description}
                        </p>
                      </CardContent>
                    </div>
                  </Link>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
