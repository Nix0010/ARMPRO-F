import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, Dumbbell, Flame, Trophy, Target, BarChart3, Calendar } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { useState } from "react";

type TimeRange = "7" | "14" | "30" | "60" | "all";

export default function ProgressPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>("30");
  const { data: stats, isLoading } = trpc.progress.stats.useQuery();
  const { data: history } = trpc.workout.history.useQuery({ limit: 100 });
  const { data: progressData } = trpc.progress.get.useQuery({});

  const filteredHistory = history?.filter((workout: any) => {
    if (timeRange === "all" || !workout.completedAt) return true;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - parseInt(timeRange));
    return new Date(workout.completedAt) >= cutoff;
  });

  const chartData = filteredHistory?.map((workout: any, index: number) => ({
    name: workout.completedAt ? new Date(workout.completedAt).toLocaleDateString("es", { day: "2-digit", month: "short" }) : `#${index + 1}`,
    duration: Math.round((workout.duration || 0) / 60),
    xp: workout.xpEarned || 0,
    volume: workout.totalVolume || 0,
    completion: Math.round((workout.completionRate || 0) * 100),
  })).reverse() || [];

  const timeRangeLabels: Record<TimeRange, string> = {
    "7": "7 dias",
    "14": "14 dias",
    "30": "30 dias",
    "60": "60 dias",
    "all": "Todo",
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Progreso</h1>
          <p className="text-muted-foreground mt-1">Analisis detallado de tu rendimiento</p>
        </div>
        <Select value={timeRange} onValueChange={(v: any) => setTimeRange(v)}>
          <SelectTrigger className="w-32 bg-secondary border-border/50">
            <Calendar className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">7 dias</SelectItem>
            <SelectItem value="14">14 dias</SelectItem>
            <SelectItem value="30">30 dias</SelectItem>
            <SelectItem value="60">60 dias</SelectItem>
            <SelectItem value="all">Todo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Dumbbell, label: "Entrenamientos", value: stats?.totalWorkouts || 0, color: "text-primary", bg: "bg-primary/10" },
          { icon: Flame, label: "Racha actual", value: `${stats?.streak || 0} dias`, color: "text-gold", bg: "bg-gold/10" },
          { icon: Target, label: "Mejor racha", value: `${stats?.longestStreak || 0} dias`, color: "text-chart-3", bg: "bg-chart-3/10" },
          { icon: Trophy, label: "Nivel", value: stats?.level || 1, color: "text-chart-4", bg: "bg-chart-4/10" },
        ].map(stat => (
          <Card key={stat.label} className="stat-card bg-card border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-lg ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Mostrando {chartData.length} sesion{chartData.length !== 1 ? "es" : ""} ({timeRangeLabels[timeRange]})
        </p>
      </div>

      <Tabs defaultValue="duration" className="space-y-4">
        <TabsList className="bg-secondary">
          <TabsTrigger value="duration">Duracion</TabsTrigger>
          <TabsTrigger value="xp">XP ganada</TabsTrigger>
          <TabsTrigger value="completion">Completado</TabsTrigger>
        </TabsList>

        <TabsContent value="duration">
          <Card className="bg-card border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" /> Duracion por sesion (min)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="gradDuration" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="oklch(0.55 0.22 25)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="oklch(0.55 0.22 25)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 5%)" />
                    <XAxis dataKey="name" stroke="oklch(0.6 0 0)" fontSize={12} />
                    <YAxis stroke="oklch(0.6 0 0)" fontSize={12} />
                    <Tooltip contentStyle={{ background: "oklch(0.17 0.008 260)", border: "1px solid oklch(1 0 0 / 10%)", borderRadius: "8px", color: "oklch(0.93 0 0)" }} />
                    <Area type="monotone" dataKey="duration" stroke="oklch(0.55 0.22 25)" fill="url(#gradDuration)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  <p>No hay datos para este rango de fechas</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="xp">
          <Card className="bg-card border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-gold" /> XP ganada por sesion
              </CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 5%)" />
                    <XAxis dataKey="name" stroke="oklch(0.6 0 0)" fontSize={12} />
                    <YAxis stroke="oklch(0.6 0 0)" fontSize={12} />
                    <Tooltip contentStyle={{ background: "oklch(0.17 0.008 260)", border: "1px solid oklch(1 0 0 / 10%)", borderRadius: "8px", color: "oklch(0.93 0 0)" }} />
                    <Bar dataKey="xp" fill="oklch(0.78 0.15 75)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  <p>No hay datos para este rango de fechas</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completion">
          <Card className="bg-card border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4 text-chart-3" /> Tasa de completado (%)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="gradCompletion" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="oklch(0.65 0.15 160)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="oklch(0.65 0.15 160)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 5%)" />
                    <XAxis dataKey="name" stroke="oklch(0.6 0 0)" fontSize={12} />
                    <YAxis stroke="oklch(0.6 0 0)" fontSize={12} domain={[0, 100]} />
                    <Tooltip contentStyle={{ background: "oklch(0.17 0.008 260)", border: "1px solid oklch(1 0 0 / 10%)", borderRadius: "8px", color: "oklch(0.93 0 0)" }} />
                    <Area type="monotone" dataKey="completion" stroke="oklch(0.65 0.15 160)" fill="url(#gradCompletion)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  <p>No hay datos para este rango de fechas</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {progressData && progressData.length > 0 && (
        <Card className="bg-card border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" /> Registros recientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {progressData.slice(0, 10).map((progress: any) => (
                <div key={progress.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                  <div>
                    <p className="text-sm font-medium">{progress.metric}</p>
                    <p className="text-xs text-muted-foreground">{new Date(progress.createdAt).toLocaleDateString("es")}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{progress.value} {progress.unit || ""}</p>
                    {progress.previousValue && (
                      <Badge variant="outline" className={progress.value > progress.previousValue ? "border-green-500/30 text-green-400" : "border-red-500/30 text-red-400"}>
                        {progress.value > progress.previousValue ? "+" : ""}{(progress.value - progress.previousValue).toFixed(1)}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
