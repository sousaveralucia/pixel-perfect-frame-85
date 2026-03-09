import { useState, useMemo } from "react";
import { useTradeJournalUnified } from "@/hooks/useTradeJournalUnified";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useAccountManager } from "@/hooks/useAccountManager";
import { ImageModal } from "./ImageModal";

interface Trade {
  id: string;
  date: string;
  asset: string;
  result: "WIN" | "LOSS" | "BREAK_EVEN" | "ONGOING";
  riskReward?: number;
  postTradeImage?: string;
  notes: string;
  account: string;
}

interface MonthlyPhotoGalleryProps {
  activeAccountId?: string;
}

export function MonthlyPhotoGallery({ activeAccountId: propAccountId }: MonthlyPhotoGalleryProps = {}) {
  const { activeAccountId: hookAccountId } = useAccountManager();
  const activeAccountId = propAccountId || hookAccountId;
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedImage, setSelectedImage] = useState<{
    trade: Trade;
    imageUrl: string;
  } | null>(null);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  const { trades } = useTradeJournalUnified(activeAccountId);

  // Filtrar trades do mês atual com imagens pós-trading
  const monthlyPhotos = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    return trades.filter((trade: Trade) => {
      if (!trade.postTradeImage) return false;
      const tradeDate = new Date(trade.date);
      return tradeDate.getFullYear() === year && tradeDate.getMonth() === month;
    });
  }, [trades, currentDate]);

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const monthName = currentDate.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  const getResultColor = (result: string) => {
    const isDarkMode = document.documentElement.classList.contains('dark');
    switch (result) {
      case "WIN":
        return isDarkMode ? "bg-green-900 border-green-600" : "bg-green-100 border-green-300";
      case "LOSS":
        return isDarkMode ? "bg-red-900 border-red-600" : "bg-red-100 border-red-300";
      default:
        return isDarkMode ? "bg-gray-700 border-gray-600" : "bg-gray-100 border-gray-300";
    }
  };

  const getResultBadge = (result: string) => {
    switch (result) {
      case "WIN":
        return <Badge className="bg-green-600">Vitória</Badge>;
      case "LOSS":
        return <Badge className="bg-red-600">Derrota</Badge>;
      default:
        return <Badge className="bg-gray-600">Empate</Badge>;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <Card className="flex-1 flex flex-col">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="capitalize">Resumo Mensal - {monthName}</CardTitle>
              <CardDescription>Galeria de fotos pós-trading do mês</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={goToNextMonth}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto">
          {monthlyPhotos.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Nenhuma foto pós-trading neste mês</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {monthlyPhotos.map((trade: Trade) => (
                <button
                  key={trade.id}
                  onClick={() =>
                    setSelectedImage({
                      trade,
                      imageUrl: trade.postTradeImage!,
                    })
                  }
                  className={`relative group overflow-hidden rounded-lg border-2 transition-all hover:shadow-lg aspect-square ${getResultColor(
                    trade.result
                  )}`}
                >
                  <img
                    src={trade.postTradeImage}
                    alt={`Trade ${trade.date}`}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-end p-2">
                    <div className="text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                      {trade.date}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Image Details Modal */}
      {selectedImage && (
        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="max-w-7xl max-h-[95vh] p-0 overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Trade - {selectedImage.trade.date}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="flex justify-center bg-black rounded-lg p-4">
                <img
                  src={selectedImage.imageUrl}
                  alt="Trade"
                  className="max-w-full max-h-[90vh] object-contain rounded-lg cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setExpandedImage(selectedImage.imageUrl)}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Ativo</p>
                  <p className="font-bold text-lg">{selectedImage.trade.asset}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Resultado</p>
                  <div className="mt-1">{getResultBadge(selectedImage.trade.result)}</div>
                </div>
                {selectedImage.trade.riskReward !== 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground">R:R</p>
                    <p
                      className={`font-bold text-lg ${
                        selectedImage.trade.riskReward! > 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {selectedImage.trade.riskReward! > 0 ? "+" : ""}
                      {selectedImage.trade.riskReward}RR
                    </p>
                  </div>
                )}
              </div>

              {selectedImage.trade.notes && (
                <div className={`p-3 rounded-lg ${
                  document.documentElement.classList.contains('dark')
                    ? 'bg-slate-700'
                    : 'bg-blue-50'
                }`}>
                  <p className="text-sm text-muted-foreground mb-1">Notas</p>
                  <p className="text-sm">{selectedImage.trade.notes}</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Image Modal */}
      <ImageModal 
        imageUrl={expandedImage} 
        onClose={() => setExpandedImage(null)} 
      />
    </div>
  );
}
