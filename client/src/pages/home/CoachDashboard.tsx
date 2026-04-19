import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Activity, Dumbbell, Crown, Timer, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";

export default function CoachDashboard() {
  const [, setLocation] = useLocation();
  const { data, isLoading } = trpc.coach.dashboard.useQuery();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="glass-card p-6">
        <h1 className="text-2xl md:text-3xl font-bold">Panel del Coach</h1>
        <p className="text-muted-foreground mt-1">
          Supervisa atletas, actividad reciente y progreso general del grupo.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Users,    label: "Atletas",            value: data?.athleteCount    || 0 },
          { icon: Activity, label: "Activos esta semana", value: data?.activeThisWeek  || 0 },
          { icon: Dumbbell, label: "Entrenamientos",      value: data?.totalWorkouts   || 0 },
          { icon: Crown,    label: "Nivel promedio",      value: data?.averageLevel    || 0 },
        ].map(stat => (
          <Card key={stat.label} className="bg-card border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <stat.icon className="h-5 w-5 text-primary" />
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

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2 bg-card border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Timer className="h-5 w-5 text-primary" /> Actividad reciente
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data?.recentSessions?.length ? (
              <div className="space-y-3">
                {data.recentSessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                    <div>
                      <p className="font-medium text-sm">{(session as { athleteName?: string }).athleteName || "Atleta"}</p>
                      <p className="text-xs text-muted-foreground">
                        {session.completedAt
                          ? new Date(session.completedAt).toLocaleString("es")
                          : "Sin completar"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{Math.round((session.duration || 0) / 60)} min</p>
                      <p className="text-xs text-muted-foreground">
                        {Math.round(Number(session.completionRate || 0) * 100)}% completado
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Todavia no hay sesiones recientes de atletas asignados.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Atletas asignados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data?.athletes?.length
              ? data.athletes.map((athlete) => (
                <div key={athlete.id} className="p-3 rounded-lg bg-secondary/50">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-sm">{athlete.name || "Sin nombre"}</p>
                      <p className="text-xs text-muted-foreground">{athlete.email || "Sin email"}</p>
                    </div>
                    <Badge variant="outline">Lv. {athlete.level || 1}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
                    <span>{athlete.totalWorkouts || 0} entrenamientos</span>
                    <span>{athlete.streak || 0} dias</span>
                  </div>
                </div>
              ))
              : <p className="text-sm text-muted-foreground">No tienes atletas asignados todavia.</p>
            }
            <Button variant="outline" className="w-full" onClick={() => setLocation("/profile")}>
              <ArrowRight className="h-4 w-4 mr-2" /> Ver perfil del coach
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
