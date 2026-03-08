import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAccountManager } from "@/hooks/useAccountManager";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { BarChart3, Plus, Trash2, Download, Edit2, FileText, FileSpreadsheet } from "lucide-react";
import jsPDF from "jspdf";
import { toast } from "sonner";
import { exportAnalysesToExcel } from "@/lib/excelExporter";

interface Analysis {
  id: string;
  accountId: string;
  asset: string;
  date: string;
  timeframe: string;
  fibonacciLevel: string;
  orderBlockLevel: string;
  liquidityZone: string;
  notes: string;
  status: "ATIVO" | "TESTADO" | "DESCARTADO";
  imageUrl1?: string;
  imageUrl2?: string;
  imageUrl3?: string;
}

export default function AnalysisHistory() {
  const { accounts, activeAccountId } = useAccountManager();
  const { user } = useAuth();
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterAsset, setFilterAsset] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [formData, setFormData] = useState({
    asset: "EUR/USD",
    timeframe: "H4",
    fibonacciLevel: "",
    orderBlockLevel: "",
    liquidityZone: "",
    notes: "",
    status: "ATIVO" as "ATIVO" | "TESTADO" | "DESCARTADO",
    imageUrl1: "",
    imageUrl2: "",
    imageUrl3: "",
  });

  const assets = ["EUR/USD", "USDJPY", "XAUUSD", "NASDAQ", "BTC USD"];

  // Load from Supabase
  useEffect(() => {
    if (!user) return;
    supabase.from("analyses").select("*").eq("user_id", user.id).eq("account_key", activeAccountId).order("created_at").then(({ data }) => {
      if (data) {
        setAnalyses(data.map((r: any) => ({
          id: r.id,
          accountId: r.account_key,
          asset: r.asset || "",
          date: r.date || "",
          timeframe: r.timeframe || "",
          fibonacciLevel: r.fibonacci_level || "",
          orderBlockLevel: r.order_block_level || "",
          liquidityZone: r.liquidity_zone || "",
          notes: r.notes || "",
          status: r.status || "ATIVO",
          imageUrl1: r.image_url1 || "",
          imageUrl2: r.image_url2 || "",
          imageUrl3: r.image_url3 || "",
        })));
      }
    });
  }, [user, activeAccountId]);

  const saveAnalyses = (newAnalyses: Analysis[]) => {
    setAnalyses(newAnalyses);
  };

  const handleAddAnalysis = async () => {
    if (!user || !formData.fibonacciLevel || !formData.orderBlockLevel) {
      toast.error("Preencha os níveis de Fibonacci e Order Block");
      return;
    }

    if (editingId) {
      await supabase.from("analyses").update({
        asset: formData.asset,
        timeframe: formData.timeframe,
        fibonacci_level: formData.fibonacciLevel,
        order_block_level: formData.orderBlockLevel,
        liquidity_zone: formData.liquidityZone,
        notes: formData.notes,
        status: formData.status,
        image_url1: formData.imageUrl1,
        image_url2: formData.imageUrl2,
        image_url3: formData.imageUrl3,
      }).eq("id", editingId).eq("user_id", user.id);
      setAnalyses(analyses.map(a => a.id === editingId ? {
        ...a, ...formData, fibonacciLevel: formData.fibonacciLevel, orderBlockLevel: formData.orderBlockLevel, liquidityZone: formData.liquidityZone,
      } : a));
      toast.success("Análise atualizada!");
      setEditingId(null);
    } else {
      const { data } = await supabase.from("analyses").insert({
        user_id: user.id,
        account_key: activeAccountId,
        asset: formData.asset,
        date: new Date().toISOString().split("T")[0],
        timeframe: formData.timeframe,
        fibonacci_level: formData.fibonacciLevel,
        order_block_level: formData.orderBlockLevel,
        liquidity_zone: formData.liquidityZone,
        notes: formData.notes,
        status: formData.status,
        image_url1: formData.imageUrl1,
        image_url2: formData.imageUrl2,
        image_url3: formData.imageUrl3,
      }).select().single();
      if (data) {
        setAnalyses([...analyses, {
          id: data.id,
          accountId: data.account_key,
          asset: data.asset || "",
          date: data.date || "",
          timeframe: data.timeframe || "",
          fibonacciLevel: data.fibonacci_level || "",
          orderBlockLevel: data.order_block_level || "",
          liquidityZone: data.liquidity_zone || "",
          notes: data.notes || "",
          status: (data.status || "ATIVO") as any,
          imageUrl1: data.image_url1 || "",
          imageUrl2: data.image_url2 || "",
          imageUrl3: data.image_url3 || "",
        }]);
      }
      toast.success("Análise registrada!");
    }

    setFormData({
      asset: "EUR/USD",
      timeframe: "H4",
      fibonacciLevel: "",
      orderBlockLevel: "",
      liquidityZone: "",
      notes: "",
      status: "ATIVO",
      imageUrl1: "",
      imageUrl2: "",
      imageUrl3: "",
    });
    setIsOpen(false);
  };

  const handleEditAnalysis = (analysis: Analysis) => {
    setEditingId(analysis.id);
    setFormData({
      asset: analysis.asset,
      timeframe: analysis.timeframe,
      fibonacciLevel: analysis.fibonacciLevel,
      orderBlockLevel: analysis.orderBlockLevel,
      liquidityZone: analysis.liquidityZone,
      notes: analysis.notes,
      status: analysis.status,
      imageUrl1: analysis.imageUrl1 || "",
      imageUrl2: analysis.imageUrl2 || "",
      imageUrl3: analysis.imageUrl3 || "",
    });
    setIsOpen(true);
  };

  const handleExportPDF = (analysis: Analysis) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 20;

    // Título
    doc.setFontSize(16);
    doc.text(`Análise - ${analysis.asset}`, pageWidth / 2, yPosition, { align: "center" });
    yPosition += 10;

    // Informações básicas
    doc.setFontSize(11);
    doc.text(`Data: ${analysis.date}`, 20, yPosition);
    yPosition += 7;
    doc.text(`Timeframe: ${analysis.timeframe}`, 20, yPosition);
    yPosition += 7;
    doc.text(`Status: ${analysis.status}`, 20, yPosition);
    yPosition += 12;

    // Detalhes da análise
    doc.setFontSize(12);
    doc.setFont(undefined as any, "bold");
    doc.text("Detalhes da Análise", 20, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    doc.setFont(undefined as any, "normal");
    
    // Fibonacci com quebra de linha
    doc.text("Nível Fibonacci:", 20, yPosition);
    yPosition += 6;
    const fibonacciLines = doc.splitTextToSize(analysis.fibonacciLevel || "N/A", pageWidth - 40);
    doc.text(fibonacciLines as string[], 30, yPosition);
    yPosition += fibonacciLines.length * 5 + 5;
    
    // Order Block com quebra de linha
    doc.text("Nível Order Block:", 20, yPosition);
    yPosition += 6;
    const orderBlockLines = doc.splitTextToSize(analysis.orderBlockLevel || "N/A", pageWidth - 40);
    doc.text(orderBlockLines as string[], 30, yPosition);
    yPosition += orderBlockLines.length * 5 + 5;
    
    // Zona de Liquidez com quebra de linha
    doc.text("Zona de Liquidez:", 20, yPosition);
    yPosition += 6;
    const liquidityLines = doc.splitTextToSize(analysis.liquidityZone || "N/A", pageWidth - 40);
    doc.text(liquidityLines as string[], 30, yPosition);
    yPosition += liquidityLines.length * 5 + 10;

    // Notas
    if (analysis.notes) {
      doc.setFont(undefined as any, "bold");
      doc.text("Notas:", 20, yPosition);
      yPosition += 6;
      doc.setFont(undefined as any, "normal");
      const noteLines = doc.splitTextToSize(analysis.notes, pageWidth - 40);
      doc.text(noteLines as string[], 20, yPosition);
      yPosition += noteLines.length * 5 + 10;
    }

    // Imagens se existirem
    const images = [analysis.imageUrl1, analysis.imageUrl2, analysis.imageUrl3].filter(Boolean);
    if (images.length > 0) {
      doc.setFont(undefined as any, "bold");
      doc.text("Imagens da Análise:", 20, yPosition);
      yPosition += 10;
      doc.setFont(undefined as any, "normal");
      
      let imagesLoaded = 0;
      images.forEach((imgUrl, idx) => {
        const img = new Image();
        img.src = imgUrl!;
        img.onload = () => {
          if (yPosition + 80 > pageHeight) {
            doc.addPage();
            yPosition = 20;
          }
          doc.text(`Imagem ${idx + 1}:`, 20, yPosition);
          yPosition += 5;
          doc.addImage(imgUrl!, "JPEG", 20, yPosition, 170, 100);
          yPosition += 110;
          imagesLoaded++;
          
          if (imagesLoaded === images.length) {
            doc.save(`analise_${analysis.asset}_${analysis.date}.pdf`);
          }
        };
      });
    } else {
      doc.save(`analise_${analysis.asset}_${analysis.date}.pdf`);
    }
  };

  const handleDeleteAnalysis = (id: string) => {
    saveAnalyses(analyses.filter((a) => a.id !== id));
  };

  const handleExportAnalyses = () => {
    const accountAnalyses = analyses.filter((a) => a.accountId === activeAccountId);
    const csv = [
      ['Data', 'Ativo', 'Timeframe', 'Nível Fibonacci', 'Nível Order Block', 'Zona Liquidez', 'Status', 'Notas'].join(','),
      ...accountAnalyses.map((a) =>
        [
          a.date,
          a.asset,
          a.timeframe,
          `"${a.fibonacciLevel}"`,
          `"${a.orderBlockLevel}"`,
          `"${a.liquidityZone}"`,
          a.status,
          `"${a.notes}"`
        ].join(',')
      )
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `analises_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredAnalyses = useMemo(() => {
    return analyses.filter((a) => {
      const matchAsset = filterAsset === "all" || a.asset === filterAsset;
      const matchStatus = filterStatus === "all" || a.status === filterStatus;
      const matchAccount = a.accountId === activeAccountId;
      return matchAsset && matchStatus && matchAccount;
    });
  }, [analyses, filterAsset, filterStatus, activeAccountId]);

  const stats = useMemo(() => {
    const accountAnalyses = analyses.filter((a) => a.accountId === activeAccountId);
    return {
      total: accountAnalyses.length,
      active: accountAnalyses.filter((a) => a.status === "ATIVO").length,
      tested: accountAnalyses.filter((a) => a.status === "TESTADO").length,
      discarded: accountAnalyses.filter((a) => a.status === "DESCARTADO").length,
    };
  }, [analyses, activeAccountId]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Histórico de Análises
          </CardTitle>
          <CardDescription>Registre e acompanhe análises de Fibonacci e Order Blocks</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold">Total</p>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{stats.total}</p>
            </div>
            <div className="bg-green-50 dark:bg-green-950/30 p-3 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-xs text-green-600 dark:text-green-400 font-semibold">Ativas</p>
              <p className="text-2xl font-bold text-green-900 dark:text-green-100">{stats.active}</p>
            </div>
            <div className="bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
              <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold">Testadas</p>
              <p className="text-2xl font-bold text-amber-900 dark:text-amber-100">{stats.tested}</p>
            </div>
            <div className="bg-red-50 dark:bg-red-950/30 p-3 rounded-lg border border-red-200 dark:border-red-800">
              <p className="text-xs text-red-600 dark:text-red-400 font-semibold">Descartadas</p>
              <p className="text-2xl font-bold text-red-900 dark:text-red-100">{stats.discarded}</p>
            </div>
          </div>

          {/* Filtros */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm">Filtrar por Ativo</Label>
              <Select value={filterAsset} onValueChange={setFilterAsset}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Ativos</SelectItem>
                  {assets.map((asset) => (
                    <SelectItem key={asset} value={asset}>
                      {asset}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm">Filtrar por Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="ATIVO">Ativa</SelectItem>
                  <SelectItem value="TESTADO">Testada</SelectItem>
                  <SelectItem value="DESCARTADO">Descartada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="grid grid-cols-3 gap-2">
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90" onClick={() => setEditingId(null)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Análise
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Registrar Nova Análise</DialogTitle>
                  <DialogDescription>Registre sua análise de Fibonacci e Order Blocks</DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Ativo</Label>
                    <Select value={formData.asset} onValueChange={(value) => setFormData({ ...formData, asset: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {assets.map((asset) => (
                          <SelectItem key={asset} value={asset}>
                            {asset}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Timeframe</Label>
                    <Select value={formData.timeframe} onValueChange={(value) => setFormData({ ...formData, timeframe: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="H4">H4</SelectItem>
                        <SelectItem value="Diário">Diário</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Nível de Fibonacci (ex: 75%-85%)</Label>
                  <Input
                    value={formData.fibonacciLevel}
                    onChange={(e) => setFormData({ ...formData, fibonacciLevel: e.target.value })}
                    placeholder="1.2500 - 1.2600"
                  />
                </div>

                <div>
                  <Label>Nível de Order Block (ex: H4, H2, H1)</Label>
                  <Input
                    value={formData.orderBlockLevel}
                    onChange={(e) => setFormData({ ...formData, orderBlockLevel: e.target.value })}
                    placeholder="1.2550 (H4) → 1.2545 (H2) → 1.2548 (H1)"
                  />
                </div>

                <div>
                  <Label>Zona de Liquidez</Label>
                  <Input
                    value={formData.liquidityZone}
                    onChange={(e) => setFormData({ ...formData, liquidityZone: e.target.value })}
                    placeholder="Descreva a zona de liquidez"
                  />
                </div>

                <div>
                  <Label>Notas e Observações</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Detalhes da análise, confluências observadas..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as any })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ATIVO">Ativa (Aguardando Preco)</SelectItem>
                      <SelectItem value="TESTADO">Testada (Trade Executado)</SelectItem>
                      <SelectItem value="DESCARTADO">Descartada (Nao Validada)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Upload de Imagens (Máximo 3)</Label>
                  <div className="space-y-3">
                    {[1, 2, 3].map((num) => {
                      const key = `imageUrl${num}` as keyof typeof formData;
                      return (
                        <div key={num}>
                          <Label className="text-sm">Imagem {num}</Label>
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                  setFormData({ ...formData, [key]: event.target?.result as string });
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                          {formData[key] && (
                            <div className="mt-2 relative w-full h-32 bg-muted rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity" onClick={() => {
                              const img = document.createElement('div');
                              img.innerHTML = `<div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.9); display: flex; align-items: center; justify-content: center; z-index: 9999;" onclick="this.remove()"><img src="${formData[key]}" style="max-width: 90vw; max-height: 90vh; object-fit: contain;" /></div>`;
                              document.body.appendChild(img.firstChild as Node);
                            }}>
                              <img src={formData[key]} alt={`Preview ${num}`} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity">
                                <span className="text-white text-sm">Clique para ampliar</span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <Button onClick={handleAddAnalysis} className="w-full bg-primary hover:bg-primary/90">
                  Registrar Análise
                </Button>
                </div>
              </DialogContent>
            </Dialog>
            <div className="grid md:grid-cols-3 gap-3">
              <Button onClick={handleExportAnalyses} variant="outline" className="w-full">
                <Download className="w-4 h-4 mr-2" />
                Exportar CSV
              </Button>
              <Button onClick={() => {
                const accountAnalyses = analyses.filter((a) => a.accountId === activeAccountId);
                exportAnalysesToExcel(accountAnalyses);
                toast.success('Análises exportadas em Excel com sucesso!');
              }} variant="outline" className="w-full">
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Exportar Excel
              </Button>
              <Button variant="outline" className="w-full" disabled title="Exporte análises individuais clicando no ícone de PDF em cada análise">
                <FileText className="w-4 h-4 mr-2" />
                Exportar PDF
              </Button>
            </div>
          </div>

          {/* Análises List */}
          <div className="space-y-3">
            {filteredAnalyses.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Nenhuma análise registrada</p>
            ) : (
              filteredAnalyses.map((analysis) => (
                <div key={analysis.id} className="bg-secondary/50 p-4 rounded-lg border border-border space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-bold text-foreground">{analysis.asset}</p>
                        <span className="text-xs bg-secondary px-2 py-1 rounded">{analysis.timeframe}</span>
                        <span
                          className={`text-xs px-2 py-1 rounded font-semibold ${
                            analysis.status === "ATIVO"
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                              : analysis.status === "TESTADO"
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100"
                              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
                          }`}
                        >
                          {analysis.status}
                        </span>
                        <span className="text-xs text-muted-foreground ml-auto">{analysis.date}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        <strong>Fibonacci:</strong> {analysis.fibonacciLevel}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <strong>Order Block:</strong> {analysis.orderBlockLevel}
                      </p>
                      {analysis.liquidityZone && (
                        <p className="text-sm text-muted-foreground">
                          <strong>Liquidez:</strong> {analysis.liquidityZone}
                        </p>
                      )}
                      {analysis.notes && <p className="text-sm text-muted-foreground mt-2">{analysis.notes}</p>}
                      
                      {(analysis.imageUrl1 || analysis.imageUrl2 || analysis.imageUrl3) && (
                        <div className="flex gap-2 mt-3 flex-wrap">
                          {[analysis.imageUrl1, analysis.imageUrl2, analysis.imageUrl3].map((img, idx) => (
                            img && (
                              <div key={idx} className="flex gap-1 items-end">
                                <div
                                  className="w-16 h-16 rounded-full overflow-hidden cursor-pointer hover:opacity-80 transition-opacity border-2 border-primary/30"
                                  onClick={() => {
                                    const div = document.createElement('div');
                                    div.innerHTML = `<div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.9); display: flex; align-items: center; justify-content: center; z-index: 9999;" onclick="this.remove()"><img src="${img}" style="max-width: 90vw; max-height: 90vh; object-fit: contain;" /></div>`;
                                    document.body.appendChild(div.firstChild as Node);
                                  }}
                                >
                                  <img src={img} alt={`Imagem ${idx + 1}`} className="w-full h-full object-cover" />
                                </div>
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => {
                                    const updatedAnalysis = {
                                      ...analysis,
                                      [`imageUrl${idx + 1}`]: ""
                                    } as Analysis;
                                    saveAnalyses(analyses.map(a => a.id === analysis.id ? updatedAnalysis : a));
                                    toast.success(`Imagem ${idx + 1} removida`);
                                  }}
                                  className="h-8 w-8 p-0"
                                  title="Remover imagem"
                                >
                                  ✕
                                </Button>
                              </div>
                            )
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditAnalysis(analysis)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleExportPDF(analysis)}
                        className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950"
                        title="Exportar análise como PDF"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteAnalysis(analysis.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
