import React, { useState } from 'react';
import { X } from 'lucide-react';
import { SimpleImageViewer } from './SimpleImageViewer';

interface TradeImageGalleryProps {
  preImage?: string;
  duringImage?: string;
  postImage?: string;
  onClose: () => void;
}

export function TradeImageGallery({
  preImage,
  duringImage,
  postImage,
  onClose,
}: TradeImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const images = [
    { label: 'Pré-Trading', url: preImage, color: 'bg-blue-500/20' },
    { label: 'Durante Trading', url: duringImage, color: 'bg-yellow-500/20' },
    { label: 'Pós-Trading', url: postImage, color: 'bg-green-500/20' },
  ];

  const hasImages = images.some(img => img.url);

  if (!hasImages) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg p-6 max-w-md w-full">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Galeria de Imagens</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-gray-600 text-center">Nenhuma imagem disponível para este trade.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Galeria de Imagens do Trade</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Gallery Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {images.map((image, idx) => (
              <div
                key={idx}
                className={`rounded-lg overflow-hidden border-2 border-gray-200 ${image.color}`}
              >
                {image.url ? (
                  <div className="flex flex-col">
                    <img
                      src={image.url}
                      alt={image.label}
                      className="w-full h-48 object-cover cursor-pointer hover:opacity-75 transition-opacity"
                      onClick={() => setSelectedImage(image.url || null)}
                    />
                    <div className="p-3 bg-gray-50">
                      <p className="font-semibold text-sm text-gray-700">{image.label}</p>
                      <button
                        onClick={() => setSelectedImage(image.url || null)}
                        className="mt-2 w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-3 rounded text-sm transition-colors"
                      >
                        Ampliar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-48 flex items-center justify-center bg-gray-100">
                    <p className="text-gray-400 text-sm">Sem imagem</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Image Viewer Modal */}
      {selectedImage && (
        <SimpleImageViewer
          imageUrl={selectedImage}
          onClose={() => setSelectedImage(null)}
        />
      )}
    </>
  );
}
