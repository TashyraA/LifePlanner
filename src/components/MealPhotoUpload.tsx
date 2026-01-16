import React, { useRef } from 'react';
import { Upload, X } from 'lucide-react';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { validateAndCompressImage } from '../lib/imageCompression';

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log('File selected:', file.name, 'Size:', (file.size / 1024).toFixed(2), 'KB');
      try {
        const compressed = await validateAndCompressImage(file);
        console.log('Image compressed successfully, length:', compressed.length);
        onImageChange(compressed);
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

  return (
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
        onChange={handleFileUpload}
        className="hidden"
        disabled={isLoading}
      />
      {image && (
        <div className="mt-3">
          <Label>Photo Preview</Label>
          <img
            src={image}
            alt="Meal preview"
            className="w-full h-32 object-cover rounded-lg border border-coquette-brown-200"
          />
        </div>
      )}
    </div>
  );
};
