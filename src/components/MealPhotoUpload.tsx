import React, { useRef, useState } from 'react';
import { Upload, X } from 'lucide-react';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { validateAndCompressImage } from '../lib/imageCompression';
import { ImageCropper } from './ImageCropper';

interface MealPhotoUploadProps {
  image: string;
  onImageChange: (imageData: string) => void;
  onClear: () => void;
  isLoading?: boolean;
}

export const MealPhotoUpload: React.FC<MealPhotoUploadProps> = ({
  image,
  onImageChange,
  onClear,
  isLoading = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [pendingImage, setPendingImage] = useState<string | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log('File selected:', file.name, 'Size:', (file.size / 1024).toFixed(2), 'KB');
      try {
        const compressed = await validateAndCompressImage(file);
        console.log('Image compressed successfully, length:', compressed.length);
        setPendingImage(compressed);
        setCropperOpen(true);
      } catch (error) {
        console.error('Error compressing image:', error);
        alert(error instanceof Error ? error.message : 'Failed to process image. Please try again.');
      }
    }
    // Reset the input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCropComplete = (croppedImage: string) => {
    onImageChange(croppedImage);
    setCropperOpen(false);
    setPendingImage(null);
  };

  const handleCropCancel = () => {
    setCropperOpen(false);
    setPendingImage(null);
  };

  return (
    <>
      <div className="space-y-3">
        <Label htmlFor="meal-photo-upload">Upload Photo</Label>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="border-coquette-brown-200 text-coquette-brown-600 hover:bg-coquette-pink-50 flex-1"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
          >
            <Upload className="h-4 w-4 mr-2" />
            {image ? 'Change Photo' : 'Choose Photo'}
          </Button>
          {image && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-red-500 hover:bg-red-50"
              onClick={onClear}
              disabled={isLoading}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <input
          ref={fileInputRef}
          id="meal-photo-upload"
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={isLoading}
        />
        {image && (
          <div className="mt-3">
            <Label>Photo Preview</Label>
            <img
              src={image}
              alt="Meal preview"
              className="w-full h-40 object-cover rounded-lg border border-coquette-brown-200 bg-coquette-brown-50"
            />
          </div>
        )}
      </div>

      {/* Image Cropper Dialog */}
      {pendingImage && (
        <ImageCropper
          open={cropperOpen}
          imageSrc={pendingImage}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
          aspectRatio={4 / 3}
        />
      )}
    </>
  );
};
