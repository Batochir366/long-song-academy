import { Card, CardContent } from "@/components/ui/card";

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      <div className="pt-24 pb-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <h1 className="font-serif text-5xl md:text-6xl text-center mb-12 text-foreground">
            About Urtiin Duu
          </h1>

          {/* Hero Image */}
          <div className="relative aspect-[21/9] rounded-2xl overflow-hidden mb-12">
            <img
              src="/mongolian-ger-yurt.jpg"
              alt="Mongolian landscape"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Story Section */}
          <div className="space-y-8 mb-16">
            <div>
              <h2 className="font-serif text-3xl mb-4 text-foreground">
                The Tradition
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Urtiin duu, meaning "long song," is one of the most distinctive
                and ancient forms of Mongolian vocal music. Characterized by its
                extended melodic lines and ornamental flourishes, this art form
                has been passed down through generations of nomadic herders on
                the vast Mongolian steppe.
              </p>
            </div>

            <div>
              <p className="text-lg text-muted-foreground leading-relaxed">
                The songs often celebrate the natural world—the endless
                grasslands, majestic mountains, flowing rivers, and the beloved
                horses that are central to Mongolian culture. Each performance
                is a meditation, a connection to the land, and a preservation of
                cultural memory.
              </p>
            </div>

            <div>
              <p className="text-lg text-muted-foreground leading-relaxed">
                In 2005, UNESCO recognized urtiin duu as a Masterpiece of the
                Oral and Intangible Heritage of Humanity, acknowledging its
                profound cultural significance and the need to preserve this
                unique vocal tradition for future generations.
              </p>
            </div>
          </div>

          {/* Teacher Story */}
          <Card className="border-border bg-muted mb-16">
            <CardContent className="pt-8">
              <h2 className="font-serif text-3xl mb-6 text-foreground">
                Sarangerel's Journey
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-1">
                  <div className="relative aspect-[3/4] rounded-xl overflow-hidden">
                    <img
                      src="/mongolian-ger-yurt.jpg"
                      alt="Sarangerel"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <div className="md:col-span-2 space-y-4">
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    Born in the Khangai Mountains of central Mongolia,
                    Sarangerel grew up surrounded by the sounds of urtiin duu.
                    Her grandmother, a renowned singer in their region, began
                    teaching her the traditional songs when she was just five
                    years old.
                  </p>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    After years of study at the Mongolian State Conservatory and
                    performances at venues around the world, Sarangerel
                    dedicated herself to teaching. She believes that sharing
                    this ancient art form with students globally is essential to
                    its preservation and evolution.
                  </p>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    Her teaching philosophy combines respect for tradition with
                    accessibility for modern learners. Through online courses
                    and private lessons, she has taught hundreds of students
                    from over 30 countries, helping them discover the beauty and
                    depth of Mongolian long song.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cultural Elements */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="border-border bg-card">
              <div className="relative aspect-video overflow-hidden rounded-t-xl">
                <img
                  src="/mongolian-ger-yurt.jpg"
                  alt="Mongolian ger"
                  className="w-full h-full object-cover"
                />
              </div>
              <CardContent className="pt-6">
                <h3 className="font-serif text-2xl mb-3 text-card-foreground">
                  Nomadic Heritage
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  The songs reflect the nomadic lifestyle, with themes of
                  nature, animals, and the spiritual connection between humans
                  and the vast landscape.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <div className="relative aspect-video overflow-hidden rounded-t-xl">
                <img
                  src="/mongolian-ger-yurt.jpg"
                  alt="Morin khuur"
                  className="w-full h-full object-cover"
                />
              </div>
              <CardContent className="pt-6">
                <h3 className="font-serif text-2xl mb-3 text-card-foreground">
                  Musical Tradition
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Often accompanied by the morin khuur (horse-head fiddle),
                  urtiin duu creates a soundscape that evokes the endless
                  horizons of the Mongolian steppe.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
