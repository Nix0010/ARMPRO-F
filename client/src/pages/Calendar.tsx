import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarDays, Plus, Dumbbell, Trophy, Coffee, ChevronLeft, ChevronRight, Check, Trash2 } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

const typeConfig: Record<string, { icon: any; color: string; bg: string }> = {
  workout: { icon: Dumbbell, color: "text-primary", bg: "bg-primary/10" },
  rest: { icon: Coffee, color: "text-green-400", bg: "bg-green-500/10" },
  competition: { icon: Trophy, color: "text-gold", bg: "bg-gold/10" },
  custom: { icon: CalendarDays, color: "text-chart-5", bg: "bg-chart-5/10" },
};

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState<string>("workout");
  const [newDate, setNewDate] = useState("");
  const [selectedRoutineId, setSelectedRoutineId] = useState<string>("none");

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const startOfMonth = new Date(year, month, 1);
  const endOfMonth = new Date(year, month + 1, 0);

  const { data: events } = trpc.calendar.events.useQuery({
    startDate: startOfMonth.toISOString(),
    endDate: endOfMonth.toISOString(),
  });
  const { data: routines } = trpc.routine.list.useQuery();
  const utils = trpc.useUtils();
  const refreshCalendar = () => Promise.all([
    utils.calendar.events.invalidate(),
    utils.progress.stats.invalidate(),
  ]);

  const createMut = trpc.calendar.create.useMutation({
    onSuccess: async () => {
      await refreshCalendar();
      setDialogOpen(false);
      setNewTitle("");
      setNewDate("");
      setSelectedRoutineId("none");
      toast.success("Evento creado");
    },
    onError: err => toast.error(err.message),
  });
  const toggleMut = trpc.calendar.update.useMutation({
    onSuccess: () => {
      refreshCalendar();
    },
  });
  const deleteMut = trpc.calendar.delete.useMutation({
    onSuccess: () => {
      refreshCalendar();
      toast.success("Evento eliminado");
    },
  });

  const daysInMonth = endOfMonth.getDate();
  const firstDayOfWeek = startOfMonth.getDay();
  const days = useMemo(() => {
    const arr: (number | null)[] = [];
    for (let i = 0; i < firstDayOfWeek; i++) arr.push(null);
    for (let i = 1; i <= daysInMonth; i++) arr.push(i);
    return arr;
  }, [firstDayOfWeek, daysInMonth]);

  const eventsByDay = useMemo(() => {
    const map: Record<number, any[]> = {};
    events?.forEach((event: any) => {
      const day = new Date(event.scheduledAt).getDate();
      if (!map[day]) map[day] = [];
      map[day].push(event);
    });
    return map;
  }, [events]);

  const sortedEvents = useMemo(() => {
    return (events || []).slice().sort((a: any, b: any) => {
      return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
    });
  }, [events]);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const monthName = currentDate.toLocaleDateString("es", { month: "long", year: "numeric" });

  const createEvent = () => {
    if (!newTitle.trim()) return;
    createMut.mutate({
      title: newTitle,
      type: newType as "workout" | "rest" | "competition" | "custom",
      routineId: selectedRoutineId === "none" ? undefined : Number(selectedRoutineId),
      scheduledAt: newDate || new Date().toISOString(),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Calendario</h1>
          <p className="text-muted-foreground text-sm">Planifica, completa y organiza tus entrenamientos</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Nuevo evento</Button>
          </DialogTrigger>
          <DialogContent className="bg-card">
            <DialogHeader><DialogTitle>Nuevo Evento</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <Label>T&iacute;tulo</Label>
                <Input value={newTitle} onChange={e => setNewTitle(e.target.value)} className="mt-1 bg-secondary" />
              </div>
              <div>
                <Label>Tipo</Label>
                <Select value={newType} onValueChange={setNewType}>
                  <SelectTrigger className="mt-1 bg-secondary"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="workout">Entrenamiento</SelectItem>
                    <SelectItem value="rest">Descanso</SelectItem>
                    <SelectItem value="competition">Competencia</SelectItem>
                    <SelectItem value="custom">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Rutina asociada</Label>
                <Select value={selectedRoutineId} onValueChange={setSelectedRoutineId}>
                  <SelectTrigger className="mt-1 bg-secondary"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin rutina</SelectItem>
                    {routines?.map((routine: any) => (
                      <SelectItem key={routine.id} value={routine.id.toString()}>{routine.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Fecha</Label>
                <Input type="datetime-local" value={newDate} onChange={e => setNewDate(e.target.value)} className="mt-1 bg-secondary" />
              </div>
              <Button onClick={createEvent} disabled={!newTitle.trim() || createMut.isPending} className="w-full">
                Crear evento
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-card border-border/50">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={prevMonth}><ChevronLeft className="h-4 w-4" /></Button>
            <CardTitle className="text-lg capitalize">{monthName}</CardTitle>
            <Button variant="ghost" size="icon" onClick={nextMonth}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map(day => (
              <div key={day} className="text-center text-xs text-muted-foreground font-medium py-2">{day}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => {
              if (!day) return <div key={`empty-${index}`} />;
              const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
              const dayEvents = eventsByDay[day] || [];
              return (
                <div key={day} className={`min-h-[72px] p-1.5 rounded-lg border transition-colors ${isToday ? "border-primary/30 bg-primary/5" : "border-transparent hover:bg-secondary/50"}`}>
                  <p className={`text-xs font-medium mb-1 ${isToday ? "text-primary" : "text-muted-foreground"}`}>{day}</p>
                  {dayEvents.slice(0, 2).map((event: any) => {
                    const cfg = typeConfig[event.type] || typeConfig.custom;
                    return (
                      <div
                        key={event.id}
                        className={`text-[10px] px-1 py-0.5 rounded ${cfg.bg} ${cfg.color} truncate mb-0.5 cursor-pointer`}
                        onClick={() => toggleMut.mutate({ id: event.id, isCompleted: !event.isCompleted })}
                      >
                        {event.isCompleted && <Check className="h-2 w-2 inline mr-0.5" />}
                        {event.title}
                      </div>
                    );
                  })}
                  {dayEvents.length > 2 && <p className="text-[10px] text-muted-foreground">+{dayEvents.length - 2} más</p>}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Eventos del mes</CardTitle>
        </CardHeader>
        <CardContent>
          {sortedEvents.length > 0 ? (
            <div className="space-y-2">
              {sortedEvents.map((event: any) => {
                const cfg = typeConfig[event.type] || typeConfig.custom;
                const Icon = cfg.icon;
                return (
                  <div key={event.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                    <div className={`h-10 w-10 rounded-lg ${cfg.bg} flex items-center justify-center`}>
                      <Icon className={`h-4 w-4 ${cfg.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate">{event.title}</p>
                        {event.isCompleted && <Badge variant="outline" className="border-green-500/30 text-green-400">Completado</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(event.scheduledAt).toLocaleString("es")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button variant="outline" size="sm" onClick={() => toggleMut.mutate({ id: event.id, isCompleted: !event.isCompleted })}>
                        {event.isCompleted ? "Reabrir" : "Completar"}
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteMut.mutate({ id: event.id })}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              <CalendarDays className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>No tienes eventos este mes</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
