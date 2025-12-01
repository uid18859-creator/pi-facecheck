import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Camera, Upload, ArrowLeft, X, CheckCircle } from 'lucide-react';

export default function UploadPhotos() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [images, setImages] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [existingCount, setExistingCount] = useState(0);

  useEffect(() => {
    fetchExistingImages();
  }, []);

  const fetchExistingImages = async () => {
    if (!profile) return;

    const { count } = await supabase
      .from('student_images')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', profile.id);

    setExistingCount(count || 0);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remainingSlots = 10 - existingCount - images.length;

    if (files.length > remainingSlots) {
      toast.error(`You can only upload ${remainingSlots} more image(s)`);
      return;
    }

    setImages((prev) => [...prev, ...files]);
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (!profile || images.length === 0) return;

    setUploading(true);

    try {
      for (const image of images) {
        // Upload to storage
        const fileExt = image.name.split('.').pop();
        const fileName = `${profile.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('student-photos')
          .upload(fileName, image);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('student-photos')
          .getPublicUrl(fileName);

        // For now, store empty encoding array (will be processed by face recognition system)
        const { error: dbError } = await supabase.from('student_images').insert({
          student_id: profile.id,
          image_url: urlData.publicUrl,
          encoding: [], // Will be populated by face recognition processing
        });

        if (dbError) throw dbError;
      }

      toast.success(`Successfully uploaded ${images.length} photo(s)!`);
      setImages([]);
      fetchExistingImages();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload photos');
    } finally {
      setUploading(false);
    }
  };

  const totalImages = existingCount + images.length;
  const canUploadMore = totalImages < 10;

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

      <main className="container mx-auto max-w-2xl p-4 md:p-6">
        <Card className="shadow-primary">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-primary">
              <Camera className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Upload Your Photos</CardTitle>
            <CardDescription>
              Upload clear photos of your face for attendance recognition (max 10)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Photos Uploaded</span>
                <span className="font-medium">
                  {existingCount} / 10
                </span>
              </div>
              <Progress value={(existingCount / 10) * 100} className="h-3" />
            </div>

            {existingCount >= 10 ? (
              <div className="rounded-lg bg-success/10 p-4 text-center">
                <CheckCircle className="mx-auto mb-2 h-12 w-12 text-success" />
                <h3 className="font-semibold text-success">Profile Complete!</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  You've uploaded all 10 photos. Your face recognition is now active.
                </p>
              </div>
            ) : (
              <>
                {/* Upload Area */}
                <div>
                  <label
                    htmlFor="photo-upload"
                    className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-all ${
                      canUploadMore
                        ? 'border-primary/50 hover:border-primary hover:bg-primary/5'
                        : 'border-muted bg-muted/50 cursor-not-allowed'
                    }`}
                  >
                    <Upload className="mb-4 h-12 w-12 text-primary" />
                    <span className="mb-2 text-sm font-medium">
                      {canUploadMore
                        ? 'Click to upload photos'
                        : 'Maximum photos uploaded'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {canUploadMore
                        ? `${10 - totalImages} photos remaining`
                        : 'You can upload up to 10 photos total'}
                    </span>
                    <input
                      id="photo-upload"
                      type="file"
                      className="hidden"
                      accept="image/*"
                      multiple
                      onChange={handleFileSelect}
                      disabled={!canUploadMore}
                    />
                  </label>
                </div>

                {/* Preview */}
                {images.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Selected Photos ({images.length})</h3>
                    <div className="grid grid-cols-3 gap-2">
                      {images.map((image, index) => (
                        <div key={index} className="relative aspect-square">
                          <img
                            src={URL.createObjectURL(image)}
                            alt={`Preview ${index + 1}`}
                            className="h-full w-full rounded-lg object-cover"
                          />
                          <button
                            onClick={() => removeImage(index)}
                            className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-md"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Upload Button */}
                <Button
                  onClick={handleUpload}
                  disabled={images.length === 0 || uploading}
                  className="w-full"
                  size="lg"
                >
                  {uploading ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload {images.length} Photo{images.length !== 1 ? 's' : ''}
                    </>
                  )}
                </Button>
              </>
            )}

            {/* Tips */}
            <div className="rounded-lg bg-muted p-4">
              <h4 className="mb-2 text-sm font-semibold">Tips for best results:</h4>
              <ul className="space-y-1 text-xs text-muted-foreground">
                <li>• Take photos in good lighting</li>
                <li>• Face the camera directly</li>
                <li>• Include different angles and expressions</li>
                <li>• Avoid sunglasses or face coverings</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
