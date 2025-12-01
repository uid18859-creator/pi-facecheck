import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Camera, LogOut, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

interface Subject {
  id: string;
  subject_name: string;
  subject_code: string;
}

interface AttendanceStats {
  total: number;
  present: number;
  percentage: number;
}

export default function StudentDashboard() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [attendanceStats, setAttendanceStats] = useState<Record<string, AttendanceStats>>({});
  const [imageCount, setImageCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch subjects
      const { data: subjectsData, error: subjectsError } = await supabase
        .from('subjects')
        .select('*')
        .order('subject_name');

      if (subjectsError) throw subjectsError;
      setSubjects(subjectsData || []);

      // Fetch attendance stats for each subject
      if (profile) {
        const stats: Record<string, AttendanceStats> = {};
        
        for (const subject of subjectsData || []) {
          const { count, error } = await supabase
            .from('attendance')
            .select('*', { count: 'exact', head: true })
            .eq('student_id', profile.id)
            .eq('subject_id', subject.id);

          if (!error) {
            // Assuming 30 total classes per subject for calculation
            const total = 30;
            const present = count || 0;
            stats[subject.id] = {
              total,
              present,
              percentage: total > 0 ? (present / total) * 100 : 0,
            };
          }
        }
        setAttendanceStats(stats);

        // Fetch image count
        const { count: imgCount } = await supabase
          .from('student_images')
          .select('*', { count: 'exact', head: true })
          .eq('student_id', profile.id);

        setImageCount(imgCount || 0);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (percentage: number) => {
    if (percentage >= 75) return 'text-success';
    if (percentage >= 50) return 'text-warning';
    return 'text-destructive';
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-2xl font-bold">Student Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Welcome, {profile?.full_name} • {profile?.roll_number}
            </p>
          </div>
          <Button variant="outline" onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-gradient-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Subjects</CardTitle>
              <BookOpen className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{subjects.length}</div>
              <p className="text-xs text-muted-foreground">Active courses</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Photos Uploaded</CardTitle>
              <Camera className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{imageCount}/10</div>
              <Progress value={(imageCount / 10) * 100} className="mt-2" />
            </CardContent>
          </Card>

          <Card className="bg-gradient-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overall Attendance</CardTitle>
              <TrendingUp className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              {Object.keys(attendanceStats).length > 0 ? (
                <>
                  <div className="text-3xl font-bold">
                    {Math.round(
                      Object.values(attendanceStats).reduce(
                        (sum, stat) => sum + stat.percentage,
                        0
                      ) / Object.values(attendanceStats).length
                    )}
                    %
                  </div>
                  <p className="text-xs text-muted-foreground">Average across all subjects</p>
                </>
              ) : (
                <div className="text-xl text-muted-foreground">No data</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        {imageCount < 10 && (
          <Card className="border-primary/50 bg-gradient-primary/10">
            <CardHeader>
              <CardTitle>Complete Your Profile</CardTitle>
              <CardDescription>
                Upload your photos to enable face recognition attendance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate('/student/upload')} className="w-full md:w-auto">
                <Camera className="mr-2 h-4 w-4" />
                Upload Photos ({10 - imageCount} remaining)
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Subjects Grid */}
        <div>
          <h2 className="mb-4 text-xl font-semibold">Your Subjects</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {subjects.map((subject) => {
              const stats = attendanceStats[subject.id];
              return (
                <Card
                  key={subject.id}
                  className="cursor-pointer transition-all hover:shadow-lg hover:shadow-primary/20"
                  onClick={() => navigate(`/student/attendance/${subject.id}`)}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{subject.subject_name}</span>
                      {stats && (
                        <span className={`text-2xl font-bold ${getStatusColor(stats.percentage)}`}>
                          {Math.round(stats.percentage)}%
                        </span>
                      )}
                    </CardTitle>
                    <CardDescription className="uppercase">
                      {subject.subject_code}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {stats ? (
                      <>
                        <div className="mb-2 flex justify-between text-sm">
                          <span>Present: {stats.present}</span>
                          <span>Total: {stats.total}</span>
                        </div>
                        <Progress value={stats.percentage} />
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">No attendance data</p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
