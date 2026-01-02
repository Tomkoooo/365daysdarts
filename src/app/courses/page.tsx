import { getAllCourses } from "@/actions/course-actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { BookOpen, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const dynamic = 'force-dynamic';

export default async function CoursesPage() {
  const courses = await getAllCourses();

  return (
    <div className="container mx-auto p-8 space-y-8">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">Available Courses</h1>
        <p className="text-xl text-muted-foreground">
          Expand your skills with our comprehensive dart training modules.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course: any) => (
          <Card key={course._id} className="flex flex-col h-full hover:shadow-lg transition-shadow">
            <div className="aspect-video w-full overflow-hidden rounded-t-lg bg-muted relative">
              {course.thumbnail ? (
                <img 
                  src={course.thumbnail} 
                  alt={course.title} 
                  className="w-full h-full object-cover transition-transform hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-secondary">
                  <BookOpen className="h-12 w-12 text-muted-foreground/50" />
                </div>
              )}
              {course.price === 0 && (
                <Badge className="absolute top-2 right-2 bg-green-500 hover:bg-green-600">
                  Free
                </Badge>
              )}
            </div>
            
            <CardHeader>
              <CardTitle className="line-clamp-2">{course.title}</CardTitle>
              <CardDescription className="line-clamp-3">
                {course.description}
              </CardDescription>
            </CardHeader>

            <CardContent className="flex-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>By Tomko</span>
              </div>
            </CardContent>

            <CardFooter className="pt-4 border-t bg-muted/5">
              <Button asChild className="w-full">
                <Link href={`/courses/${course._id}/learn`}>
                  Start Learning
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
        
        {courses.length === 0 && (
            <div className="col-span-full text-center py-12 bg-muted/30 rounded-lg">
                <h3 className="text-lg font-medium">No courses available yet</h3>
                <p className="text-muted-foreground">Check back soon for new content.</p>
            </div>
        )}
      </div>
    </div>
  );
}
