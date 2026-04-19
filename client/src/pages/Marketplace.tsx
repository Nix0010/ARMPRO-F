import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ShoppingBag, Search, Star, Users, Clock, Filter } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

const diffColors: Record<string, string> = {
  beginner: "border-green-500/30 text-green-400",
  intermediate: "border-blue-500/30 text-blue-400",
  advanced: "border-purple-500/30 text-purple-400",
  elite: "border-gold/30 text-gold",
};

export default function Marketplace() {
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("all");
  const [selectedProgramId, setSelectedProgramId] = useState<number | null>(null);
  const { data: programs, isLoading } = trpc.marketplace.programs.useQuery({ search, difficulty });
  const { data: purchases } = trpc.marketplace.myPurchases.useQuery();
  const { data: selectedProgram } = trpc.marketplace.getProgram.useQuery(
    { id: selectedProgramId ?? 0 },
    { enabled: selectedProgramId !== null }
  );
  const utils = trpc.useUtils();
  const ownedProgramIds = useMemo(() => new Set((purchases || []).map((purchase: any) => purchase.programId)), [purchases]);
  const purchaseMutation = trpc.marketplace.purchase.useMutation({
    onSuccess: async result => {
      await Promise.all([
        utils.marketplace.myPurchases.invalidate(),
        utils.marketplace.programs.invalidate(),
        selectedProgramId ? utils.marketplace.getProgram.invalidate({ id: selectedProgramId }) : Promise.resolve(),
      ]);
      toast.success(result.isFree ? "Programa añadido a tu biblioteca" : `Compra simulada completada por $${result.amount}`);
    },
    onError: err => toast.error(err.message),
  });
  const acquireMutation = trpc.marketplace.acquireFree.useMutation({
    onSuccess: async result => {
      await Promise.all([
        utils.marketplace.myPurchases.invalidate(),
        utils.marketplace.programs.invalidate(),
        selectedProgramId ? utils.marketplace.getProgram.invalidate({ id: selectedProgramId }) : Promise.resolve(),
      ]);
      toast.success(result.status === "already_owned" ? "Ya tienes este programa" : "Programa añadido a tu biblioteca");
    },
    onError: err => toast.error(err.message),
  });

  const handleAcquire = (program: any) => {
    if ((program.price || 0) > 0) {
      purchaseMutation.mutate({ programId: program.id });
      return;
    }
    acquireMutation.mutate({ programId: program.id });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Marketplace</h1>
        <p className="text-muted-foreground text-sm">Programas de entrenamiento profesionales</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar programas..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-secondary border-border/50" />
        </div>
        <Select value={difficulty} onValueChange={setDifficulty}>
          <SelectTrigger className="w-full sm:w-48 bg-secondary border-border/50">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los niveles</SelectItem>
            <SelectItem value="beginner">Principiante</SelectItem>
            <SelectItem value="intermediate">Intermedio</SelectItem>
            <SelectItem value="advanced">Avanzado</SelectItem>
            <SelectItem value="elite">Elite</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-56" />)}
        </div>
      ) : programs && programs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {programs.map((program: any) => {
            const isOwned = ownedProgramIds.has(program.id);
            return (
              <Card key={program.id} className="stat-card bg-card border-border/50 overflow-hidden">
                <div className="h-2 xp-bar" />
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <Badge variant="outline" className={diffColors[program.difficulty] || ""}>{program.difficulty}</Badge>
                    <span className="text-lg font-bold">{Number(program.price) > 0 ? `$${program.price}` : <span className="text-green-400">Gratis</span>}</span>
                  </div>
                  <h3 className="font-semibold text-lg mb-1">{program.name}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{program.description}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                    <span className="flex items-center gap-1"><Star className="h-3 w-3 text-gold" /> {program.rating?.toFixed(1) || "N/A"}</span>
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {program.purchaseCount || 0}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {program.durationWeeks || 0} sem</span>
                  </div>
                  <div className="flex gap-2">
                    <Button className="flex-1" variant="outline" onClick={() => setSelectedProgramId(program.id)}>
                      Ver detalle
                    </Button>
                    <Button className="flex-1 gap-2" onClick={() => handleAcquire(program)} disabled={isOwned || acquireMutation.isPending || purchaseMutation.isPending}>
                      <ShoppingBag className="h-4 w-4" />
                      {isOwned ? "Ya lo tienes" : Number(program.price) > 0 ? "Comprar" : "Obtener"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground">
          <ShoppingBag className="h-16 w-16 mx-auto mb-4 opacity-20" />
          <p className="text-lg font-medium">No se encontraron programas</p>
        </div>
      )}

      <Dialog open={selectedProgramId !== null} onOpenChange={open => { if (!open) setSelectedProgramId(null); }}>
        <DialogContent className="bg-card max-w-2xl">
          {selectedProgram && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedProgram.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={diffColors[selectedProgram.difficulty] || ""}>{selectedProgram.difficulty}</Badge>
                  <Badge variant="outline">{selectedProgram.durationWeeks} semanas</Badge>
                  {ownedProgramIds.has(selectedProgram.id) && <Badge variant="outline" className="border-green-500/30 text-green-400">En tu biblioteca</Badge>}
                </div>
                <p className="text-muted-foreground">{selectedProgram.longDescription || selectedProgram.description}</p>
                {Array.isArray(selectedProgram.tags) && selectedProgram.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedProgram.tags.map((tag: string) => (
                      <Badge key={tag} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                )}
                {selectedProgram.reviews?.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-medium">Reviews recientes</h3>
                    {selectedProgram.reviews.map((review: any) => (
                      <div key={review.id} className="rounded-lg bg-secondary/50 p-3">
                        <p className="text-sm font-medium">Rating: {review.rating}/5</p>
                        <p className="text-sm text-muted-foreground">{review.comment || "Sin comentario"}</p>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex justify-end">
                  <Button onClick={() => handleAcquire(selectedProgram)} disabled={ownedProgramIds.has(selectedProgram.id) || acquireMutation.isPending || purchaseMutation.isPending}>
                    {ownedProgramIds.has(selectedProgram.id) ? "Ya lo tienes" : Number(selectedProgram.price) > 0 ? "Comprar" : "Obtener gratis"}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
