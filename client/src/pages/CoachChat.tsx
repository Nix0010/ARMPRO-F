import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User, Loader2, Trash2, Sparkles } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Streamdown } from "streamdown";
import { toast } from "sonner";

const SUGGESTED_PROMPTS = [
  "Cual es la mejor rutina para mejorar mi hook?",
  "Como prevenir lesiones en el codo?",
  "Que ejercicios de fortalecimiento me recomiendas?",
  "Como prepararme para mi primera competencia?",
  "Cual es la diferencia entre toproll y hook?",
  "Consejos para mejorar mi agarre?",
];

export default function CoachChat() {
  const [msg, setMsg] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { data: history, isLoading } = trpc.aiCoach.history.useQuery();
  const utils = trpc.useUtils();
  const chatMut = trpc.aiCoach.chat.useMutation({
    onSuccess: () => {
      utils.aiCoach.history.invalidate();
      setMsg("");
      inputRef.current?.focus();
    },
    onError: err => toast.error(err.message),
  });
  const clearMut = trpc.aiCoach.clearHistory.useMutation({
    onSuccess: () => {
      utils.aiCoach.history.invalidate();
      toast.success("Historial borrado");
    },
    onError: err => toast.error(err.message),
  });

  const isEmpty = !history || history.length === 0;

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, chatMut.isPending]);

  const send = (text?: string) => {
    const message = (text || msg).trim();
    if (!message || chatMut.isPending) return;
    chatMut.mutate({ message });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">AI Coach</h1>
          <p className="text-muted-foreground text-sm">Tu entrenador personal de armwrestling con IA</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => clearMut.mutate()} disabled={clearMut.isPending} className="gap-2">
          <Trash2 className="h-3.5 w-3.5" /> Limpiar
        </Button>
      </div>
      <Card className="flex-1 bg-card border-border/50 flex flex-col overflow-hidden">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {isEmpty && !isLoading && (
              <div className="text-center py-8 text-muted-foreground">
                <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Bot className="h-8 w-8 text-primary" />
                </div>
                <p className="font-medium text-foreground">Hola, soy tu AI Coach</p>
                <p className="text-sm mt-1 mb-6">Preguntame sobre tecnicas, rutinas, prevencion de lesiones o cualquier cosa sobre armwrestling.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg mx-auto">
                  {SUGGESTED_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => send(prompt)}
                      className="flex items-center gap-2 p-3 rounded-lg bg-secondary/50 hover:bg-secondary border border-border/30 transition-colors text-left text-sm"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-gold shrink-0" />
                      <span className="line-clamp-2">{prompt}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {history?.map((message: any, index: number) => (
              <div key={index} className={`flex gap-3 ${message.role === "user" ? "justify-end" : ""}`}>
                {message.role === "assistant" && (
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div className={`max-w-[80%] rounded-xl p-3 text-sm ${message.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>
                  {message.role === "assistant" ? <Streamdown>{message.content}</Streamdown> : message.content}
                </div>
                {message.role === "user" && (
                  <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center shrink-0 mt-1">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}
            {chatMut.isPending && (
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="bg-secondary rounded-xl p-3 flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">Pensando...</span>
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>
        <CardContent className="p-3 border-t border-border/50">
          <form onSubmit={event => { event.preventDefault(); send(); }} className="flex gap-2">
            <Input
              ref={inputRef}
              value={msg}
              onChange={event => setMsg(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe tu mensaje..."
              className="bg-secondary border-border/50"
              disabled={chatMut.isPending}
            />
            <Button
              type="submit"
              size="icon"
              disabled={!msg.trim() || chatMut.isPending}
              className="shrink-0 glow-red"
            >
              {chatMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
