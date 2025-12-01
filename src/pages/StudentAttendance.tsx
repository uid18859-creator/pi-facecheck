import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Calendar, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

interface Subject {
  subject_name: string;
  subject_code: string;
}

interface AttendanceRecord {
  id: string;
  marked_at: string;
}

export default function StudentAttendance() {
  const { subjectId } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [subjectId, profile]);

  const fetchData = async () => {
    if (!subjectId || !profile) return;

    try {
      // Fetch subject details
      const { data: subjectData, error: subjectError } = await supabase
        .from('subjects')
        .select('subject_name, subject_code')
        .eq('id', subjectId)
        .single();

      if (subjectError) throw subjectError;
      setSubject(subjectData);

      // Fetch attendance records
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance')
        .select('id, marked_at')
        .eq('student_id', profile.id)
        .eq('subject_id', subjectId)
        .order('marked_at', { ascending: false });

      if (attendanceError) throw attendanceError;
      setRecords(attendanceData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
  };

  const totalClasses = 30; // Assumed total classes
  const presentClasses = records.length;
  const percentage = totalClasses > 0 ? (presentClasses / totalClasses) * 100 : 0;

  const getStatusColor = () => {
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
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate('/student/dashboard')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto max-w-4xl p-4 md:p-6 space-y-6">
        {/* Header Card */}
        <Card className="bg-gradient-card shadow-primary">
          <CardHeader>
            <CardTitle className="text-2xl">{subject?.subject_name}</CardTitle>
            <CardDescription className="uppercase">{subject?.subject_code}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Attendance Percentage</p>
                <p className={`text-4xl font-bold ${getStatusColor()}`}>
                  {Math.round(percentage)}%
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Classes Attended</p>
                <p className="text-2xl font-semibold">
                  {presentClasses} / {totalClasses}
                </p>
              </div>
            </div>
            <Progress value={percentage} className="h-3" />
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Present</CardTitle>
              <TrendingUp className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{presentClasses}</div>
              <p className="text-xs text-muted-foreground">classes attended</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Remaining</CardTitle>
              <Calendar className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalClasses - presentClasses}</div>
              <p className="text-xs text-muted-foreground">classes left</p>
            </CardContent>
          </Card>
        </div>

        {/* Attendance Records */}
        <Card>
          <CardHeader>
            <CardTitle>Attendance History</CardTitle>
            <CardDescription>Your attendance records for this subject</CardDescription>
          </CardHeader>
          <CardContent>
            {records.length > 0 ? (
              <div className="space-y-2">
                {records.map((record) => {
                  const { date, time } = formatDate(record.marked_at);
                  return (
                    <div
                      key={record.id}
                      className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{date}</p>
                          <p className="text-sm text-muted-foreground">{time}</p>
                        </div>
                      </div>
                      <Badge className="bg-success text-success-foreground">Present</Badge>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 text-center text-muted-foreground">
                <Calendar className="mx-auto mb-4 h-12 w-12 opacity-50" />
                <p>No attendance records yet</p>
                <p className="text-sm">Your attendance will appear here once marked</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
