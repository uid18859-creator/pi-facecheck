import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { LogOut, Users, TrendingUp, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface AttendanceRecord {
  id: string;
  marked_at: string;
  profiles: {
    full_name: string;
    roll_number: string;
  };
}

interface Subject {
  subject_name: string;
  subject_code: string;
}

export default function TeacherDashboard() {
  const { profile, signOut } = useAuth();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState({ totalStudents: 0, avgAttendance: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [profile]);

  const fetchData = async () => {
    if (!profile?.subject_id) return;

    try {
      // Fetch subject details
      const { data: subjectData, error: subjectError } = await supabase
        .from('subjects')
        .select('subject_name, subject_code')
        .eq('id', profile.subject_id)
        .single();

      if (subjectError) throw subjectError;
      setSubject(subjectData);

      // Fetch attendance records
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance')
        .select(`
          id,
          marked_at,
          student_id
        `)
        .eq('subject_id', profile.subject_id)
        .order('marked_at', { ascending: false })
        .limit(50);

      if (attendanceError) throw attendanceError;

      // Fetch profile data for each student
      const enrichedData = await Promise.all(
        (attendanceData || []).map(async (record) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name, roll_number')
            .eq('id', record.student_id)
            .single();
          
          return {
            ...record,
            profiles: profileData || { full_name: 'Unknown', roll_number: 'N/A' }
          };
        })
      );

      setAttendanceRecords(enrichedData);

      // Calculate stats
      const uniqueStudents = new Set(enrichedData.map(r => r.profiles.roll_number));
      setStats({
        totalStudents: uniqueStudents.size,
        avgAttendance: enrichedData.length,
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
            <h1 className="text-2xl font-bold">Teacher Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              {profile?.full_name} • {subject?.subject_name}
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
              <CardTitle className="text-sm font-medium">Subject</CardTitle>
              <Calendar className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{subject?.subject_name}</div>
              <p className="text-xs text-muted-foreground uppercase">{subject?.subject_code}</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalStudents}</div>
              <p className="text-xs text-muted-foreground">Unique students</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Attendance</CardTitle>
              <TrendingUp className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.avgAttendance}</div>
              <p className="text-xs text-muted-foreground">Records logged</p>
            </CardContent>
          </Card>
        </div>

        {/* Attendance Records Table */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Attendance</CardTitle>
            <CardDescription>Latest 50 attendance records for {subject?.subject_name}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Roll Number</TableHead>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendanceRecords.length > 0 ? (
                  attendanceRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">
                        {record.profiles?.roll_number}
                      </TableCell>
                      <TableCell>{record.profiles?.full_name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(record.marked_at)}
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-success text-success-foreground">Present</Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No attendance records found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
