import React, { useRef, useState } from 'react';
import { Upload, X } from 'lucide-react';
import { Button } from './ui/button';
import { validateAndCompressImage } from '../lib/imageCompression';
import { ImageCropper } from './ImageCropper';

interface CurvedArchesProps {
  images: [string, string, string];
  onUpload: (index: 0 | 1 | 2, imageData: string) => void | Promise<void>;
  onRemove: (index: 0 | 1 | 2) => void | Promise<void>;
}

export const CurvedArches: React.FC<CurvedArchesProps> = ({ images, onUpload, onRemove }) => {
  const fileInputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];
  const [cropperOpen, setCropperOpen] = useState(false);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [pendingIndex, setPendingIndex] = useState<0 | 1 | 2>(0);

  const handleFileSelect = async (index: 0 | 1 | 2, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await validateAndCompressImage(file);
        setPendingImage(compressed);
        setPendingIndex(index);
        setCropperOpen(true);
      } catch (error) {
        console.error('Image upload failed:', error);
        alert(error instanceof Error ? error.message : 'Failed to upload image');
      }
    }
    // Reset input
    if (fileInputRefs[index].current) {
      fileInputRefs[index].current.value = '';
    }
  };

  const handleCropComplete = (croppedImage: string) => {
    onUpload(pendingIndex, croppedImage);
    setCropperOpen(false);
    setPendingImage(null);
  };

  const handleCropCancel = () => {
    setCropperOpen(false);
    setPendingImage(null);
  };

  return (
    <>
      <div className="relative w-full bg-gradient-to-b from-white to-transparent pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            {images.map((image, index) => (
              <div key={index} className="relative group">
                <div 
                  className="relative overflow-hidden bg-gradient-to-br from-coquette-pink-100 to-coquette-brown-100 border-2 border-coquette-brown-200 cursor-pointer transition-all hover:shadow-xl"
                  style={{
                    height: 'clamp(120px, 25vw, 240px)',
                    borderRadius: '50% 50% 0 0',
                  }}
                  onClick={() => !image && fileInputRefs[index].current?.click()}
                >
                  {image ? (
                    <>
                      <img
                        src={image}
                        alt={`Decorative arch ${index + 1}`}
                        className="w-full h-full object-cover"
                        style={{
                          borderRadius: '50% 50% 0 0',
                        }}
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 sm:gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            fileInputRefs[index].current?.click();
                          }}
                          className="bg-white/90 hover:bg-white h-8 w-8 sm:h-9 sm:w-auto sm:px-3 p-0"
                        >
                          <Upload className="h-4 w-4" />
                          <span className="hidden sm:inline ml-1">Edit</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemove(index as 0 | 1 | 2);
                          }}
                          className="bg-red-500/90 hover:bg-red-600 h-8 w-8 sm:h-9 sm:w-auto sm:px-3 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-coquette-brown-400">
                      <Upload className="h-6 w-6 sm:h-8 sm:w-8 mb-1 sm:mb-2" />
                      <span className="text-xs sm:text-sm font-medium">Upload</span>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRefs[index]}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileSelect(index as 0 | 1 | 2, e)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Image Cropper Dialog */}
      {pendingImage && (
        <ImageCropper
          open={cropperOpen}
          imageSrc={pendingImage}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
          aspectRatio={1}
        />
      )}
    </>
  );
};

interface BorderImageProps {
  image: string;
  onUpload: (imageData: string) => void | Promise<void>;
  onRemove: () => void | Promise<void>;
}

export const BorderImage: React.FC<BorderImageProps> = ({ image, onUpload, onRemove }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [pendingImage, setPendingImage] = useState<string | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await validateAndCompressImage(file);
        setPendingImage(compressed);
        setCropperOpen(true);
      } catch (error) {
        console.error('Image upload failed:', error);
        alert(error instanceof Error ? error.message : 'Failed to upload image');
      }
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCropComplete = (croppedImage: string) => {
    onUpload(croppedImage);
    setCropperOpen(false);
    setPendingImage(null);
  };

  const handleCropCancel = () => {
    setCropperOpen(false);
    setPendingImage(null);
  };

  return (
    <>
      <div className="relative w-full">
        {image ? (
          <div className="relative group">
            <div className="w-full h-56 sm:h-64 md:h-72 overflow-hidden border-b-4 border-coquette-brown-300">
              <img
                src={image}
                alt="Header decoration"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
                className="bg-white/90 hover:bg-white shadow-lg"
              >
                <Upload className="h-4 w-4 mr-1" />
                Change
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={onRemove}
                className="bg-red-500/90 hover:bg-red-600 shadow-lg"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-56 sm:h-64 md:h-72 border-b-4 border-dashed border-coquette-brown-300 bg-gradient-to-r from-coquette-pink-50 to-coquette-brown-50 flex flex-col items-center justify-center cursor-pointer hover:bg-gradient-to-r hover:from-coquette-pink-100 hover:to-coquette-brown-100 transition-all"
          >
            <Upload className="h-8 w-8 text-coquette-brown-400 mb-2" />
            <span className="text-sm font-medium text-coquette-brown-500">Add header image</span>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      {/* Image Cropper Dialog */}
      {pendingImage && (
        <ImageCropper
          open={cropperOpen}
          imageSrc={pendingImage}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
          aspectRatio={16 / 9}
        />
      )}
    </>
  );
};
