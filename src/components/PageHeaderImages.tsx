import React, { useRef } from 'react';
import { Upload, X } from 'lucide-react';
import { Button } from './ui/button';
import { validateAndCompressImage } from '../lib/imageCompression';

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

  const handleFileUpload = async (index: 0 | 1 | 2, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await validateAndCompressImage(file);
        onUpload(index, compressed);
      } catch (error) {
        console.error('Image upload failed:', error);
        alert(error instanceof Error ? error.message : 'Failed to upload image');
      }
    }
  };

  return (
    <div className="relative w-full bg-gradient-to-b from-white to-transparent pb-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-3 gap-4">
          {images.map((image, index) => (
            <div key={index} className="relative group">
              <div 
                className="relative overflow-hidden bg-gradient-to-br from-coquette-pink-100 to-coquette-brown-100 border-2 border-coquette-brown-200 cursor-pointer transition-all hover:shadow-xl"
                style={{
                  height: '180px',
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
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          fileInputRefs[index].current?.click();
                        }}
                        className="bg-white/90 hover:bg-white"
                      >
                        <Upload className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemove(index as 0 | 1 | 2);
                        }}
                        className="bg-red-500/90 hover:bg-red-600"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-coquette-brown-400">
                    <Upload className="h-8 w-8 mb-2" />
                    <span className="text-sm font-medium">Upload Photo</span>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRefs[index]}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileUpload(index as 0 | 1 | 2, e)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

interface BorderImageProps {
  image: string;
  onUpload: (imageData: string) => void | Promise<void>;
  onRemove: () => void | Promise<void>;
}

export const BorderImage: React.FC<BorderImageProps> = ({ image, onUpload, onRemove }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await validateAndCompressImage(file);
        onUpload(compressed);
      } catch (error) {
        console.error('Image upload failed:', error);
        alert(error instanceof Error ? error.message : 'Failed to upload image');
      }
    }
  };

  return (
    <div className="relative w-full">
      {image ? (
        <div className="relative group">
          <div className="w-full h-48 overflow-hidden border-b-4 border-coquette-brown-300">
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
          className="w-full h-48 border-b-4 border-dashed border-coquette-brown-300 bg-gradient-to-r from-coquette-pink-50 to-coquette-brown-50 flex flex-col items-center justify-center cursor-pointer hover:bg-gradient-to-r hover:from-coquette-pink-100 hover:to-coquette-brown-100 transition-all"
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
        onChange={handleFileUpload}
      />
    </div>
  );
};
