import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { CheckCircle, Loader2 } from 'lucide-react';

export default function SetupTeachers() {
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState<string[]>([]);

  const teacherAccounts = [
    { username: 'maths', email: 'maths@school.edu', password: 'Maths@123', subject: 'Maths' },
    { username: 'dsa', email: 'dsa@school.edu', password: 'Dsa@123', subject: 'DSA' },
    { username: 'ldco', email: 'ldco@school.edu', password: 'Ldco@123', subject: 'LDCO' },
    { username: 'os', email: 'os@school.edu', password: 'Os@123', subject: 'OS' },
    { username: 'basket', email: 'basket@school.edu', password: 'Basket@123', subject: 'Basket Course' },
  ];

  const setupTeachers = async () => {
    setLoading(true);
    const successfullyCreated: string[] = [];

    for (const teacher of teacherAccounts) {
      try {
        // Get subject ID
        const { data: subjectData } = await supabase
          .from('subjects')
          .select('id')
          .eq('subject_name', teacher.subject)
          .single();

        if (!subjectData) {
          toast.error(`Subject ${teacher.subject} not found`);
          continue;
        }

        // Create teacher account
        const { data, error } = await supabase.auth.signUp({
          email: teacher.email,
          password: teacher.password,
          options: {
            data: {
              full_name: `${teacher.subject} Teacher`,
              role: 'teacher',
              subject_id: subjectData.id,
            },
          },
        });

        if (error) {
          if (error.message.includes('already registered')) {
            successfullyCreated.push(teacher.username);
            toast.info(`${teacher.username} already exists`);
          } else {
            toast.error(`Failed to create ${teacher.username}: ${error.message}`);
          }
        } else if (data.user) {
          successfullyCreated.push(teacher.username);
          toast.success(`Created ${teacher.username}`);
        }
      } catch (err: any) {
        toast.error(`Error creating ${teacher.username}: ${err.message}`);
      }
    }

    setCreated(successfullyCreated);
    setLoading(false);
    
    if (successfullyCreated.length === teacherAccounts.length) {
      toast.success('All teacher accounts are ready!');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Setup Teacher Accounts</CardTitle>
          <CardDescription>
            Create the 5 fixed teacher accounts for the system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {teacherAccounts.map((teacher) => (
              <div key={teacher.username} className="flex items-center justify-between p-2 rounded bg-muted/50">
                <div>
                  <div className="font-medium">{teacher.subject}</div>
                  <div className="text-sm text-muted-foreground">
                    {teacher.username} / {teacher.password}
                  </div>
                </div>
                {created.includes(teacher.username) && (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                )}
              </div>
            ))}
          </div>

          <Button 
            onClick={setupTeachers} 
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Accounts...
              </>
            ) : (
              'Create Teacher Accounts'
            )}
          </Button>

          {created.length === teacherAccounts.length && (
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => window.location.href = '/'}
            >
              Go to Login
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
