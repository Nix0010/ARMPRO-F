import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dumbbell, TrendingUp, Trophy, Flame, Zap, Play,
  Target, Calendar, ArrowRight, Crown, Timer,
} from "lucide-react";
import type { AppUser } from "@/lib/types";

type Props = {
  setLocation: (path: string) => void;
  user: AppUser | null;
};

export default function AthleteDashboard({ setLocation, user }: Props) {
  const { data: stats, isLoading } = trpc.progress.stats.useQuery(undefined, { enabled: !!user });
  const { data: workoutHistory }   = trpc.workout.history.useQuery({ limit: 5 }, { enabled: !!user });
  const { data: achievements }     = trpc.gamification.userAchievements.useQuery(undefined, { enabled: !!user });

  const xpForLevel  = (stats?.xp || 0) % 500;
  const xpProgress  = (xpForLevel / 500) * 100;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero banner */}
      <div className="glass-card p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-gold/10" />
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">
                Bienvenido, <span className="gradient-text">{user?.name || "Atleta"}</span>
              </h1>
              <p className="text-muted-foreground mt-1">
                {stats?.streak ? `Racha de ${stats.streak} dias. ` : ""}
                Nivel {stats?.level || 1} · {stats?.xp || 0} XP
              </p>
            </div>
            <Button onClick={() => setLocation("/workout")} size="lg" className="glow-red gap-2">
              <Play className="h-5 w-5" /> Iniciar Entrenamiento
            </Button>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-1.5">
              <span className="text-muted-foreground">
                Progreso al nivel {(stats?.level || 1) + 1}
              </span>
              <span className="text-gold font-medium">{xpForLevel}/500 XP</span>
            </div>
            <Progress value={xpProgress} className="h-2 bg-secondary [&>div]:xp-bar" />
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Dumbbell,   label: "Entrenamientos", value: stats?.totalWorkouts || 0,                                  color: "text-primary" },
          { icon: Flame,      label: "Racha",          value: stats?.streak || 0,                                         color: "text-gold" },
          { icon: TrendingUp, label: "Volumen",        value: stats?.totalVolume ? `${(stats.totalVolume / 1000).toFixed(1)}t` : "0", color: "text-chart-3" },
          { icon: Trophy,     label: "Logros",         value: achievements?.length || 0,                                  color: "text-chart-4" },
        ].map(stat => (
          <Card key={stat.label} className="stat-card bg-card border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick actions + recent workouts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-card border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5 text-gold" /> Acciones rapidas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { icon: Play,    label: "Entrenar ahora",        path: "/workout",      color: "text-primary" },
              { icon: Target,  label: "Crear rutina con IA",   path: "/routines",     color: "text-gold" },
              { icon: Dumbbell,label: "Explorar ejercicios",   path: "/exercises",    color: "text-chart-3" },
              { icon: Calendar,label: "Planificar semana",     path: "/calendar",     color: "text-chart-5" },
              { icon: Crown,   label: "Ver leaderboard",       path: "/achievements", color: "text-chart-4" },
            ].map(action => (
              <button
                key={action.path + action.label}
                onClick={() => setLocation(action.path)}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-secondary transition-colors text-left"
              >
                <action.icon className={`h-4 w-4 ${action.color}`} />
                <span className="text-sm font-medium flex-1">{action.label}</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </button>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 bg-card border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Timer className="h-5 w-5 text-primary" /> Entrenamientos recientes
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setLocation("/progress")} className="text-primary">
                Ver todo <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {workoutHistory && workoutHistory.length > 0 ? (
              <div className="space-y-3">
                {workoutHistory.map((workout) => (
                  <div key={workout.id} className="flex items-center gap-4 p-3 rounded-lg bg-secondary/50">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Dumbbell className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">Entrenamiento #{workout.id}</p>
                      <p className="text-xs text-muted-foreground">
                        {workout.completedAt
                          ? new Date(workout.completedAt).toLocaleDateString("es")
                          : "—"} · {Math.round((workout.duration || 0) / 60)} min
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <Badge variant="outline" className="border-gold/30 text-gold text-xs">
                        +{workout.xpEarned || 0} XP
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Dumbbell className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm">Aun no tienes entrenamientos completados</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => setLocation("/workout")}>
                  Comenzar ahora
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
