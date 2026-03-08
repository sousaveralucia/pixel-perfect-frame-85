import { useState, useEffect } from "react";
import { X } from "lucide-react";

interface ImageModalProps {
  imageUrl: string | null;
  onClose: () => void;
}

export function ImageModal({ imageUrl, onClose }: ImageModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!imageUrl) return null;

    <div 
      className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 bg-white rounded-full p-2 hover:bg-gray-200 transition-colors"
        aria-label="Fechar"
      >
        <X className="w-6 h-6 text-black" />
      </button>

      {/* Image Container */}
      <div 
        className="w-full h-full flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={imageUrl}
          alt="Imagem ampliada"
          className="max-w-full max-h-full object-contain"
        />
      </div>


    </div>
  );
}
