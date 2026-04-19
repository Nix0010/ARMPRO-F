import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Dumbbell, Filter, Star, Users } from "lucide-react";
import { useState } from "react";

const categories = [
  { value: "all", label: "Todas" },
  { value: "armwrestling", label: "Armwrestling" },
  { value: "strength", label: "Fuerza" },
  { value: "technique", label: "Técnica" },
  { value: "conditioning", label: "Acondicionamiento" },
  { value: "mobility", label: "Movilidad" },
];

const difficulties = [
  { value: "all", label: "Todos los niveles" },
  { value: "beginner", label: "Principiante" },
  { value: "intermediate", label: "Intermedio" },
  { value: "advanced", label: "Avanzado" },
  { value: "elite", label: "Elite" },
];

const difficultyColors: Record<string, string> = {
  beginner: "border-green-500/30 text-green-400",
  intermediate: "border-blue-500/30 text-blue-400",
  advanced: "border-purple-500/30 text-purple-400",
  elite: "border-gold/30 text-gold",
};

const categoryIcons: Record<string, string> = {
  armwrestling: "💪",
  strength: "🏋️",
  technique: "🎯",
  conditioning: "🔥",
  mobility: "🧘",
};

export default function Exercises() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [difficulty, setDifficulty] = useState("all");
  const [selectedExercise, setSelectedExercise] = useState<any>(null);

  const { data: exercises, isLoading } = trpc.exercise.list.useQuery({ category, difficulty, search });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Biblioteca de Ejercicios</h1>
        <p className="text-muted-foreground mt-1">
          {exercises?.length || 0} ejercicios especializados en armwrestling
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar ejercicios..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 bg-secondary border-border/50"
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-full sm:w-48 bg-secondary border-border/50">
            <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categories.map(categoryOption => (
              <SelectItem key={categoryOption.value} value={categoryOption.value}>{categoryOption.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={difficulty} onValueChange={setDifficulty}>
          <SelectTrigger className="w-full sm:w-48 bg-secondary border-border/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {difficulties.map(difficultyOption => (
              <SelectItem key={difficultyOption.value} value={difficultyOption.value}>{difficultyOption.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-48" />)}
        </div>
      ) : exercises && exercises.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {exercises.map((exercise: any) => (
            <Card
              key={exercise.id}
              className="stat-card bg-card border-border/50 cursor-pointer hover:border-primary/30"
              onClick={() => setSelectedExercise(exercise)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-lg">
                    {categoryIcons[exercise.category] || "💪"}
                  </div>
                  <Badge variant="outline" className={difficultyColors[exercise.difficulty] || ""}>
                    {exercise.difficulty}
                  </Badge>
                </div>
                <h3 className="font-semibold mb-1 line-clamp-1">{exercise.name}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{exercise.description}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Dumbbell className="h-3 w-3" />
                    {(exercise.muscles as string[])?.length || 0} músculos
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {exercise.usageCount || 0} usos
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground">
          <Dumbbell className="h-16 w-16 mx-auto mb-4 opacity-20" />
          <p className="text-lg font-medium">No se encontraron ejercicios</p>
          <p className="text-sm mt-1">Intenta ajustar los filtros de búsqueda</p>
        </div>
      )}

      <Dialog open={!!selectedExercise} onOpenChange={() => setSelectedExercise(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden bg-card">
          {selectedExercise && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-2xl">
                    {categoryIcons[selectedExercise.category] || "💪"}
                  </div>
                  <div>
                    <DialogTitle className="text-xl">{selectedExercise.name}</DialogTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className={difficultyColors[selectedExercise.difficulty] || ""}>
                        {selectedExercise.difficulty}
                      </Badge>
                      <Badge variant="outline" className="border-border/50">{selectedExercise.category}</Badge>
                    </div>
                  </div>
                </div>
              </DialogHeader>
              <ScrollArea className="max-h-[60vh] pr-4">
                <div className="space-y-5 pb-4">
                  <p className="text-muted-foreground">{selectedExercise.description}</p>

                  {(selectedExercise.muscles as string[])?.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2 text-sm uppercase tracking-wider text-muted-foreground">Músculos</h4>
                      <div className="flex flex-wrap gap-2">
                        {(selectedExercise.muscles as string[]).map((muscle: string) => (
                          <Badge key={muscle} variant="secondary" className="bg-primary/10 text-primary border-0">{muscle}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {(selectedExercise.equipment as string[])?.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2 text-sm uppercase tracking-wider text-muted-foreground">Equipamiento</h4>
                      <div className="flex flex-wrap gap-2">
                        {(selectedExercise.equipment as string[]).map((equipment: string) => (
                          <Badge key={equipment} variant="outline" className="border-border/50">{equipment}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {(selectedExercise.instructions as string[])?.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2 text-sm uppercase tracking-wider text-muted-foreground">Instrucciones</h4>
                      <ol className="space-y-2">
                        {(selectedExercise.instructions as string[]).map((instruction: string, index: number) => (
                          <li key={index} className="flex gap-3 text-sm">
                            <span className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 text-xs font-bold">{index + 1}</span>
                            <span className="pt-0.5">{instruction}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {(selectedExercise.tips as string[])?.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2 text-sm uppercase tracking-wider text-muted-foreground">Tips</h4>
                      <ul className="space-y-1">
                        {(selectedExercise.tips as string[]).map((tip: string, index: number) => (
                          <li key={index} className="flex gap-2 text-sm text-gold">
                            <Star className="h-4 w-4 shrink-0 mt-0.5" />
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {(selectedExercise.commonMistakes as string[])?.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2 text-sm uppercase tracking-wider text-destructive">Errores comunes</h4>
                      <ul className="space-y-1">
                        {(selectedExercise.commonMistakes as string[]).map((mistake: string, index: number) => (
                          <li key={index} className="flex gap-2 text-sm text-destructive/80">
                            <span className="shrink-0">⚠️</span>
                            <span>{mistake}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
