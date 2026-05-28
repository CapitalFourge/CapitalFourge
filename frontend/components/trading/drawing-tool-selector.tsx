'use client';

import { useState } from "react";
import { Check } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

import { DRAWING_TOOL_CATALOG, DRAWING_TOOL_SECTIONS, DrawingTool } from "@/lib/chart-drawing-catalog";

interface DrawingToolSelectorProps {
  selectedTools: DrawingTool[];
  onChange: (tools: DrawingTool[]) => void;
  onToolSelect?: (toolId: DrawingTool) => void;
}

export function DrawingToolSelector({ selectedTools, onChange, onToolSelect }: DrawingToolSelectorProps) {
  const [showExamplesFor, setShowExamplesFor] = useState<DrawingTool | null>(null);

  const toggleTool = (toolId: DrawingTool) => {
    if (selectedTools.includes(toolId)) {
      onChange(selectedTools.filter((id) => id !== toolId));
      return;
    }
    onChange([...selectedTools, toolId]);
    onToolSelect?.(toolId);
  };

  const tool = showExamplesFor ? DRAWING_TOOL_CATALOG.find(t => t.id === showExamplesFor) : null;

  return (
    <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/45 p-4">
      <div className="mb-4">
        <p className="text-sm text-slate-400">
          Selecciona las figuras para dibujar en el gráfico. Ayudan a identificar patrones y niveles.
        </p>
      </div>

      <div className="space-y-6">
        {DRAWING_TOOL_SECTIONS.map((section) => {
          const items = DRAWING_TOOL_CATALOG.filter((t) => t.section === section);

          return (
            <section key={section}>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">{section}</h3>
                <span className="text-xs text-slate-500">{items.length} disponibles</span>
              </div>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {items.map((t) => {
                  const active = selectedTools.includes(t.id);

                  return (
                    <Card key={t.id} className="border-white/10 bg-white/[0.02]">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center justify-between">
                          {t.label}
                          {active && (
                            <Badge className="bg-emerald-300 text-slate-950">
                              <Check className="h-3 w-3" />
                              Activo
                            </Badge>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-slate-300">{t.description}</p>
                        <div className="mt-2 flex gap-2">
                          <Button
                            variant={active ? "outline" : "secondary"}
                            onClick={() => toggleTool(t.id)}
                            className="text-xs"
                          >
                            {active ? "Quitar" : "Seleccionar"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowExamplesFor(t.id)}
                            className="text-xs text-slate-400 hover:text-white"
                          >
                            Ejemplos
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      <Dialog open={!!showExamplesFor} onOpenChange={() => setShowExamplesFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {tool?.label} - Ejemplos de uso
            </DialogTitle>
            <DialogDescription className="whitespace-pre-line">
              {tool?.examples}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}