import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { subject_code, encodings } = await req.json();

    if (!subject_code || !encodings || !Array.isArray(encodings)) {
      return new Response(
        JSON.stringify({ error: 'Invalid request. Provide subject_code and encodings array' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get subject ID
    const { data: subject, error: subjectError } = await supabase
      .from('subjects')
      .select('id')
      .eq('subject_code', subject_code)
      .single();

    if (subjectError || !subject) {
      return new Response(
        JSON.stringify({ error: 'Invalid subject code' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch all student encodings
    const { data: studentImages, error: imagesError } = await supabase
      .from('student_images')
      .select('student_id, encoding');

    if (imagesError) throw imagesError;

    const markedStudents: string[] = [];
    const unknownFaces: number[] = [];

    // Match each encoding
    for (let i = 0; i < encodings.length; i++) {
      const capturedEncoding = encodings[i];
      let matched = false;

      for (const image of studentImages || []) {
        // Simple distance calculation (in production, use proper face recognition library)
        const distance = calculateDistance(capturedEncoding, image.encoding);
        
        if (distance < 0.6) { // Threshold for match
          // Mark attendance
          const { error: attendanceError } = await supabase
            .from('attendance')
            .insert({
              student_id: image.student_id,
              subject_id: subject.id,
            });

          if (!attendanceError && !markedStudents.includes(image.student_id)) {
            markedStudents.push(image.student_id);
          }
          matched = true;
          break;
        }
      }

      if (!matched) {
        unknownFaces.push(i);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        marked: markedStudents.length,
        unknown: unknownFaces.length,
        markedStudents,
        unknownFaces,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function calculateDistance(encoding1: number[], encoding2: number[]): number {
  if (encoding1.length !== encoding2.length) return 1;
  
  let sum = 0;
  for (let i = 0; i < encoding1.length; i++) {
    sum += Math.pow(encoding1[i] - encoding2[i], 2);
  }
  return Math.sqrt(sum);
}
