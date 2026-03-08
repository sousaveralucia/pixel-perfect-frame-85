import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Palette } from "lucide-react";
import { toast } from "sonner";

interface PDFColors {
  headerBg: string;
  headerText: string;
  tableHeaderBg: string;
  tableHeaderText: string;
  tableRowBg1: string;
  tableRowBg2: string;
  tableRowText: string;
  accentColor: string;
}

const DEFAULT_COLORS: PDFColors = {
  headerBg: "#ffffff",
  headerText: "#000000",
  tableHeaderBg: "#c8dcfa",
  tableHeaderText: "#000000",
  tableRowBg1: "#f5f5f5",
  tableRowBg2: "#ffffff",
  tableRowText: "#000000",
  accentColor: "#d97706",
};

interface PDFColorCustomizerProps {
  onColorsChange: (colors: PDFColors) => void;
}

export default function PDFColorCustomizer({ onColorsChange }: PDFColorCustomizerProps) {
  const [colors, setColors] = useState<PDFColors>(() => {
    const saved = localStorage.getItem("pdfColors");
    return saved ? JSON.parse(saved) : DEFAULT_COLORS;
  });

  const [previewMode, setPreviewMode] = useState(false);

  const handleColorChange = (key: keyof PDFColors, value: string) => {
    const newColors = { ...colors, [key]: value };
    setColors(newColors);
    localStorage.setItem("pdfColors", JSON.stringify(newColors));
    onColorsChange(newColors);
  };

  const handleReset = () => {
    setColors(DEFAULT_COLORS);
    localStorage.setItem("pdfColors", JSON.stringify(DEFAULT_COLORS));
    onColorsChange(DEFAULT_COLORS);
    toast.success("Cores resetadas para padrão");
  };

  const colorFields = [
    { key: "headerBg" as const, label: "Fundo do Cabeçalho" },
    { key: "headerText" as const, label: "Texto do Cabeçalho" },
    { key: "tableHeaderBg" as const, label: "Fundo Cabeçalho Tabela" },
    { key: "tableHeaderText" as const, label: "Texto Cabeçalho Tabela" },
    { key: "tableRowBg1" as const, label: "Fundo Linha Tabela (Par)" },
    { key: "tableRowBg2" as const, label: "Fundo Linha Tabela (Ímpar)" },
    { key: "tableRowText" as const, label: "Texto Linhas Tabela" },
    { key: "accentColor" as const, label: "Cor de Destaque" },
  ];

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="w-5 h-5 text-primary" />
          Customizador de Cores do PDF
        </CardTitle>
        <CardDescription>
          Personalize as cores do seu relatório PDF de trades
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Preview */}
        {previewMode && (
          <div className="p-4 rounded-lg border-2 border-primary/20 space-y-4">
            <h3 className="font-semibold text-foreground">Prévia das Cores</h3>
            <div
              className="p-4 rounded text-center font-bold"
              style={{
                backgroundColor: colors.headerBg,
                color: colors.headerText,
              }}
            >
              Cabeçalho do Relatório
            </div>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr
                  style={{
                    backgroundColor: colors.tableHeaderBg,
                    color: colors.tableHeaderText,
                  }}
                >
                  <th className="border p-2 text-left">Data</th>
                  <th className="border p-2 text-left">Ativo</th>
                  <th className="border p-2 text-right">Resultado</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  style={{
                    backgroundColor: colors.tableRowBg1,
                    color: colors.tableRowText,
                  }}
                >
                  <td className="border p-2">2026-03-07</td>
                  <td className="border p-2">EUR/USD</td>
                  <td className="border p-2 text-right">+$50</td>
                </tr>
                <tr
                  style={{
                    backgroundColor: colors.tableRowBg2,
                    color: colors.tableRowText,
                  }}
                >
                  <td className="border p-2">2026-03-06</td>
                  <td className="border p-2">XAUUSD</td>
                  <td className="border p-2 text-right">-$20</td>
                </tr>
              </tbody>
            </table>
            <div
              className="p-2 rounded text-white text-center font-semibold"
              style={{ backgroundColor: colors.accentColor }}
            >
              Cor de Destaque
            </div>
          </div>
        )}

        {/* Color Picker Grid */}
        <div className="grid md:grid-cols-2 gap-4">
          {colorFields.map((field) => (
            <div key={field.key} className="space-y-2">
              <Label className="text-sm">{field.label}</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={colors[field.key]}
                  onChange={(e) => handleColorChange(field.key, e.target.value)}
                  className="h-10 w-16 p-1 cursor-pointer"
                />
                <Input
                  type="text"
                  value={colors[field.key]}
                  onChange={(e) => handleColorChange(field.key, e.target.value)}
                  placeholder="#000000"
                  className="flex-1 h-10 text-sm font-mono"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Buttons */}
        <div className="flex gap-2 pt-4">
          <Button
            onClick={() => setPreviewMode(!previewMode)}
            variant="outline"
            className="flex-1"
          >
            {previewMode ? "Ocultar Prévia" : "Mostrar Prévia"}
          </Button>
          <Button
            onClick={handleReset}
            variant="destructive"
            className="flex-1"
          >
            Resetar Cores
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          As cores serão aplicadas automaticamente ao gerar novos relatórios em PDF.
        </p>
      </CardContent>
    </Card>
  );
}
