import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '../components/AppSidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Calendar, Upload, X } from 'lucide-react';
import { usePlanner } from '../contexts/PlannerContext';
import { useToast } from '@/hooks/use-toast';
import { BorderImage } from '../components/PageHeaderImages';
import { validateAndCompressImage } from '../lib/imageCompression';

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const Planner = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const currentYear = new Date().getFullYear();
  const { getMonthData, getMonthCoverImage, updateMonthCover, plannerBorderImage, updatePlannerBorderImage } = usePlanner();
  
  const [uploadingMonth, setUploadingMonth] = useState<number | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [pendingImage, setPendingImage] = useState('');
  const [pendingPosition, setPendingPosition] = useState({ x: 50, y: 50 });
  const [monthImages, setMonthImages] = useState<{ [key: string]: string }>({});

  const handleImageUpload = async (monthIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await validateAndCompressImage(file);
        setPendingImage(compressed);
        setPendingPosition({ x: 50, y: 50 });
      } catch (error) {
        toast({
          title: "Error processing image",
          description: error instanceof Error ? error.message : "Failed to process image",
          variant: "destructive",
        });
      }
    }
  };

  // Load cover images from IndexedDB on mount
  useEffect(() => {
    const loadImages = async () => {
      const images: { [key: string]: string } = {};
      for (let i = 0; i < 12; i++) {
        try {
          const img = await getMonthCoverImage(i, currentYear);
          if (img) {
            images[`${i}_${currentYear}`] = img;
          }
        } catch (error) {
          console.warn(`Failed to load image for month ${i}:`, error);
        }
      }
      setMonthImages(images);
    };
    loadImages();
  }, [currentYear, getMonthCoverImage]);

  const handleImageUrlSubmit = () => {
    if (imageUrl.trim()) {
      setPendingImage(imageUrl.trim());
      setPendingPosition({ x: 50, y: 50 });
    }
  };

  const handleConfirmImage = async (monthIndex: number) => {
    const imageToSave = pendingImage || imageUrl.trim();
    if (!imageToSave) {
      toast({
        title: "No image selected",
        description: "Add an image or paste a URL before saving.",
        variant: "destructive",
      });
      return;
    }

    try {
      await updateMonthCover(monthIndex, currentYear, imageToSave, pendingPosition);
      setImageUrl('');
      setPendingImage('');
      setPendingPosition({ x: 50, y: 50 });
      setUploadingMonth(null);
      toast({
        title: "Image saved! 🎨",
        description: "You can reposition anytime via Add/Change Image.",
      });
    } catch (error) {
      toast({
        title: "Error saving image",
        description: error instanceof Error ? error.message : "Failed to save image. Please try a smaller file.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveImage = async (monthIndex: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await updateMonthCover(monthIndex, currentYear, '');
      toast({
        title: "Image removed",
        description: "Month cover has been cleared.",
      });
    } catch (error) {
      toast({
        title: "Error removing image",
        description: "Failed to remove the image.",
        variant: "destructive",
      });
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-gradient-to-br from-coquette-brown-50 via-coquette-pink-50 to-white">
        <AppSidebar />
        <SidebarInset className="flex-1 w-full min-w-0">
          {/* Border Image */}
          <BorderImage
            image={plannerBorderImage}
            onUpload={async (image) => {
              try {
                await updatePlannerBorderImage(image);
                toast({
                  title: "Image uploaded! 🎨",
                  description: "Your planner header has been updated.",
                });
              } catch (error) {
                toast({
                  title: "Error uploading image",
                  description: error instanceof Error ? error.message : "Failed to upload image.",
                  variant: "destructive",
                });
              }
            }}
            onRemove={async () => {
              try {
                await updatePlannerBorderImage('');
                toast({
                  title: "Image removed",
                  description: "Planner header has been cleared.",
                });
              } catch (error) {
                console.error('Failed to remove border image:', error);
              }
            }}
          />

          <header className="flex items-center sticky top-0 z-10 gap-4 border-b border-coquette-brown-200 bg-white/80 backdrop-blur-sm px-6 py-4">
            <SidebarTrigger />
            <div className="flex items-center gap-2">
              <Calendar className="h-6 w-6 text-coquette-pink-400" />
              <h1 className="text-2xl font-bold text-coquette-brown-600">Monthly Planner</h1>
            </div>
          </header>

          <main className="flex-1 overflow-auto p-6">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-coquette-brown-600 mb-2">{currentYear}</h2>
                <p className="text-coquette-brown-500">Click on any month to view and plan, or add a cover image</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {months.map((month, index) => {
                  const monthData = getMonthData(index, currentYear);
                  const monthImageKey = `${index}_${currentYear}`;
                  const displayImage = monthImages[monthImageKey] || monthData.coverImage;
                  const hasCoverImage = !!displayImage;

                  return (
                    <Card
                      key={month}
                      className="border-coquette-brown-200 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer overflow-hidden relative group"
                      onClick={() => navigate(`/planner/${index}`)}
                    >
                      {hasCoverImage ? (
                        <div className="relative h-48 w-full">
                          <img
                            src={displayImage}
                            alt={`${month} cover`}
                            className="w-full h-full object-cover"
                            style={{ objectPosition: `${monthData.coverPosition?.x ?? 50}% ${monthData.coverPosition?.y ?? 50}%` }}
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => handleRemoveImage(index, e)}
                            className="absolute top-2 right-2 bg-white/90 hover:bg-white text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <CardContent className="p-6 text-center">
                          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-coquette-pink-200 to-coquette-brown-200 rounded-full flex items-center justify-center">
                            <span className="text-2xl font-bold text-white">{index + 1}</span>
                          </div>
                        </CardContent>
                      )}
                      
                      <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Dialog open={uploadingMonth === index} onOpenChange={(open) => !open && setUploadingMonth(null)}>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setUploadingMonth(index);
                                setPendingImage(displayImage || '');
                                setPendingPosition(monthData.coverPosition || { x: 50, y: 50 });
                              }}
                              className="bg-coquette-pink-300 hover:bg-coquette-pink-400 text-coquette-brown-600"
                            >
                              <Upload className="h-4 w-4 mr-1" />
                              {hasCoverImage ? 'Change' : 'Add'} Image
                            </Button>
                          </DialogTrigger>
                          <DialogContent onClick={(e) => e.stopPropagation()}>
                            <DialogHeader>
                              <DialogTitle className="text-coquette-brown-600">Add Cover Image for {month}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-medium text-coquette-brown-600 mb-2">
                                  Upload from device
                                </label>
                                <Input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => {
                                    handleImageUpload(index, e);
                                  }}
                                  className="border-coquette-brown-200"
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </div>
                              
                              <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                  <span className="w-full border-t border-coquette-brown-200" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                  <span className="bg-white px-2 text-coquette-brown-500">Or</span>
                                </div>
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-coquette-brown-600 mb-2">
                                  Enter image URL
                                </label>
                                <div className="flex gap-2">
                                  <Input
                                    type="url"
                                    placeholder="https://example.com/image.jpg"
                                    value={imageUrl}
                                    onChange={(e) => setImageUrl(e.target.value)}
                                    onKeyPress={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleImageUrlSubmit();
                                      }
                                    }}
                                    className="border-coquette-brown-200"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                  <Button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleImageUrlSubmit();
                                    }}
                                    className="bg-coquette-pink-300 hover:bg-coquette-pink-400 text-coquette-brown-600"
                                  >
                                    Preview URL
                                  </Button>
                                </div>
                                <p className="text-xs text-coquette-brown-400 mt-2">
                                  Try Unsplash: https://images.unsplash.com/photo-...
                                </p>
                              </div>

                              {pendingImage && (
                                <div className="space-y-3">
                                  <div className="relative w-full h-48 rounded-lg overflow-hidden border border-coquette-brown-200 bg-coquette-brown-50">
                                    <img
                                      src={pendingImage}
                                      alt="Cover preview"
                                      className="w-full h-full object-cover"
                                      style={{ objectPosition: `${pendingPosition.x}% ${pendingPosition.y}%` }}
                                    />
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                      <label className="block text-xs font-medium text-coquette-brown-600 mb-1">Horizontal position</label>
                                      <input
                                        type="range"
                                        min={0}
                                        max={100}
                                        value={pendingPosition.x}
                                        onChange={(e) => setPendingPosition(pos => ({ ...pos, x: Number(e.target.value) }))}
                                        className="w-full"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs font-medium text-coquette-brown-600 mb-1">Vertical position</label>
                                      <input
                                        type="range"
                                        min={0}
                                        max={100}
                                        value={pendingPosition.y}
                                        onChange={(e) => setPendingPosition(pos => ({ ...pos, y: Number(e.target.value) }))}
                                        className="w-full"
                                      />
                                    </div>
                                  </div>
                                </div>
                              )}

                              <div className="flex gap-2 pt-2">
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleConfirmImage(index);
                                  }}
                                  className="flex-1 bg-coquette-pink-300 hover:bg-coquette-pink-400 text-coquette-brown-600"
                                >
                                  Confirm & Save
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPendingImage('');
                                    setPendingPosition({ x: 50, y: 50 });
                                    setImageUrl('');
                                  }}
                                  className="flex-1 border-coquette-brown-200 text-coquette-brown-600 hover:bg-coquette-brown-50"
                                >
                                  Reset
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Planner;