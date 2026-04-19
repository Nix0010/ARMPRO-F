import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Play, Pause, Square, Timer, Dumbbell, Check, Loader2, Save, Plus, Minus } from "lucide-react";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { toast } from "sonner";

type SetData = { reps: number; weight: number; completed: boolean };
type ActiveExercise = {
  id: number;
  exerciseName: string;
  targetSets: number;
  completedSets: number;
  reps: string;
  weight?: number | null;
  isCompleted: boolean;
  orderIndex: number;
  setData?: SetData[] | null;
  restSeconds?: number | null;
};

const REST_OPTIONS = [30, 60, 90, 120, 180];

export default function Workout() {
  const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const initialRoutineId = params?.get("routineId");
  const [selectedRoutineId, setSelectedRoutineId] = useState<number | null>(initialRoutineId ? Number(initialRoutineId) : null);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [restTimer, setRestTimer] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [exerciseDrafts, setExerciseDrafts] = useState<Record<number, {
    completedSets: number;
    weight: string;
    setData: SetData[];
  }>>({});
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const restTimerRef = useRef<NodeJS.Timeout | null>(null);
  const utils = trpc.useUtils();

  const { data: routines } = trpc.routine.list.useQuery();
  const { data: activeWorkout, isLoading: loadingActive } = trpc.workout.getActive.useQuery(undefined, {
    refetchOnWindowFocus: true,
  });
  const { data: selectedRoutine } = trpc.routine.getById.useQuery(
    { id: selectedRoutineId ?? 0 },
    { enabled: selectedRoutineId !== null && !activeWorkout }
  );

  const startMutation = trpc.workout.start.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.workout.getActive.invalidate(),
        utils.workout.history.invalidate(),
      ]);
      toast.success("Entrenamiento iniciado");
    },
    onError: err => toast.error(err.message),
  });

  const updateExerciseMutation = trpc.workout.updateExercise.useMutation({
    onSuccess: () => {
      utils.workout.getActive.invalidate();
    },
    onError: err => toast.error(err.message),
  });

  const completeMutation = trpc.workout.complete.useMutation({
    onSuccess: async data => {
      setElapsed(0);
      setIsPaused(false);
      setRestTimer(0);
      setIsResting(false);
      setExerciseDrafts({});
      await Promise.all([
        utils.workout.getActive.invalidate(),
        utils.workout.history.invalidate(),
        utils.progress.stats.invalidate(),
        utils.progress.get.invalidate(),
        utils.gamification.userAchievements.invalidate(),
        utils.gamification.leaderboard.invalidate(),
      ]);
      const unlockedText = data.unlockedAchievements?.length
        ? ` y ${data.unlockedAchievements.length} logro(s)`
        : "";
      toast.success(`Entrenamiento completado. +${data.xpEarned} XP${unlockedText}`);
    },
    onError: err => toast.error(err.message),
  });

  const activeExercises = useMemo<ActiveExercise[]>(() => {
    return (activeWorkout?.exercises || []).slice()
      .sort((a: any, b: any) => a.orderIndex - b.orderIndex)
      .map((ex: any) => ({
        ...ex,
        // decimal columns come back as string from MySQL/Drizzle — coerce to number
        weight: ex.weight != null ? Number(ex.weight) : null,
      })) as ActiveExercise[];
  }, [activeWorkout]);


  useEffect(() => {
    if (!activeWorkout?.startedAt) {
      setElapsed(0);
      return;
    }
    const startedAt = new Date(activeWorkout.startedAt).getTime();
    setElapsed(Math.max(0, Math.floor((Date.now() - startedAt) / 1000)));
  }, [activeWorkout?.startedAt]);

  useEffect(() => {
    if (!activeWorkout || isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => setElapsed(prev => prev + 1), 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeWorkout, isPaused]);

  useEffect(() => {
    if (!isResting || restTimer <= 0) {
      if (restTimerRef.current) clearInterval(restTimerRef.current);
      return;
    }
    restTimerRef.current = setInterval(() => {
      setRestTimer(prev => {
        if (prev <= 1) {
          setIsResting(false);
          toast.info("Descanso terminado. Siguiente serie.");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (restTimerRef.current) clearInterval(restTimerRef.current);
    };
  }, [isResting, restTimer]);

  useEffect(() => {
    if (!activeExercises.length) {
      setExerciseDrafts({});
      return;
    }
    setExerciseDrafts(current => {
      const next = { ...current };
      for (const exercise of activeExercises) {
        const targetReps = Number((exercise.reps.match(/\d+/) || [10])[0]);
        const existingSets = exercise.setData && Array.isArray(exercise.setData) && exercise.setData.length > 0
          ? exercise.setData
          : Array.from({ length: exercise.targetSets }, (_, i) => ({
              reps: targetReps,
              weight: Number(exercise.weight || 0),
              completed: i < (exercise.completedSets || 0),
            }));
        next[exercise.id] = {
          completedSets: current[exercise.id]?.completedSets ?? exercise.completedSets ?? 0,
          weight: current[exercise.id]?.weight ?? String(exercise.weight ?? ""),
          setData: current[exercise.id]?.setData ?? existingSets,
        };
      }
      return next;
    });
  }, [activeExercises]);

  const formatTime = useCallback((seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }, []);

  const completionRate = activeExercises.length
    ? activeExercises.filter(ex => ex.isCompleted || ex.completedSets >= ex.targetSets).length / activeExercises.length
    : 0;

  const totalVolume = activeExercises.reduce((sum, exercise) => {
    const draft = exerciseDrafts[exercise.id];
    if (!draft?.setData) return sum;
    return sum + draft.setData.reduce((setSum, set) => {
      if (!set.completed) return setSum;
      return setSum + (set.reps * set.weight);
    }, 0);
  }, 0);

  const completedSetsCount = activeExercises.reduce((sum, exercise) => {
    const draft = exerciseDrafts[exercise.id];
    if (!draft?.setData) return sum;
    return sum + draft.setData.filter(s => s.completed).length;
  }, 0);

  const totalSetsCount = activeExercises.reduce((sum, exercise) => sum + exercise.targetSets, 0);

  const selectedRoutineSummary = routines?.find((routine: any) => routine.id === selectedRoutineId);

  const toggleSet = (exerciseId: number, setIndex: number) => {
    setExerciseDrafts(prev => {
      const draft = prev[exerciseId];
      if (!draft) return prev;
      const newSets = [...draft.setData];
      newSets[setIndex] = { ...newSets[setIndex], completed: !newSets[setIndex].completed };
      const completedCount = newSets.filter(s => s.completed).length;
      return {
        ...prev,
        [exerciseId]: {
          ...draft,
          setData: newSets,
          completedSets: completedCount,
        },
      };
    });
  };

  const updateSetField = (exerciseId: number, setIndex: number, field: "reps" | "weight", value: number) => {
    setExerciseDrafts(prev => {
      const draft = prev[exerciseId];
      if (!draft) return prev;
      const newSets = [...draft.setData];
      newSets[setIndex] = { ...newSets[setIndex], [field]: value };
      return { ...prev, [exerciseId]: { ...draft, setData: newSets } };
    });
  };

  const saveExercise = (exercise: ActiveExercise) => {
    const draft = exerciseDrafts[exercise.id];
    if (!draft) return;
    const completedCount = draft.setData.filter(s => s.completed).length;
    updateExerciseMutation.mutate({
      exerciseId: exercise.id,
      completedSets: completedCount,
      weight: draft.weight === "" ? undefined : Number(draft.weight),
      isCompleted: completedCount >= exercise.targetSets,
      setData: draft.setData.map(s => ({ reps: s.reps, weight: s.weight, completed: s.completed })),
    });
  };

  const toggleExercise = (exercise: ActiveExercise) => {
    const draft = exerciseDrafts[exercise.id];
    if (!draft) return;
    const nextCompleted = !(exercise.isCompleted || exercise.completedSets >= exercise.targetSets);
    const newSets = draft.setData.map(s => ({ ...s, completed: nextCompleted }));
    updateExerciseMutation.mutate({
      exerciseId: exercise.id,
      isCompleted: nextCompleted,
      completedSets: nextCompleted ? exercise.targetSets : 0,
      weight: draft.weight === "" ? undefined : Number(draft.weight || exercise.weight || 0),
      setData: newSets.map(s => ({ reps: s.reps, weight: s.weight, completed: s.completed })),
    });
  };

  const startRest = (seconds: number) => {
    setRestTimer(seconds);
    setIsResting(true);
    toast.info(`Descanso de ${seconds}s iniciado`);
  };

  const startWorkout = () => {
    if (!selectedRoutineId) return;
    startMutation.mutate({ routineId: selectedRoutineId });
  };

  if (loadingActive) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Modo Entrenamiento</h1>
          <p className="text-muted-foreground mt-1">Cargando tu sesion actual...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Modo Entrenamiento</h1>
        <p className="text-muted-foreground mt-1">Entrena con seguimiento persistente y progreso real</p>
      </div>

      {!activeWorkout ? (
        <div className="max-w-lg mx-auto space-y-6">
          <Card className="bg-card border-border/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Play className="h-5 w-5 text-primary" /> Iniciar Entrenamiento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Selecciona una rutina</label>
                <Select
                  value={selectedRoutineId?.toString()}
                  onValueChange={value => setSelectedRoutineId(Number(value))}
                >
                  <SelectTrigger className="bg-secondary border-border/50">
                    <SelectValue placeholder="Elige tu rutina..." />
                  </SelectTrigger>
                  <SelectContent>
                    {routines?.map((routine: any) => (
                      <SelectItem key={routine.id} value={routine.id.toString()}>{routine.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {(selectedRoutine || selectedRoutineSummary) && (
                <div className="p-3 rounded-lg bg-secondary/50 space-y-2">
                  <p className="text-sm font-medium">{selectedRoutine?.name || selectedRoutineSummary?.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedRoutine?.description || selectedRoutineSummary?.description || "Rutina lista para comenzar"}
                  </p>
                  <div className="flex gap-3 text-xs text-muted-foreground">
                    <span>{selectedRoutine?.duration || selectedRoutineSummary?.duration || 45} min</span>
                    <span>{selectedRoutine?.exercises?.length || selectedRoutineSummary?.exerciseCount || 0} ejercicios</span>
                  </div>
                </div>
              )}
              <Button
                onClick={startWorkout}
                disabled={!selectedRoutineId || startMutation.isPending}
                className="w-full gap-2 glow-red"
                size="lg"
              >
                {startMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Play className="h-5 w-5" />}
                Comenzar Entrenamiento
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header de sesión */}
          <div className="glass-card p-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-3xl font-display tracking-wider gradient-text">{formatTime(elapsed)}</p>
                  <p className="text-xs text-muted-foreground">Tiempo</p>
                </div>
                <div className="h-10 w-px bg-border" />
                <div className="text-center">
                  <p className="text-xl font-bold">{completedSetsCount}/{totalSetsCount}</p>
                  <p className="text-xs text-muted-foreground">Series</p>
                </div>
                <div className="h-10 w-px bg-border" />
                <div className="text-center">
                  <p className="text-xl font-bold">{Math.round(completionRate * 100)}%</p>
                  <p className="text-xs text-muted-foreground">Completado</p>
                </div>
                <div className="h-10 w-px bg-border" />
                <div className="text-center">
                  <p className="text-xl font-bold">{Math.round(totalVolume)}</p>
                  <p className="text-xs text-muted-foreground">Volumen (kg)</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={() => setIsPaused(prev => !prev)} className="h-10 w-10">
                  {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                </Button>
                <Button
                  variant="destructive"
                  size="icon"
                  className="h-10 w-10"
                  disabled={completeMutation.isPending}
                  onClick={() => completeMutation.mutate({
                    sessionId: activeWorkout.id,
                    duration: elapsed,
                    totalVolume,
                    completionRate,
                  })}
                >
                  {completeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Square className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <Progress value={completionRate * 100} className="mt-3 h-1.5 bg-secondary [&>div]:xp-bar" />
          </div>

          {/* Rest timer */}
          {isResting && (
            <div className="glass-card p-4 border-gold/30 glow-gold">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Timer className="h-5 w-5 text-gold" />
                  <div>
                    <p className="font-medium text-gold">Descanso</p>
                    <p className="text-2xl font-display tracking-wider">{formatTime(restTimer)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => { setRestTimer(prev => Math.max(0, prev + 15)); }}>
                    <Plus className="h-3 w-3 mr-1" />15s
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => { setRestTimer(prev => Math.max(0, prev - 15)); }}>
                    <Minus className="h-3 w-3 mr-1" />15s
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => { setIsResting(false); setRestTimer(0); }}>
                    Saltar
                  </Button>
                </div>
              </div>
              <Progress value={(restTimer / 180) * 100} className="mt-3 h-1 bg-secondary [&>div]:bg-gold" />
            </div>
          )}

          {/* Ejercicios */}
          <div className="space-y-3">
            {activeExercises.map((exercise, index) => {
              const draft = exerciseDrafts[exercise.id] || {
                completedSets: exercise.completedSets || 0,
                weight: String(exercise.weight ?? ""),
                setData: [],
              };
              const isCompleted = exercise.isCompleted || exercise.completedSets >= exercise.targetSets;
              const sets = draft.setData || [];
              const exerciseRest = exercise.restSeconds || 60;

              return (
                <Card key={exercise.id} className={`bg-card border-border/50 transition-all ${isCompleted ? "opacity-70 border-green-500/30" : ""}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <button
                        onClick={() => toggleExercise(exercise)}
                        className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 transition-all ${isCompleted ? "bg-green-500/20 text-green-400" : "bg-primary/10 text-primary"}`}
                      >
                        {isCompleted ? <Check className="h-5 w-5" /> : <span className="font-bold">{index + 1}</span>}
                      </button>
                      <div className="flex-1 min-w-0 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className={`font-medium ${isCompleted ? "line-through" : ""}`}>{exercise.exerciseName}</p>
                            <p className="text-sm text-muted-foreground">
                              Objetivo: {exercise.targetSets} series x {exercise.reps}
                              {exerciseRest && ` · Descanso: ${exerciseRest}s`}
                            </p>
                          </div>
                        </div>

                        {/* Per-set tracking */}
                        <div className="space-y-2">
                          {sets.map((set, setIndex) => (
                            <div
                              key={setIndex}
                              className={`flex items-center gap-2 p-2 rounded-lg transition-all ${
                                set.completed
                                  ? "bg-green-500/10 border border-green-500/20"
                                  : "bg-secondary/30"
                              }`}
                            >
                              <span className="text-xs text-muted-foreground w-10 shrink-0 font-medium">S{setIndex + 1}</span>
                              <button
                                onClick={() => toggleSet(exercise.id, setIndex)}
                                className={`h-6 w-6 rounded flex items-center justify-center shrink-0 transition-all text-xs ${
                                  set.completed
                                    ? "bg-green-500 text-white"
                                    : "border border-border hover:border-primary"
                                }`}
                              >
                                {set.completed && <Check className="h-3 w-3" />}
                              </button>
                              <div className="flex items-center gap-2 flex-1">
                                <div className="flex items-center gap-1">
                                  <label className="text-[10px] text-muted-foreground">Reps</label>
                                  <Input
                                    type="number"
                                    min={0}
                                    value={set.reps}
                                    onChange={e => updateSetField(exercise.id, setIndex, "reps", Number(e.target.value))}
                                    className="h-7 w-16 text-xs bg-background border-border/50"
                                  />
                                </div>
                                <div className="flex items-center gap-1">
                                  <label className="text-[10px] text-muted-foreground">Kg</label>
                                  <Input
                                    type="number"
                                    min={0}
                                    step="0.5"
                                    value={set.weight}
                                    onChange={e => updateSetField(exercise.id, setIndex, "weight", Number(e.target.value))}
                                    className="h-7 w-16 text-xs bg-background border-border/50"
                                  />
                                </div>
                              </div>
                              {set.completed && (
                                <span className="text-[10px] text-green-400 shrink-0">
                                  {set.reps}x{set.weight}kg = {set.reps * set.weight}kg
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1 text-xs"
                          onClick={() => saveExercise(exercise)}
                          disabled={updateExerciseMutation.isPending}
                        >
                          <Save className="h-3 w-3" /> Guardar
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => startRest(exerciseRest)} className="text-xs gap-1">
                          <Timer className="h-3 w-3" /> {exerciseRest}s
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {activeExercises.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Dumbbell className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p>Esta sesion no tiene ejercicios cargados</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
