import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Users, Dumbbell, Target, Shield, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { AppUser } from "@/lib/types";

export default function AdminDashboard() {
  const { data: users,       isLoading: loadingUsers } = trpc.admin.users.useQuery();
  const { data: systemStats, isLoading: loadingStats } = trpc.admin.systemStats.useQuery();
  const utils = trpc.useUtils();

  const updateRoleMutation = trpc.admin.updateUserRole.useMutation({
    onSuccess: () => {
      utils.admin.users.invalidate();
      toast.success("Rol actualizado correctamente");
    },
    onError: err => toast.error(err.message),
  });

  if (loadingUsers || loadingStats) {
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
        <h1 className="text-2xl md:text-3xl font-bold">Panel de Administracion</h1>
        <p className="text-muted-foreground mt-1">
          Controla usuarios, metricas globales y salud general de la plataforma.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Users,    label: "Usuarios",   value: systemStats?.totalUsers     || 0 },
          { icon: Dumbbell, label: "Workouts",   value: systemStats?.totalWorkouts  || 0 },
          { icon: Target,   label: "Ejercicios", value: systemStats?.totalExercises || 0 },
          { icon: Shield,   label: "Rutinas",    value: systemStats?.totalRoutines  || 0 },
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

      <Card className="bg-card border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" /> Gestion de usuarios
          </CardTitle>
        </CardHeader>
        <CardContent>
          {users?.length ? (
            <div className="space-y-3">
              {users.map((account: AppUser) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-lg bg-secondary/50"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm">{account.name || "Sin nombre"}</p>
                      <Badge variant="outline">{account.subscriptionTier || "free"}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{account.email || "Sin email"}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Select
                      value={account.appRole || "athlete"}
                      onValueChange={(value) => {
                        updateRoleMutation.mutate({
                          userId: account.id,
                          appRole: value as "athlete" | "coach" | "admin",
                        });
                      }}
                      disabled={updateRoleMutation.isPending}
                    >
                      <SelectTrigger className="w-28 h-8 text-xs bg-background border-border/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="athlete">Atleta</SelectItem>
                        <SelectItem value="coach">Coach</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    {updateRoleMutation.isPending && (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No hay usuarios para mostrar.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
