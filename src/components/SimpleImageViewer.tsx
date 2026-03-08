import React, { useState, useRef, useEffect } from 'react';
import { X, Pen, Trash2 } from 'lucide-react';

interface SimpleImageViewerProps {
  imageUrl: string | null;
  onClose: () => void;
}

export function SimpleImageViewer({ imageUrl, onClose }: SimpleImageViewerProps) {
  const [zoom, setZoom] = useState(1);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawMode, setDrawMode] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !imageUrl || !drawMode) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Carregar imagem no canvas
    const img = new Image();
    img.src = imageUrl;
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
    };
  }, [imageUrl, drawMode]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawMode) return;
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    // Corrigir offset: considerar a escala do canvas e o zoom
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !drawMode) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    // Corrigir offset: considerar a escala do canvas e o zoom
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#FF0000';
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const handleClearDrawing = () => {
    const canvas = canvasRef.current;
    if (!canvas || !imageUrl) return;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      const img = new Image();
      img.src = imageUrl;
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
    }
  };

  if (!imageUrl) return null;

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      {/* Botão Fechar */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 rounded-full p-2 transition-colors z-10"
      >
        <X className="w-6 h-6 text-white" />
      </button>

      {/* Container da Imagem */}
      <div className="flex flex-col items-center justify-center w-full h-full gap-4" ref={containerRef}>
        {/* Canvas/Imagem com Desenho */}
        <div className="relative" style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}>
          {drawMode ? (
            <canvas
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              className="max-w-full max-h-[80vh] object-contain rounded-lg cursor-crosshair"
            />
          ) : (
            <img
              src={imageUrl}
              alt="Trade Image"
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
            />
          )}
        </div>

        {/* Controles */}
        <div className="flex gap-2 bg-white/10 rounded-lg p-3 backdrop-blur-sm flex-wrap justify-center">
          {/* Zoom Controls */}
          <button
            onClick={() => setZoom(Math.max(0.5, zoom - 0.2))}
            className="bg-white/20 hover:bg-white/40 text-white px-4 py-2 rounded transition-colors"
          >
            −
          </button>
          <span className="text-white px-4 py-2 min-w-[60px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom(Math.min(3, zoom + 0.2))}
            className="bg-white/20 hover:bg-white/40 text-white px-4 py-2 rounded transition-colors"
          >
            +
          </button>
          <button
            onClick={() => setZoom(1)}
            className="bg-white/20 hover:bg-white/40 text-white px-4 py-2 rounded transition-colors"
          >
            Reset
          </button>

          {/* Separador */}
          <div className="w-px bg-white/20"></div>

          {/* Draw Controls */}
          <button
            onClick={() => setDrawMode(!drawMode)}
            className={`flex items-center gap-2 px-4 py-2 rounded transition-colors ${
              drawMode
                ? 'bg-red-500/40 hover:bg-red-500/60 text-white'
                : 'bg-white/20 hover:bg-white/40 text-white'
            }`}
          >
            <Pen className="w-4 h-4" />
            {drawMode ? 'Desativar Desenho' : 'Ativar Desenho'}
          </button>

          {drawMode && (
            <button
              onClick={handleClearDrawing}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/40 text-white px-4 py-2 rounded transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Limpar
            </button>
          )}
        </div>

        {/* Informação */}
        {drawMode && (
          <p className="text-white/60 text-sm text-center">
            ✏️ Desenhe na imagem com o mouse. Os rabiscos não serão salvos quando você fechar.
          </p>
        )}
      </div>
    </div>
  );
}
