import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { GraduationCap, Users } from 'lucide-react';

export default function Auth() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Student signup form
  const [studentEmail, setStudentEmail] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [studentName, setStudentName] = useState('');
  const [studentRoll, setStudentRoll] = useState('');

  // Student login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Teacher login form
  const [teacherUsername, setTeacherUsername] = useState('');
  const [teacherPassword, setTeacherPassword] = useState('');

  const handleStudentSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: studentEmail,
        password: studentPassword,
        options: {
          data: {
            full_name: studentName,
            role: 'student',
            roll_number: studentRoll,
          },
          emailRedirectTo: `${window.location.origin}/student/dashboard`,
        },
      });

      if (error) throw error;

      if (data.user) {
        toast.success('Account created successfully!');
        navigate('/student/dashboard');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (error) throw error;

      // Verify it's a student
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (profile?.role !== 'student') {
        await supabase.auth.signOut();
        throw new Error('Invalid credentials for student login');
      }

      toast.success('Logged in successfully!');
      navigate('/student/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Failed to log in');
    } finally {
      setLoading(false);
    }
  };

  const handleTeacherLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Teacher login with fixed credentials
    const teacherCredentials: Record<string, { email: string; password: string }> = {
      maths: { email: 'maths@school.edu', password: 'Maths@123' },
      dsa: { email: 'dsa@school.edu', password: 'Dsa@123' },
      ldco: { email: 'ldco@school.edu', password: 'Ldco@123' },
      os: { email: 'os@school.edu', password: 'Os@123' },
      basket: { email: 'basket@school.edu', password: 'Basket@123' },
    };

    const credentials = teacherCredentials[teacherUsername.toLowerCase()];

    if (!credentials) {
      toast.error('Invalid teacher username');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: teacherPassword,
      });

      if (error) throw error;

      // Verify it's a teacher
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (profile?.role !== 'teacher') {
        await supabase.auth.signOut();
        throw new Error('Invalid credentials for teacher login');
      }

      toast.success('Logged in successfully!');
      navigate('/teacher/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background p-4">
      <Card className="w-full max-w-md shadow-primary">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-primary">
            <GraduationCap className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Face Attendance
          </CardTitle>
          <CardDescription>AI-powered attendance management system</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="student-login" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="student-login">Student Login</TabsTrigger>
              <TabsTrigger value="student-signup">Signup</TabsTrigger>
              <TabsTrigger value="teacher-login">Teacher</TabsTrigger>
            </TabsList>

            <TabsContent value="student-login">
              <form onSubmit={handleStudentLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="student@example.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Logging in...' : 'Login'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="student-signup">
              <form onSubmit={handleStudentSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="roll">Roll Number</Label>
                  <Input
                    id="roll"
                    placeholder="2024001"
                    value={studentRoll}
                    onChange={(e) => setStudentRoll(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="student@example.com"
                    value={studentEmail}
                    onChange={(e) => setStudentEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={studentPassword}
                    onChange={(e) => setStudentPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Creating account...' : 'Sign Up'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="teacher-login">
              <form onSubmit={handleTeacherLogin} className="space-y-4">
                <div className="flex items-center gap-2 rounded-lg bg-muted p-3 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    Use: maths, dsa, ldco, os, or basket
                  </span>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="teacher-username">Username</Label>
                  <Input
                    id="teacher-username"
                    placeholder="maths"
                    value={teacherUsername}
                    onChange={(e) => setTeacherUsername(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="teacher-password">Password</Label>
                  <Input
                    id="teacher-password"
                    type="password"
                    placeholder="Maths@123"
                    value={teacherPassword}
                    onChange={(e) => setTeacherPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Logging in...' : 'Teacher Login'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
