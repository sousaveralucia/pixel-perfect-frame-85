import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Pencil, Plus, Trash2, GripVertical, RotateCcw, Save } from "lucide-react";
import { ChecklistItem } from "@/hooks/useCustomChecklists";

const EMOJI_OPTIONS = [
  "📊", "📦", "📉", "🎯", "💰", "🛑", "⏱️", "❓", "🌙", "🌅", "😴",
  "✅", "📋", "🛡️", "⚡", "🔥", "💎", "🏆", "⭐", "💡", "🔒", "📈",
  "🧠", "❤️", "🚀", "⚠️", "🔔", "📌", "✨", "💪", "🎲", "📝",
];

interface ChecklistEditorProps {
  items: ChecklistItem[];
  onSave: (items: ChecklistItem[]) => void;
  onReset: () => void;
  isCustomized: boolean;
  title: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ChecklistEditor({ items, onSave, onReset, isCustomized, title, open, onOpenChange }: ChecklistEditorProps) {
  const [editItems, setEditItems] = useState<ChecklistItem[]>([]);
  const [emojiPickerIdx, setEmojiPickerIdx] = useState<number | null>(null);

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) {
      setEditItems(items.map(i => ({ ...i })));
      setEmojiPickerIdx(null);
    }
    onOpenChange(isOpen);
  };

  const updateItem = (idx: number, field: keyof ChecklistItem, value: string) => {
    const updated = [...editItems];
    updated[idx] = { ...updated[idx], [field]: value };
    setEditItems(updated);
  };

  const removeItem = (idx: number) => {
    setEditItems(editItems.filter((_, i) => i !== idx));
  };

  const addItem = () => {
    setEditItems([...editItems, { key: `custom_${Date.now()}`, emoji: "📝", label: "" }]);
  };

  const moveItem = (idx: number, dir: -1 | 1) => {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= editItems.length) return;
    const updated = [...editItems];
    [updated[idx], updated[newIdx]] = [updated[newIdx], updated[idx]];
    setEditItems(updated);
  };

  const handleSave = () => {
    const valid = editItems.filter(i => i.label.trim());
    onSave(valid);
    onOpenChange(false);
  };

  const handleReset = () => {
    onReset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="w-4 h-4 text-primary" />
            Editar {title}
          </DialogTitle>
          <DialogDescription>Adicione, remova ou edite os itens. Clique no emoji para trocar.</DialogDescription>
        </DialogHeader>

        <div className="space-y-2 mt-2">
          {editItems.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2 p-2 rounded-lg border border-border bg-card group">
              {/* Reorder buttons */}
              <div className="flex flex-col gap-0.5">
                <button
                  type="button"
                  onClick={() => moveItem(idx, -1)}
                  disabled={idx === 0}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-20 text-xs"
                >▲</button>
                <button
                  type="button"
                  onClick={() => moveItem(idx, 1)}
                  disabled={idx === editItems.length - 1}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-20 text-xs"
                >▼</button>
              </div>

              {/* Emoji picker */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setEmojiPickerIdx(emojiPickerIdx === idx ? null : idx)}
                  className="text-xl hover:bg-muted rounded p-1 transition-colors"
                  title="Trocar emoji"
                >
                  {item.emoji}
                </button>
                {emojiPickerIdx === idx && (
                  <div className="absolute top-full left-0 z-50 mt-1 p-2 bg-popover border border-border rounded-lg shadow-lg grid grid-cols-8 gap-1 w-64">
                    {EMOJI_OPTIONS.map(e => (
                      <button
                        key={e}
                        type="button"
                        onClick={() => { updateItem(idx, "emoji", e); setEmojiPickerIdx(null); }}
                        className="text-lg hover:bg-muted rounded p-1 transition-colors"
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Label */}
              <Input
                value={item.label}
                onChange={e => updateItem(idx, "label", e.target.value)}
                placeholder="Descrição do item..."
                className="flex-1 text-sm h-9"
              />

              {/* Delete */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeItem(idx)}
                className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}
        </div>

        <Button type="button" variant="outline" onClick={addItem} className="w-full mt-2 gap-2">
          <Plus className="w-4 h-4" />
          Adicionar Item
        </Button>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
          {isCustomized && (
            <Button type="button" variant="ghost" size="sm" onClick={handleReset} className="gap-1.5 text-muted-foreground">
              <RotateCcw className="w-3.5 h-3.5" />
              Restaurar Padrão
            </Button>
          )}
          <div className="flex gap-2 ml-auto">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="button" onClick={handleSave} className="gap-1.5">
              <Save className="w-3.5 h-3.5" />
              Salvar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
