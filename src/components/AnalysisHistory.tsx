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
import { exportAnalysesToExcel, exportToCSV } from "@/lib/excelExporter";

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
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;
    let y = 20;

    // === Header bar ===
    doc.setFillColor(16, 185, 129); // emerald-500
    doc.rect(0, 0, pageWidth, 40, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont(undefined as any, "bold");
    doc.text(`Análise — ${analysis.asset}`, margin, 26);
    doc.setFontSize(10);
    doc.setFont(undefined as any, "normal");
    doc.text(`${analysis.date}  •  ${analysis.timeframe}  •  ${analysis.status}`, margin, 35);

    y = 52;
    doc.setTextColor(30, 41, 59); // slate-800

    // === Helper: section block ===
    const drawSection = (title: string, content: string) => {
      if (!content) return;
      // Check page break
      const lines = doc.splitTextToSize(content, contentWidth - 16);
      const blockHeight = 10 + lines.length * 5 + 8;
      if (y + blockHeight > pageHeight - 20) {
        doc.addPage();
        y = 20;
      }
      // Section title
      doc.setFillColor(241, 245, 249); // slate-100
      doc.roundedRect(margin, y, contentWidth, blockHeight, 3, 3, "F");
      doc.setFontSize(10);
      doc.setFont(undefined as any, "bold");
      doc.setTextColor(16, 185, 129);
      doc.text(title, margin + 8, y + 7);
      // Section content
      doc.setFont(undefined as any, "normal");
      doc.setTextColor(51, 65, 85); // slate-600
      doc.setFontSize(9);
      doc.text(lines as string[], margin + 8, y + 14);
      y += blockHeight + 6;
    };

    drawSection("Nível de Fibonacci", analysis.fibonacciLevel || "N/A");
    drawSection("Nível de Order Block", analysis.orderBlockLevel || "N/A");
    drawSection("Zona de Liquidez", analysis.liquidityZone || "N/A");
    drawSection("Notas e Observações", analysis.notes || "");

    // === Images ===
    const images = [analysis.imageUrl1, analysis.imageUrl2, analysis.imageUrl3].filter(Boolean);
    if (images.length > 0) {
      let imagesLoaded = 0;
      
      if (y + 10 > pageHeight - 20) {
        doc.addPage();
        y = 20;
      }
      doc.setFontSize(11);
      doc.setFont(undefined as any, "bold");
      doc.setTextColor(16, 185, 129);
      doc.text("Imagens da Análise", margin, y + 5);
      y += 12;

      images.forEach((imgUrl, idx) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = imgUrl!;
        img.onload = () => {
          if (y + 100 > pageHeight - 20) {
            doc.addPage();
            y = 20;
          }
          doc.setFontSize(9);
          doc.setTextColor(100, 116, 139);
          doc.setFont(undefined as any, "normal");
          doc.text(`Imagem ${idx + 1}`, margin, y + 4);
          y += 7;
          // Border around image
          doc.setDrawColor(203, 213, 225);
          doc.roundedRect(margin, y, contentWidth, 95, 2, 2, "S");
          doc.addImage(imgUrl!, "JPEG", margin + 2, y + 2, contentWidth - 4, 91);
          y += 102;
          imagesLoaded++;

          if (imagesLoaded === images.length) {
            // Footer
            const totalPages = doc.getNumberOfPages();
            for (let i = 1; i <= totalPages; i++) {
              doc.setPage(i);
              doc.setFontSize(8);
              doc.setTextColor(148, 163, 184);
              doc.text(`Página ${i} de ${totalPages}`, pageWidth / 2, pageHeight - 8, { align: "center" });
            }
            doc.save(`analise_${analysis.asset}_${analysis.date}.pdf`);
          }
        };
      });
    } else {
      // Footer
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text("Página 1 de 1", pageWidth / 2, pageHeight - 8, { align: "center" });
      doc.save(`analise_${analysis.asset}_${analysis.date}.pdf`);
    }
  };

  const handleDeleteAnalysis = async (id: string) => {
    if (!user) return;
    await supabase.from("analyses").delete().eq("id", id).eq("user_id", user.id);
    setAnalyses(analyses.filter((a) => a.id !== id));
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
              <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
                <DialogHeader className="flex-shrink-0">
                  <DialogTitle>{editingId ? 'Editar Análise' : 'Registrar Nova Análise'}</DialogTitle>
                  <DialogDescription>Registre sua análise de Fibonacci e Order Blocks</DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto pr-2 space-y-4 min-h-0">
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
                      className="resize-none"
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
                              <div className="mt-2 relative w-full h-28 bg-muted rounded-lg overflow-hidden">
                                <img src={formData[key]} alt={`Preview ${num}`} className="w-full h-full object-cover" />
                                <button
                                  type="button"
                                  onClick={() => setFormData({ ...formData, [key]: "" })}
                                  className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs hover:opacity-80"
                                >
                                  ✕
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex-shrink-0 pt-4 border-t border-border">
                  <Button onClick={handleAddAnalysis} className="w-full bg-primary hover:bg-primary/90">
                    {editingId ? 'Salvar Alterações' : 'Registrar Análise'}
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
                <div key={analysis.id} className="bg-secondary/50 p-4 rounded-lg border border-border space-y-2 overflow-hidden">
                  <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
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
                      <span className="text-xs text-muted-foreground">{analysis.date}</span>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditAnalysis(analysis)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950 h-8 w-8 p-0"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleExportPDF(analysis)}
                        className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950 h-8 w-8 p-0"
                        title="Exportar PDF"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteAnalysis(analysis.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950 h-8 w-8 p-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="min-w-0 space-y-1">
                    <p className="text-sm text-muted-foreground break-words">
                      <strong>Fibonacci:</strong> {analysis.fibonacciLevel}
                    </p>
                    <p className="text-sm text-muted-foreground break-words">
                      <strong>Order Block:</strong> {analysis.orderBlockLevel}
                    </p>
                    {analysis.liquidityZone && (
                      <p className="text-sm text-muted-foreground break-words">
                        <strong>Liquidez:</strong> {analysis.liquidityZone}
                      </p>
                    )}
                    {analysis.notes && <p className="text-sm text-muted-foreground mt-2 break-words">{analysis.notes}</p>}
                    
                    {(analysis.imageUrl1 || analysis.imageUrl2 || analysis.imageUrl3) && (
                      <div className="flex gap-2 mt-3 flex-wrap">
                        {[analysis.imageUrl1, analysis.imageUrl2, analysis.imageUrl3].map((img, idx) => (
                          img && (
                            <div key={idx} className="flex gap-1 items-end">
                              <div
                                className="w-16 h-16 rounded-full overflow-hidden cursor-pointer hover:opacity-80 transition-opacity border-2 border-primary/30 flex-shrink-0"
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
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
