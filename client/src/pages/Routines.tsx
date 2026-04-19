import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { ListChecks, Plus, Sparkles, Trash2, Clock, Dumbbell, Loader2, Play, X } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import ExercisePicker from "@/components/routines/ExercisePicker";

const difficultyColors: Record<string, string> = {
  beginner: "border-green-500/30 text-green-400",
  intermediate: "border-blue-500/30 text-blue-400",
  advanced: "border-purple-500/30 text-purple-400",
  elite: "border-gold/30 text-gold",
};

type RoutineExercise = {
  templateId: number;
  name: string;
  sets: number;
  reps: string;
  restSeconds: number;
};

export default function Routines() {
  const [, setLocation] = useLocation();
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [manualDialogOpen, setManualDialogOpen] = useState(false);
  const [aiGoal, setAiGoal] = useState("");
  const [aiLevel, setAiLevel] = useState<"beginner" | "intermediate" | "advanced" | "elite">("intermediate");
  const [aiDuration, setAiDuration] = useState(45);

  // Manual routine state
  const [routineName, setRoutineName] = useState("");
  const [routineDesc, setRoutineDesc] = useState("");
  const [routineDifficulty, setRoutineDifficulty] = useState<"beginner" | "intermediate" | "advanced" | "elite">("intermediate");
  const [routineDuration, setRoutineDuration] = useState(45);
  const [routineExercises, setRoutineExercises] = useState<RoutineExercise[]>([]);
  const [exercisePickerOpen, setExercisePickerOpen] = useState(false);
  const [exerciseSearch, setExerciseSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  const { data: routines, isLoading } = trpc.routine.list.useQuery();
  const { data: allExercises } = trpc.exercise.list.useQuery({});
  const utils = trpc.useUtils();

  const generateMutation = trpc.routine.generateWithAI.useMutation({
    onSuccess: () => {
      toast.success("Rutina generada con IA exitosamente");
      utils.routine.list.invalidate();
      setAiDialogOpen(false);
      setAiGoal("");
    },
    onError: (err) => toast.error("Error al generar: " + err.message),
  });

  const createMutation = trpc.routine.create.useMutation({
    onSuccess: (data) => {
      toast.success("Rutina creada exitosamente");
      utils.routine.list.invalidate();
      setManualDialogOpen(false);
      resetManualForm();
    },
    onError: (err) => toast.error("Error al crear: " + err.message),
  });

  const deleteMutation = trpc.routine.delete.useMutation({
    onSuccess: () => {
      toast.success("Rutina eliminada");
      utils.routine.list.invalidate();
    },
  });

  const resetManualForm = () => {
    setRoutineName("");
    setRoutineDesc("");
    setRoutineDifficulty("intermediate");
    setRoutineDuration(45);
    setRoutineExercises([]);
  };

  const addExerciseToRoutine = (templateId: number, name: string) => {
    if (routineExercises.some(e => e.templateId === templateId)) {
      toast.warning("Este ejercicio ya esta en la rutina");
      return;
    }
    setRoutineExercises(prev => [...prev, { templateId, name, sets: 3, reps: "10", restSeconds: 60 }]);
    setExercisePickerOpen(false);
    setExerciseSearch("");
  };

  const removeExerciseFromRoutine = (templateId: number) => {
    setRoutineExercises(prev => prev.filter(e => e.templateId !== templateId));
  };

  const updateRoutineExercise = (templateId: number, field: keyof RoutineExercise, value: any) => {
    setRoutineExercises(prev => prev.map(e =>
      e.templateId === templateId ? { ...e, [field]: value } : e
    ));
  };

  const handleCreateManual = () => {
    if (!routineName.trim()) {
      toast.error("El nombre de la rutina es obligatorio");
      return;
    }
    if (routineExercises.length === 0) {
      toast.error("Agrega al menos un ejercicio");
      return;
    }
    createMutation.mutate({
      name: routineName,
      description: routineDesc || undefined,
      difficulty: routineDifficulty,
      duration: routineDuration,
      exercises: routineExercises.map(e => ({
        templateId: e.templateId,
        sets: e.sets,
        reps: e.reps,
        restSeconds: e.restSeconds,
      })),
    });
  };

  const categories = ["armwrestling", "strength", "technique", "conditioning", "mobility"];

  const filteredExercises = allExercises?.filter(ex => {
    const matchSearch   = !exerciseSearch   || ex.name.toLowerCase().includes(exerciseSearch.toLowerCase());
    const matchCategory = !selectedCategory || ex.category === selectedCategory;
    return matchSearch && matchCategory;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Mis Rutinas</h1>
          <p className="text-muted-foreground mt-1">{routines?.length || 0} rutinas creadas</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={manualDialogOpen} onOpenChange={(open) => {
            setManualDialogOpen(open);
            if (!open) resetManualForm();
          }}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2 border-primary/30 text-primary hover:bg-primary/10">
                <Plus className="h-4 w-4" /> Crear manual
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card max-w-2xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5 text-primary" /> Crear Rutina Manual
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <Label>Nombre *</Label>
                  <Input
                    placeholder="Ej: Rutina de Hook Avanzada"
                    value={routineName}
                    onChange={e => setRoutineName(e.target.value)}
                    className="mt-1.5 bg-secondary border-border/50"
                  />
                </div>
                <div>
                  <Label>Descripcion</Label>
                  <Textarea
                    placeholder="Descripcion opcional de la rutina..."
                    value={routineDesc}
                    onChange={e => setRoutineDesc(e.target.value)}
                    className="mt-1.5 bg-secondary border-border/50 min-h-[80px]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Dificultad</Label>
                    <Select value={routineDifficulty} onValueChange={(v: any) => setRoutineDifficulty(v)}>
                      <SelectTrigger className="mt-1.5 bg-secondary border-border/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Principiante</SelectItem>
                        <SelectItem value="intermediate">Intermedio</SelectItem>
                        <SelectItem value="advanced">Avanzado</SelectItem>
                        <SelectItem value="elite">Elite</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Duracion (min)</Label>
                    <Input
                      type="number"
                      value={routineDuration}
                      onChange={e => setRoutineDuration(Number(e.target.value))}
                      className="mt-1.5 bg-secondary border-border/50"
                    />
                  </div>
                </div>

                {/* Exercise list */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Ejercicios ({routineExercises.length})</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setExercisePickerOpen(!exercisePickerOpen)}
                      className="gap-1"
                    >
                      <Plus className="h-3 w-3" /> Agregar ejercicio
                    </Button>
                  </div>

                  {exercisePickerOpen && (
                    <ExercisePicker
                      exercises={allExercises}
                      onSelect={addExerciseToRoutine}
                    />
                  )}

                  {routineExercises.length === 0 ? (
                    <div className="text-center py-6 text-sm text-muted-foreground bg-secondary/20 rounded-lg">
                      <Dumbbell className="h-6 w-6 mx-auto mb-2 opacity-30" />
                      Agrega ejercicios para crear tu rutina
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {routineExercises.map((ex, idx) => (
                        <div key={ex.templateId} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30">
                          <span className="text-xs text-muted-foreground w-6 font-medium">{idx + 1}</span>
                          <span className="flex-1 text-sm font-medium truncate">{ex.name}</span>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              <Label className="text-[10px]">Sets</Label>
                              <Input
                                type="number"
                                min={1}
                                max={20}
                                value={ex.sets}
                                onChange={e => updateRoutineExercise(ex.templateId, "sets", Number(e.target.value))}
                                className="h-7 w-14 text-xs bg-background border-border/50"
                              />
                            </div>
                            <div className="flex items-center gap-1">
                              <Label className="text-[10px]">Reps</Label>
                              <Input
                                value={ex.reps}
                                onChange={e => updateRoutineExercise(ex.templateId, "reps", e.target.value)}
                                className="h-7 w-14 text-xs bg-background border-border/50"
                              />
                            </div>
                            <div className="flex items-center gap-1">
                              <Label className="text-[10px]">Desc.</Label>
                              <Input
                                type="number"
                                min={0}
                                step={15}
                                value={ex.restSeconds}
                                onChange={e => updateRoutineExercise(ex.templateId, "restSeconds", Number(e.target.value))}
                                className="h-7 w-14 text-xs bg-background border-border/50"
                              />
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 shrink-0 text-destructive hover:text-destructive"
                            onClick={() => removeExerciseFromRoutine(ex.templateId)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Button
                  onClick={handleCreateManual}
                  disabled={!routineName.trim() || routineExercises.length === 0 || createMutation.isPending}
                  className="w-full gap-2"
                >
                  {createMutation.isPending ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Creando...</>
                  ) : (
                    <><Plus className="h-4 w-4" /> Crear Rutina</>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 glow-red">
                <Sparkles className="h-4 w-4" /> Generar con IA
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-gold" /> Constructor de Rutinas con IA
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <Label>Objetivo del entrenamiento</Label>
                  <Textarea
                    placeholder="Ej: Mejorar mi hook para competencia en 2 meses, enfocandome en pronacion y fuerza de muneca..."
                    value={aiGoal}
                    onChange={e => setAiGoal(e.target.value)}
                    className="mt-1.5 bg-secondary border-border/50 min-h-[100px]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Nivel</Label>
                    <Select value={aiLevel} onValueChange={(v: any) => setAiLevel(v)}>
                      <SelectTrigger className="mt-1.5 bg-secondary border-border/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Principiante</SelectItem>
                        <SelectItem value="intermediate">Intermedio</SelectItem>
                        <SelectItem value="advanced">Avanzado</SelectItem>
                        <SelectItem value="elite">Elite</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Duracion (min)</Label>
                    <Input
                      type="number"
                      value={aiDuration}
                      onChange={e => setAiDuration(Number(e.target.value))}
                      className="mt-1.5 bg-secondary border-border/50"
                    />
                  </div>
                </div>
                <Button
                  onClick={() => generateMutation.mutate({ goal: aiGoal, level: aiLevel, duration: aiDuration })}
                  disabled={!aiGoal || generateMutation.isPending}
                  className="w-full gap-2"
                >
                  {generateMutation.isPending ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Generando con IA...</>
                  ) : (
                    <><Sparkles className="h-4 w-4" /> Generar Rutina</>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-40" />)}
        </div>
      ) : routines && routines.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {routines.map((r: any) => (
            <Card key={r.id} className="stat-card bg-card border-border/50 group">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <ListChecks className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold line-clamp-1">{r.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className={difficultyColors[r.difficulty] || ""}>{r.difficulty || "general"}</Badge>
                        {r.aiGenerated && <Badge variant="outline" className="border-gold/30 text-gold text-[10px]">IA</Badge>}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                    onClick={(e) => { e.stopPropagation(); deleteMutation.mutate({ id: r.id }); }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                {r.description && <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{r.description}</p>}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {r.duration || 45} min</span>
                    <span className="flex items-center gap-1"><Dumbbell className="h-3 w-3" /> {r.exerciseCount || 0} ejercicios</span>
                  </div>
                  <Button variant="outline" size="sm" className="gap-1.5 border-primary/30 text-primary hover:bg-primary/10" onClick={() => setLocation(`/workout?routineId=${r.id}`)}>
                    <Play className="h-3 w-3" /> Iniciar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground">
          <ListChecks className="h-16 w-16 mx-auto mb-4 opacity-20" />
          <p className="text-lg font-medium">No tienes rutinas aun</p>
          <p className="text-sm mt-1 mb-4">Crea una rutina personalizada o genera una con IA</p>
          <div className="flex justify-center gap-3">
            <Button variant="outline" onClick={() => setManualDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" /> Crear manual
            </Button>
            <Button onClick={() => setAiDialogOpen(true)} className="gap-2 glow-red">
              <Sparkles className="h-4 w-4" /> Generar con IA
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
