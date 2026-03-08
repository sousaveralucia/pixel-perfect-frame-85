import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download } from "lucide-react";
import { toast } from "sonner";

export default function ReportExportEnhanced() {
  const handleExport = (type: string) => {
    toast.success(`Relatório ${type} gerado com sucesso!`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          Relatório de Performance
        </CardTitle>
        <CardDescription>Gere relatórios detalhados das suas operações</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="border border-border hover:border-primary transition-colors cursor-pointer" onClick={() => handleExport("PDF")}>
            <CardContent className="pt-6 text-center">
              <Download className="w-8 h-8 text-primary mx-auto mb-3" />
              <p className="font-bold">Relatório PDF</p>
              <p className="text-xs text-muted-foreground mt-1">Relatório completo com gráficos</p>
              <Button size="sm" className="mt-4 w-full">Gerar PDF</Button>
            </CardContent>
          </Card>
          <Card className="border border-border hover:border-primary transition-colors cursor-pointer" onClick={() => handleExport("CSV")}>
            <CardContent className="pt-6 text-center">
              <Download className="w-8 h-8 text-success mx-auto mb-3" />
              <p className="font-bold">Exportar CSV</p>
              <p className="text-xs text-muted-foreground mt-1">Dados brutos para análise</p>
              <Button size="sm" variant="outline" className="mt-4 w-full">Gerar CSV</Button>
            </CardContent>
          </Card>
          <Card className="border border-border hover:border-primary transition-colors cursor-pointer" onClick={() => handleExport("Resumo")}>
            <CardContent className="pt-6 text-center">
              <FileText className="w-8 h-8 text-chart-2 mx-auto mb-3" />
              <p className="font-bold">Resumo Semanal</p>
              <p className="text-xs text-muted-foreground mt-1">Resumo compacto da semana</p>
              <Button size="sm" variant="outline" className="mt-4 w-full">Gerar Resumo</Button>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}
