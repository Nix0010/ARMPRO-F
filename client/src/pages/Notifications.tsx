import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCheck, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function Notifications() {
  const utils = trpc.useUtils();
  const { data: notifications, isLoading } = trpc.notification.list.useQuery();
  const markReadMutation = trpc.notification.markRead.useMutation({
    onSuccess: () => {
      utils.notification.list.invalidate();
    },
    onError: err => toast.error(err.message),
  });
  const markAllReadMutation = trpc.notification.markAllRead.useMutation({
    onSuccess: () => {
      utils.notification.list.invalidate();
      toast.success("Todas las notificaciones marcadas como leidas");
    },
    onError: err => toast.error(err.message),
  });

  const unreadCount = notifications?.filter((n: any) => !n.isRead).length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notificaciones</h1>
          <p className="text-muted-foreground mt-1">Mantente al dia con tu actividad y recordatorios</p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
            className="gap-2"
          >
            <CheckCircle2 className="h-4 w-4" />
            Marcar todas como leidas
            {unreadCount > 0 && (
              <Badge variant="secondary" className="ml-1">{unreadCount}</Badge>
            )}
          </Button>
        )}
      </div>

      <Card className="bg-card border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" /> Centro de notificaciones
            {unreadCount > 0 && (
              <Badge className="bg-primary text-primary-foreground">{unreadCount} nueva{unreadCount !== 1 ? "s" : ""}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-start gap-3 p-4 rounded-lg bg-secondary/30 animate-pulse">
                  <div className="h-2.5 w-2.5 rounded-full bg-muted mt-2" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 bg-muted rounded" />
                    <div className="h-3 w-1/2 bg-muted rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications && notifications.length > 0 ? (
            <div className="space-y-3">
              {notifications.map((notification: any) => (
                <div
                  key={notification.id}
                  className={`flex items-start gap-3 p-4 rounded-lg transition-all ${
                    notification.isRead
                      ? "bg-secondary/30 opacity-70"
                      : "bg-secondary/50 border border-primary/10"
                  }`}
                >
                  <div className={`h-2.5 w-2.5 rounded-full mt-2 shrink-0 ${notification.isRead ? "bg-muted" : "bg-primary animate-pulse"}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm">{notification.title}</p>
                      {!notification.isRead && <Badge variant="outline" className="border-primary/30 text-primary">Nuevo</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(notification.createdAt).toLocaleString("es")}
                    </p>
                  </div>
                  {!notification.isRead && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => markReadMutation.mutate({ id: notification.id })}
                      disabled={markReadMutation.isPending}
                      className="shrink-0"
                    >
                      <CheckCheck className="h-4 w-4 mr-1" /> Leida
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="font-medium">Todo al dia</p>
              <p className="text-sm mt-1">No tienes notificaciones pendientes</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
