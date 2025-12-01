import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, Users, Camera, TrendingUp, ArrowRight } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();

  useEffect(() => {
    if (!loading && user && profile) {
      if (profile.role === 'student') {
        navigate('/student/dashboard');
      } else if (profile.role === 'teacher') {
        navigate('/teacher/dashboard');
      }
    }
  }, [user, profile, loading, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center mb-16">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-primary shadow-primary">
            <GraduationCap className="h-10 w-10 text-white" />
          </div>
          <h1 className="mb-4 text-5xl font-bold tracking-tight md:text-6xl bg-gradient-primary bg-clip-text text-transparent">
            AI Face Attendance
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground md:text-xl">
            Modern attendance management powered by facial recognition technology.
            Fast, accurate, and secure attendance tracking for educational institutions.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
          <Button
            size="lg"
            onClick={() => navigate('/auth')}
            className="text-lg px-8 py-6 shadow-primary"
          >
            Get Started
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <Button size="lg" variant="outline" className="text-lg px-8 py-6">
            Learn More
          </Button>
        </div>

        {/* Features */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
          <Card className="bg-gradient-card hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Camera className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Face Recognition</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Advanced AI-powered facial recognition for instant and accurate attendance marking
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-secondary/10">
                <Users className="h-6 w-6 text-secondary" />
              </div>
              <CardTitle>Multi-Subject</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Track attendance across multiple subjects with dedicated dashboards for each
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
                <TrendingUp className="h-6 w-6 text-accent" />
              </div>
              <CardTitle>Real-time Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                View attendance statistics, trends, and insights with beautiful visualizations
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-warning/10">
                <GraduationCap className="h-6 w-6 text-warning" />
              </div>
              <CardTitle>Student & Teacher Portals</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Separate dashboards for students and teachers with role-specific features
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* How It Works */}
        <div className="mt-20 max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/20 text-2xl font-bold text-primary">
                1
              </div>
              <h3 className="mb-2 text-xl font-semibold">Upload Photos</h3>
              <p className="text-muted-foreground">
                Students upload 10 clear photos of their face for training the recognition system
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary/20 text-2xl font-bold text-secondary">
                2
              </div>
              <h3 className="mb-2 text-xl font-semibold">Face Recognition</h3>
              <p className="text-muted-foreground">
                Raspberry Pi captures faces during class and matches them with stored encodings
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/20 text-2xl font-bold text-accent">
                3
              </div>
              <h3 className="mb-2 text-xl font-semibold">Track Attendance</h3>
              <p className="text-muted-foreground">
                View real-time attendance records and analytics on your personalized dashboard
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t bg-card/50 backdrop-blur-sm py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2025 AI Face Attendance System. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
