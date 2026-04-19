import { useAuth } from "@/_core/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Moon, Bell, ShieldCheck, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { AppUser } from "@/lib/types";

export default function Settings() {
  const { user } = useAuth();
  const typedUser = user as AppUser | null;
  const { theme, setTheme, switchable } = useTheme();
  const utils = trpc.useUtils();
  const currentPreferences = useMemo(() => ({
    theme: (typedUser?.preferences?.theme || theme || "dark") as "light" | "dark",
    emailNotifications: typedUser?.preferences?.emailNotifications ?? true,
    workoutReminders:   typedUser?.preferences?.workoutReminders   ?? true,
  }), [theme, user]);

  const [emailNotifications, setEmailNotifications] = useState(currentPreferences.emailNotifications);
  const [workoutReminders, setWorkoutReminders] = useState(currentPreferences.workoutReminders);
  const [selectedTheme, setSelectedTheme] = useState<"light" | "dark">(currentPreferences.theme);

  useEffect(() => {
    setEmailNotifications(currentPreferences.emailNotifications);
    setWorkoutReminders(currentPreferences.workoutReminders);
    setSelectedTheme(currentPreferences.theme);
  }, [currentPreferences]);

  const saveMutation = trpc.auth.updateProfile.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      toast.success("Configuración guardada");
    },
    onError: err => toast.error(err.message),
  });

  const persistSettings = (nextTheme: "light" | "dark", nextEmail: boolean, nextReminders: boolean) => {
    setSelectedTheme(nextTheme);
    if (switchable && setTheme) setTheme(nextTheme);
    saveMutation.mutate({
      preferences: {
        theme: nextTheme,
        emailNotifications: nextEmail,
        workoutReminders: nextReminders,
      },
    });
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Configuración</h1>
        <p className="text-muted-foreground mt-1">Preferencias generales guardadas en tu cuenta</p>
      </div>

      <Card className="bg-card border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Moon className="h-5 w-5 text-primary" /> Apariencia
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg bg-secondary/50 p-4">
            <div>
              <p className="font-medium">Tema oscuro</p>
              <p className="text-sm text-muted-foreground">Sincronizado con tus preferencias de usuario</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline">{selectedTheme}</Badge>
              <Switch
                checked={selectedTheme === "dark"}
                onCheckedChange={checked => persistSettings(checked ? "dark" : "light", emailNotifications, workoutReminders)}
                disabled={!switchable || saveMutation.isPending}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="h-5 w-5 text-gold" /> Notificaciones
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <SettingRow
            title="Emails de actividad"
            description="Recibe alertas sobre eventos y cambios importantes"
            checked={emailNotifications}
            disabled={saveMutation.isPending}
            onCheckedChange={checked => {
              setEmailNotifications(checked);
              persistSettings(selectedTheme, checked, workoutReminders);
            }}
          />
          <SettingRow
            title="Recordatorios de entrenamiento"
            description="Mantén activas las alertas para no perder tu rutina"
            checked={workoutReminders}
            disabled={saveMutation.isPending}
            onCheckedChange={checked => {
              setWorkoutReminders(checked);
              persistSettings(selectedTheme, emailNotifications, checked);
            }}
          />
        </CardContent>
      </Card>

      <Card className="bg-card border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-chart-3" /> Estado del sistema
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>Preferencias persistidas en tu perfil y reutilizadas en la interfaz.</p>
          <p>Las acciones críticas del entrenamiento y calendario siguen protegidas por ownership.</p>
          {saveMutation.isPending && (
            <div className="flex items-center gap-2 text-primary">
              <Loader2 className="h-4 w-4 animate-spin" />
              Guardando cambios...
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          variant="outline"
          onClick={() => persistSettings(selectedTheme, emailNotifications, workoutReminders)}
          disabled={saveMutation.isPending}
        >
          Guardar nuevamente
        </Button>
      </div>
    </div>
  );
}

function SettingRow({
  title,
  description,
  checked,
  disabled,
  onCheckedChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-secondary/50 p-4">
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} disabled={disabled} onCheckedChange={onCheckedChange} />
    </div>
  );
}
