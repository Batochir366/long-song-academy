"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  CheckCircle,
  Lock,
  PlayCircle,
  Loader2,
} from "lucide-react";
import apiClient from "@/lib/axios";

interface Lesson {
  id: string;
  title: string;
  duration: string;
  description: string;
  videoUrl: string;
  thumbnail: string;
  isFree: boolean;
  keyPoints: string[];
}

export default function LessonPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoaded: userLoaded } = useUser();
  const lessonId = params.lessonId as string | undefined;
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPaidUser, setIsPaidUser] = useState(false);
  const [selectedLessonId, setSelectedLessonId] = useState<string | undefined>(
    lessonId
  );

  useEffect(() => {
    const fetchUserClassroomSubjects = async () => {
      if (!userLoaded) return;

      // Check if user is authenticated
      if (!user) {
        setError("Та эхлээд нэвтэрнэ үү.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch user from backend with classroom populated
        const userResponse = await apiClient.get("/api/users", {
          params: { clerkId: user.id },
        });

        if (!userResponse.data.users || userResponse.data.users.length === 0) {
          setError("Хэрэглэгч олдсонгүй.");
          setLoading(false);
          return;
        }

        const dbUser = userResponse.data.users[0];
        setIsPaidUser(dbUser.isPaid || false);

        // Check if user has a classroom
        if (!dbUser.classroom || !dbUser.classroom._id) {
          setError("Та ангид бүртгэгдээгүй байна.");
          setLoading(false);
          return;
        }

        // Extract subjects from classroom
        const classroom = dbUser.classroom;
        if (!classroom.subjects || classroom.subjects.length === 0) {
          setError("Энэ ангид одоогоор хичээл байхгүй байна.");
          setLoading(false);
          return;
        }

        // Format subjects to match Lesson interface
        const formattedLessons: Lesson[] = classroom.subjects.map(
          (subject: any) => ({
            id: subject._id?.toString() || subject.id?.toString() || "",
            title: subject.subjectName || "",
            duration: subject.duration || "",
            description: subject.description || "",
            videoUrl: subject.videoUrl || "",
            thumbnail: subject.thumbnailUrl || "/placeholder.svg",
            isFree: subject.isFree || false,
            keyPoints: subject.keyPoints || [],
          })
        );

        setLessons(formattedLessons);
      } catch (err: any) {
        console.error("Error fetching user classroom subjects:", err);
        setError(
          err.response?.data?.error ||
            err.message ||
            "Хичээл ачаалахад алдаа гарлаа. Дахин оролдоно уу."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchUserClassroomSubjects();
  }, [user, userLoaded]);

  // Update selectedLessonId when lessonId from params changes
  useEffect(() => {
    setSelectedLessonId(lessonId);
  }, [lessonId]);

  // Auto-select first lesson if no lessonId is provided
  useEffect(() => {
    if (!selectedLessonId && lessons.length > 0) {
      const firstAccessibleLesson = lessons.find(
        (l) => l.isFree || isPaidUser
      );
      if (firstAccessibleLesson) {
        setSelectedLessonId(firstAccessibleLesson.id);
      }
    }
  }, [lessons, isPaidUser, selectedLessonId]);

  const lesson = selectedLessonId
    ? lessons.find((l) => l.id === selectedLessonId)
    : null;

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading lesson...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-serif mb-4 text-foreground">
            Error Loading Lesson
          </h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button onClick={() => router.push("/class")}>Back to Class</Button>
        </div>
      </div>
    );
  }

  const isAccessible = lesson
    ? lesson.isFree || isPaidUser
    : false;
  const currentIndex = selectedLessonId
    ? lessons.findIndex((l) => l.id === selectedLessonId)
    : -1;
  const previousLesson = currentIndex > 0 ? lessons[currentIndex - 1] : null;
  const nextLesson =
    currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null;

  return (
    <div className="min-h-screen">
      <div className="pt-24 pb-20 px-4">
        <div className="container mx-auto max-w-7xl">
          <Button
            variant="ghost"
            onClick={() => router.push("/class")}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Class
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Video Player */}
              <Card className="border-border bg-card overflow-hidden">
                <div className="aspect-video bg-black">
                  {lesson?.videoUrl ? (
                    <iframe
                      src={lesson.videoUrl}
                      className="w-full h-full border-0"
                      allow="autoplay; encrypted-media"
                      allowFullScreen
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white">
                      <p>Хичээл сонгоно уу</p>
                    </div>
                  )}
                </div>
              </Card>

              {/* Lesson Info */}
              {lesson && (
                <>
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <Badge variant="secondary">
                        Хичээл {currentIndex + 1}
                      </Badge>
                      {lesson.isFree && (
                        <Badge className="bg-primary">Үнэгүй</Badge>
                      )}
                      {lesson.duration && (
                        <Badge variant="outline">{lesson.duration}</Badge>
                      )}
                    </div>
                    <h1 className="font-serif text-4xl mb-4 text-foreground">
                      {lesson.title}
                    </h1>
                    <p className="text-lg text-muted-foreground leading-relaxed">
                      {lesson.description}
                    </p>
                  </div>

                  {/* Key Learning Points */}
                  <Card className="border-border bg-card">
                    <CardContent className="pt-6">
                      <h2 className="font-serif text-2xl mb-4 text-card-foreground">
                        Гол Онолууд
                      </h2>
                      {lesson.keyPoints && lesson.keyPoints.length > 0 ? (
                        <ul className="space-y-3">
                          {lesson.keyPoints.map((point, index) => (
                            <li key={index} className="flex items-start gap-3">
                              <CheckCircle className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                              <span className="text-muted-foreground">
                                {point}
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-muted-foreground">
                          Энэ хичээлд гол онолууд оруулаагүй байна.
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="border-border bg-card">
                    <CardContent className="pt-6">
                      <h2 className="font-serif text-2xl mb-4 text-card-foreground">
                        Сэтгэгдэл үлдээх
                      </h2>
                      <p className="text-muted-foreground mb-6">
                        Энэ хичээлийн талаар санаа бодлоо хуваалцаарай
                      </p>
                      <form className="space-y-4">
                        <div>
                          <label
                            htmlFor="name"
                            className="block text-sm font-medium text-card-foreground mb-2"
                          >
                            Нэр
                          </label>
                          <input
                            type="text"
                            id="name"
                            name="name"
                            className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="Таны нэр"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="message"
                            className="block text-sm font-medium text-card-foreground mb-2"
                          >
                            Мессеж
                          </label>
                          <textarea
                            id="message"
                            name="message"
                            rows={4}
                            className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                            placeholder="Энэ хичээлийн талаар санаа бодлоо хуваалцаарай..."
                          />
                        </div>
                        <Button type="submit" className="rounded-full">
                          Илгээх
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </>
              )}

              {/* Navigation */}
              {lesson && isAccessible && (
                <div className="flex items-center justify-between gap-4">
                  {previousLesson ? (
                    <Link
                      href={`/class/lessons/${previousLesson.id}`}
                      className="flex-1"
                    >
                      <Button
                        variant="outline"
                        className="w-full rounded-full bg-transparent"
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Өмнөх Хичээл
                      </Button>
                    </Link>
                  ) : (
                    <div className="flex-1" />
                  )}

                  {nextLesson ? (
                    <Link
                      href={`/class/lessons/${nextLesson.id}`}
                      className="flex-1"
                    >
                      <Button className="w-full rounded-full">
                        Дараах Хичээл
                        <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                      </Button>
                    </Link>
                  ) : (
                    <div className="flex-1" />
                  )}
                </div>
              )}
            </div>

            {/* Sidebar - All Lessons */}
            <div className="lg:col-span-1">
              <Card className="border-border bg-card sticky top-24">
                <CardContent className="pt-6">
                  <h2 className="font-serif text-xl mb-4 text-card-foreground">
                    Бүх Хичээлүүд
                  </h2>
                  <div className="space-y-2">
                    {lessons.map((l, index) => {
                      const isCurrentLesson = l.id === selectedLessonId;
                      const isLessonAccessible = l.isFree || isPaidUser;

                      return (
                        <Link
                          key={l.id}
                          href={
                            isLessonAccessible ? `/class/lessons/${l.id}` : "#"
                          }
                          className={`block p-3 rounded-lg border transition-all ${
                            isCurrentLesson
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50 hover:bg-accent"
                          } ${
                            !isLessonAccessible
                              ? "opacity-50 cursor-not-allowed"
                              : ""
                          }`}
                          onClick={() => {
                            if (isLessonAccessible) {
                              setSelectedLessonId(l.id);
                            }
                          }}
                        >
                          <div className="flex items-start gap-3">
                            <div className="relative shrink-0">
                              <img
                                src={l.thumbnail || "/placeholder.svg"}
                                alt={l.title}
                                className="w-16 h-16 object-cover rounded"
                              />
                              {!isLessonAccessible && (
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded">
                                  <Lock className="w-6 h-6 text-white" />
                                </div>
                              )}
                              {isCurrentLesson && isLessonAccessible && (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded">
                                  <PlayCircle className="w-6 h-6 text-white" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs text-muted-foreground">
                                  Хичээл {index + 1}
                                </span>
                                {l.isFree && (
                                  <Badge className="text-xs py-0">Үнэгүй</Badge>
                                )}
                              </div>
                              <p className="text-sm font-medium text-card-foreground line-clamp-2">
                                {l.title}
                              </p>
                              {l.duration && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {l.duration}
                                </p>
                              )}
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

