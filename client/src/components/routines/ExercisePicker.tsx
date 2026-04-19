/**
 * Exercise picker sub-component for the manual routine builder.
 * Extracted from Routines.tsx to reduce that file's size.
 */
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dumbbell, Plus } from "lucide-react";

type Exercise = {
  id: number;
  name: string;
  category?: string | null;
  difficulty?: string | null;
};

type Props = {
  exercises: Exercise[] | undefined;
  onSelect: (id: number, name: string) => void;
};

const CATEGORIES = ["armwrestling", "strength", "technique", "conditioning", "mobility"];

import { useState } from "react";

export default function ExercisePicker({ exercises, onSelect }: Props) {
  const [search, setSearch]             = useState("");
  const [selectedCategory, setCategory] = useState("");

  const filtered = exercises?.filter(ex => {
    const matchSearch   = !search           || ex.name.toLowerCase().includes(search.toLowerCase());
    const matchCategory = !selectedCategory || ex.category === selectedCategory;
    return matchSearch && matchCategory;
  });

  return (
    <Card className="bg-secondary/30 border-border/30 mb-3">
      <CardContent className="p-3 space-y-3">
        <Input
          placeholder="Buscar ejercicio..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="bg-background border-border/50"
        />
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map(cat => (
            <Button
              key={cat}
              type="button"
              variant={selectedCategory === cat ? "default" : "outline"}
              size="sm"
              onClick={() => setCategory(selectedCategory === cat ? "" : cat)}
              className="text-xs h-7"
            >
              {cat}
            </Button>
          ))}
        </div>
        <div className="max-h-40 overflow-y-auto space-y-1">
          {filtered?.map(ex => (
            <button
              key={ex.id}
              type="button"
              onClick={() => onSelect(ex.id, ex.name)}
              className="w-full text-left p-2 rounded-lg hover:bg-secondary text-sm flex items-center justify-between group"
            >
              <div className="flex items-center gap-2">
                <Dumbbell className="h-3 w-3 text-muted-foreground" />
                <span>{ex.name}</span>
                <Badge variant="outline" className="text-[10px]">{ex.difficulty}</Badge>
              </div>
              <Plus className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100" />
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
