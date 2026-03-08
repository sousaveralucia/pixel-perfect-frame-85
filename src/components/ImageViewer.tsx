import React, { useRef, useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ZoomIn, ZoomOut, Trash2 } from "lucide-react";

interface ImageViewerProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  title: string;
}

export function ImageViewer({ isOpen, onClose, imageUrl, title }: ImageViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [zoom, setZoom] = useState(100);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState("#FF0000");
  const [brushSize, setBrushSize] = useState(3);
  const [imageLoaded, setImageLoaded] = useState(false);
  const originalImageRef = useRef<HTMLCanvasElement>(null);

  // Carregar imagem quando o modal abre
  useEffect(() => {
    if (isOpen && imageUrl) {
      const img = new Image();
      img.onload = () => {
        if (canvasRef.current && originalImageRef.current) {
          const canvas = canvasRef.current;
          const originalCanvas = originalImageRef.current;
          
          canvas.width = img.width;
          canvas.height = img.height;
          originalCanvas.width = img.width;
          originalCanvas.height = img.height;
          
          const ctx = canvas.getContext("2d");
          const originalCtx = originalCanvas.getContext("2d");
          
          if (ctx && originalCtx) {
            ctx.drawImage(img, 0, 0);
            originalCtx.drawImage(img, 0, 0);
            setImageLoaded(true);
          }
        }
      };
      img.onerror = () => {
        console.error("Erro ao carregar imagem:", imageUrl);
        if (imageUrl.startsWith('data:')) {
          setImageLoaded(true);
        }
      };
      img.src = imageUrl;
    }
  }, [isOpen, imageUrl]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / (zoom / 100);
    const y = (e.clientY - rect.top) / (zoom / 100);

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / (zoom / 100);
    const y = (e.clientY - rect.top) / (zoom / 100);

    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const handleClearDrawing = () => {
    if (!canvasRef.current || !originalImageRef.current) return;
    const canvas = canvasRef.current;
    const originalCanvas = originalImageRef.current;
    const ctx = canvas.getContext("2d");
    const originalCtx = originalCanvas.getContext("2d");
    
    if (ctx && originalCtx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(originalCanvas, 0, 0);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3 flex-1 overflow-hidden">
          {/* Toolbar */}
          <div className="flex gap-2 flex-wrap items-center bg-gray-50 p-3 rounded-lg">
            {/* Zoom Controls */}
            <div className="flex items-center gap-2 border-r pr-3">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setZoom(Math.max(50, zoom - 10))}
              >
                <ZoomOut className="w-4 h-4" />
              </Button>

              <Slider
                value={[zoom]}
                onValueChange={(value) => setZoom(value[0])}
                min={50}
                max={300}
                step={10}
                className="w-32"
              />

              <Button
                size="sm"
                variant="outline"
                onClick={() => setZoom(Math.min(300, zoom + 10))}
              >
                <ZoomIn className="w-4 h-4" />
              </Button>

              <span className="text-sm font-medium w-12">{zoom}%</span>
            </div>

            {/* Drawing Tools */}
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={brushColor}
                onChange={(e) => setBrushColor(e.target.value)}
                className="w-8 h-8 rounded cursor-pointer"
                title="Cor do rabisco"
              />

              <div className="flex items-center gap-2">
                <span className="text-xs">Tamanho:</span>
                <Slider
                  value={[brushSize]}
                  onValueChange={(value) => setBrushSize(value[0])}
                  min={1}
                  max={15}
                  step={1}
                  className="w-20"
                />
                <span className="text-xs w-6">{brushSize}px</span>
              </div>

              <Button 
                size="sm" 
                variant="outline" 
                onClick={handleClearDrawing}
                title="Limpar rabiscos (não salva)"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Image Canvas */}
          <div className="flex-1 border rounded-lg overflow-auto bg-gray-100 flex items-center justify-center">
            {imageLoaded ? (
              <>
                <canvas
                  ref={originalImageRef}
                  style={{ display: 'none' }}
                />
                <canvas
                  ref={canvasRef}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  className="cursor-crosshair"
                  style={{
                    transform: `scale(${zoom / 100})`,
                    transformOrigin: "top left",
                    display: "block",
                  }}
                />
              </>
            ) : (
              <div className="text-center text-muted-foreground">
                <p>Carregando imagem...</p>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="text-xs text-muted-foreground text-center">
            💡 Rabiscos são temporários e não serão salvos quando você sair
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
