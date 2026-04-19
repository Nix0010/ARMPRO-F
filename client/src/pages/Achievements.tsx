import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Trophy, Crown, Medal, Lock, Flame, Zap, Target } from "lucide-react";

const rarityStyles: Record<string, { border: string; bg: string; text: string }> = {
  common: { border: "border-zinc-500/30", bg: "bg-zinc-500/10", text: "rarity-common" },
  rare: { border: "border-blue-500/30", bg: "bg-blue-500/10", text: "rarity-rare" },
  epic: { border: "border-purple-500/30", bg: "bg-purple-500/10", text: "rarity-epic" },
  legendary: { border: "border-gold/30", bg: "bg-gold/10", text: "rarity-legendary" },
};

export default function Achievements() {
  const { data: allAchievements, isLoading: loadingAll } = trpc.gamification.achievements.useQuery();
  const { data: userAchievements, isLoading: loadingUser } = trpc.gamification.userAchievements.useQuery();
  const { data: leaderboard, isLoading: loadingLeaderboard } = trpc.gamification.leaderboard.useQuery({ limit: 20 });
  const { data: stats } = trpc.progress.stats.useQuery();

  const unlockedIds = new Set(userAchievements?.map((achievement: any) => achievement.achievementId) || []);
  const isLoading = loadingAll || loadingUser;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Logros y Clasificación</h1>
        <p className="text-muted-foreground mt-1">
          {userAchievements?.length || 0}/{allAchievements?.length || 0} logros desbloqueados
        </p>
      </div>

      <div className="glass-card p-5">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-xl bg-gold/10 flex items-center justify-center glow-gold">
              <Crown className="h-8 w-8 text-gold" />
            </div>
            <div>
              <p className="text-3xl font-display tracking-wider gradient-text">NIVEL {stats?.level || 1}</p>
              <p className="text-sm text-muted-foreground">{stats?.xp || 0} XP total</p>
            </div>
          </div>
          <div className="flex-1">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">Progreso al siguiente nivel</span>
              <span className="text-gold font-medium">{(stats?.xp || 0) % 500}/500 XP</span>
            </div>
            <Progress value={((stats?.xp || 0) % 500) / 5} className="h-3 bg-secondary [&>div]:xp-bar" />
          </div>
          <div className="flex gap-6 text-center">
            <div>
              <p className="text-xl font-bold">{stats?.streak || 0}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1"><Flame className="h-3 w-3 text-gold" /> Racha</p>
            </div>
            <div>
              <p className="text-xl font-bold">{stats?.longestStreak || 0}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1"><Target className="h-3 w-3 text-primary" /> Mejor</p>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="achievements" className="space-y-4">
        <TabsList className="bg-secondary">
          <TabsTrigger value="achievements" className="gap-1.5"><Trophy className="h-4 w-4" /> Logros</TabsTrigger>
          <TabsTrigger value="leaderboard" className="gap-1.5"><Crown className="h-4 w-4" /> Clasificación</TabsTrigger>
        </TabsList>

        <TabsContent value="achievements">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-32" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allAchievements?.map((achievement: any) => {
                const unlocked = unlockedIds.has(achievement.id);
                const style = rarityStyles[achievement.rarity] || rarityStyles.common;
                return (
                  <Card key={achievement.id} className={`stat-card bg-card ${style.border} ${!unlocked ? "opacity-50" : ""} transition-all`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`h-12 w-12 rounded-xl ${style.bg} flex items-center justify-center text-2xl shrink-0 relative`}>
                          {achievement.icon || "🏆"}
                          {!unlocked && (
                            <div className="absolute inset-0 bg-background/60 rounded-xl flex items-center justify-center">
                              <Lock className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-sm truncate">{achievement.name}</h3>
                            <Badge variant="outline" className={`text-[10px] px-1 py-0 ${style.border} ${style.text}`}>
                              {achievement.rarity}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{achievement.description}</p>
                          <div className="flex items-center gap-1 mt-2">
                            <Zap className="h-3 w-3 text-gold" />
                            <span className="text-xs text-gold font-medium">+{achievement.xpReward} XP</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="leaderboard">
          <Card className="bg-card border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Crown className="h-5 w-5 text-gold" /> Top atletas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingLeaderboard ? (
                <div className="space-y-3">{[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-14" />)}</div>
              ) : leaderboard && leaderboard.length > 0 ? (
                <div className="space-y-2">
                  {leaderboard.map((user: any, index: number) => {
                    const isTop3 = index < 3;
                    const medalColors = ["text-gold", "text-zinc-400", "text-amber-700"];
                    return (
                      <div key={user.id} className={`flex items-center gap-4 p-3 rounded-lg ${isTop3 ? "bg-gold/5 border border-gold/10" : "bg-secondary/50"}`}>
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm ${isTop3 ? medalColors[index] : "text-muted-foreground"}`}>
                          {isTop3 ? <Medal className="h-5 w-5" /> : index + 1}
                        </div>
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">
                            {user.name?.charAt(0)?.toUpperCase() || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{user.name || "Anónimo"}</p>
                          <p className="text-xs text-muted-foreground">Nivel {user.level || 1}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gold">{user.xp || 0} XP</p>
                          <p className="text-xs text-muted-foreground">{user.totalWorkouts || 0} entrenamientos</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Crown className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p>Aún no hay datos en la clasificación</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
