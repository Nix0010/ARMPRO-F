import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { User, Save, Trophy, Dumbbell, Flame, Crown, MapPin, Mail, Shield } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { AppUser } from "@/lib/types";

export default function Profile() {
  const { user } = useAuth();
  const typedUser = user as AppUser | null;
  const utils = trpc.useUtils();
  const { data: stats } = trpc.progress.stats.useQuery();
  const { data: achievements } = trpc.gamification.userAchievements.useQuery();
  const [name, setName]           = useState(user?.name || "");
  const [bio, setBio]             = useState(typedUser?.bio || "");
  const [country, setCountry]     = useState(typedUser?.country || "");
  const [avatarUrl, setAvatarUrl] = useState(typedUser?.avatar || "");
  const updateMut = trpc.auth.updateProfile.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      toast.success("Perfil actualizado");
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSave = () => {
    const data: Record<string, any> = { name, bio };
    if (country) data.country = country;
    if (avatarUrl) data.avatar = avatarUrl;
    updateMut.mutate(data);
  };

  const userRole = typedUser?.appRole || typedUser?.role || "athlete";
  const roleLabels: Record<string, string> = { athlete: "Atleta", coach: "Coach", admin: "Administrador" };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Mi Perfil</h1>
      {/* Profile Card */}
      <Card className="bg-card border-border/50">
        <CardContent className="p-6">
          <div className="flex items-center gap-5 mb-6">
            <Avatar className="h-20 w-20 border-2 border-primary/30">
              <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold truncate">{user?.name || "Atleta"}</h2>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Mail className="h-3 w-3" />
                  <span className="truncate">{user?.email}</span>
                </div>
                {typedUser?.country && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span>{typedUser.country}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge variant="outline" className="border-primary/30 text-primary">
                  <Shield className="h-3 w-3 mr-1" /> {roleLabels[userRole] || "Atleta"}
                </Badge>
                <Badge className="bg-primary/10 text-primary border-primary/30">
                  <Crown className="h-3 w-3 mr-1" /> Nivel {stats?.level || 1}
                </Badge>
                <Badge variant="outline" className="border-gold/30 text-gold">{stats?.xp || 0} XP</Badge>
              </div>
            </div>
          </div>
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1"><span className="text-muted-foreground">Progreso</span><span className="text-gold">{(stats?.xp || 0) % 500}/500 XP</span></div>
            <Progress value={((stats?.xp || 0) % 500) / 5} className="h-2 bg-secondary [&>div]:xp-bar" />
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 rounded-lg bg-secondary/50">
              <Dumbbell className="h-5 w-5 mx-auto mb-1 text-primary" />
              <p className="text-lg font-bold">{stats?.totalWorkouts || 0}</p>
              <p className="text-xs text-muted-foreground">Entrenamientos</p>
            </div>
            <div className="p-3 rounded-lg bg-secondary/50">
              <Flame className="h-5 w-5 mx-auto mb-1 text-gold" />
              <p className="text-lg font-bold">{stats?.streak || 0}</p>
              <p className="text-xs text-muted-foreground">Racha</p>
            </div>
            <div className="p-3 rounded-lg bg-secondary/50">
              <Trophy className="h-5 w-5 mx-auto mb-1 text-chart-4" />
              <p className="text-lg font-bold">{achievements?.length || 0}</p>
              <p className="text-xs text-muted-foreground">Logros</p>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Edit Form */}
      <Card className="bg-card border-border/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="h-5 w-5" /> Editar Perfil
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Nombre</Label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              className="mt-1 bg-secondary border-border/50"
              placeholder="Tu nombre"
            />
          </div>
          <div>
            <Label>URL de Avatar</Label>
            <Input
              value={avatarUrl}
              onChange={e => setAvatarUrl(e.target.value)}
              className="mt-1 bg-secondary border-border/50"
              placeholder="https://ejemplo.com/mi-avatar.jpg"
            />
            <p className="text-xs text-muted-foreground mt-1">Pega el enlace de una imagen para tu avatar</p>
          </div>
          <div>
            <Label>Pais</Label>
            <Input
              value={country}
              onChange={e => setCountry(e.target.value)}
              className="mt-1 bg-secondary border-border/50"
              placeholder="Ej: Colombia"
            />
          </div>
          <div>
            <Label>Bio</Label>
            <Textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="Cuentanos sobre ti, tu experiencia en armwrestling..."
              className="mt-1 bg-secondary border-border/50 min-h-[100px]"
            />
          </div>
          <Button onClick={handleSave} disabled={updateMut.isPending} className="gap-2">
            <Save className="h-4 w-4" /> Guardar cambios
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
