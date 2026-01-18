import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Slider } from './ui/slider';
import { ZoomIn, ZoomOut, RotateCw, Check, X, Move } from 'lucide-react';

interface ImageCropperProps {
  imageSrc: string;
  onCropComplete: (croppedImage: string) => void;
  onCancel: () => void;
  aspectRatio?: number;
  open: boolean;
}

export const ImageCropper: React.FC<ImageCropperProps> = ({
  imageSrc,
  onCropComplete,
  onCancel,
  aspectRatio = 4 / 3,
  open,
}) => {
  const [scale, setScale] = useState(1);
  const [rotate, setRotate] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load image
  useEffect(() => {
    if (!imageSrc || !open) return;
    
    const img = new Image();
    img.onload = () => {
      imageRef.current = img;
      setScale(1);
      setRotate(0);
      setPosition({ x: 0, y: 0 });
      drawCanvas();
    };
    img.src = imageSrc;
  }, [imageSrc, open]);

  // Redraw canvas when parameters change
  useEffect(() => {
    drawCanvas();
  }, [scale, rotate, position]);

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const canvasSize = 300;
    canvas.width = canvasSize;
    canvas.height = canvasSize / aspectRatio;

    // Clear canvas
    ctx.fillStyle = '#f5f0eb';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Calculate image dimensions to fit
    const imgAspect = img.width / img.height;
    const canvasAspect = canvas.width / canvas.height;
    
    let drawWidth, drawHeight;
    if (imgAspect > canvasAspect) {
      drawHeight = canvas.height * scale;
      drawWidth = drawHeight * imgAspect;
    } else {
      drawWidth = canvas.width * scale;
      drawHeight = drawWidth / imgAspect;
    }

    // Center position with offset
    const x = (canvas.width - drawWidth) / 2 + position.x;
    const y = (canvas.height - drawHeight) / 2 + position.y;

    // Apply transformations
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotate * Math.PI) / 180);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);
    
    ctx.drawImage(img, x, y, drawWidth, drawHeight);
    ctx.restore();
  };

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setDragStart({ x: clientX - position.x, y: clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setPosition({
      x: clientX - dragStart.x,
      y: clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleApply = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Create a higher resolution output
    const outputCanvas = document.createElement('canvas');
    const outputSize = 800;
    outputCanvas.width = outputSize;
    outputCanvas.height = outputSize / aspectRatio;
    
    const ctx = outputCanvas.getContext('2d');
    if (!ctx) return;

    // Draw current canvas scaled up
    ctx.drawImage(canvas, 0, 0, outputCanvas.width, outputCanvas.height);
    
    // Convert to JPEG
    const croppedImageUrl = outputCanvas.toDataURL('image/jpeg', 0.85);
    onCropComplete(croppedImageUrl);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-coquette-brown-600">Adjust Image</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Preview Area */}
          <div 
            ref={containerRef}
            className="flex justify-center bg-coquette-brown-50 rounded-lg p-4 overflow-hidden"
          >
            <div className="relative border-2 border-dashed border-coquette-pink-300 rounded-lg overflow-hidden">
              <canvas
                ref={canvasRef}
                className="cursor-move max-w-full"
                style={{ touchAction: 'none' }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleMouseDown}
                onTouchMove={handleMouseMove}
                onTouchEnd={handleMouseUp}
              />
              <div className="absolute top-2 left-2 bg-white/80 rounded px-2 py-1 text-xs text-coquette-brown-500 flex items-center gap-1">
                <Move className="h-3 w-3" />
                Drag to adjust
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-3">
            {/* Zoom */}
            <div className="flex items-center gap-3">
              <ZoomOut className="h-4 w-4 text-coquette-brown-500" />
              <Slider
                value={[scale]}
                onValueChange={(value) => setScale(value[0])}
                min={0.5}
                max={3}
                step={0.1}
                className="flex-1"
              />
              <ZoomIn className="h-4 w-4 text-coquette-brown-500" />
              <span className="text-xs text-coquette-brown-500 w-12">{Math.round(scale * 100)}%</span>
            </div>

            {/* Rotate */}
            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRotate((r) => r - 90)}
                className="border-coquette-brown-200"
              >
                <RotateCw className="h-4 w-4 mr-1 scale-x-[-1]" />
                Left
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setPosition({ x: 0, y: 0 });
                  setScale(1);
                  setRotate(0);
                }}
                className="border-coquette-brown-200"
              >
                Reset
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRotate((r) => r + 90)}
                className="border-coquette-brown-200"
              >
                <RotateCw className="h-4 w-4 mr-1" />
                Right
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={onCancel}
              className="flex-1 border-coquette-brown-200"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleApply}
              className="flex-1 bg-coquette-pink-300 hover:bg-coquette-pink-400 text-coquette-brown-600"
            >
              <Check className="h-4 w-4 mr-2" />
              Apply
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImageCropper;
