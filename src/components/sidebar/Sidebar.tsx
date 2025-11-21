import * as React from "react";
import { FileTree } from "./FileTree";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Hash, Users, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

export function Sidebar() {
  return (
    <div className="flex flex-col h-full px-4 pt-2 pb-4 space-y-6">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search case files..." className="pl-8 bg-zinc-900 border-zinc-800" />
      </div>

      {/* Sources */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider px-2">
            Sources
        </h3>
        <FileTree />
      </div>

      <Separator />

      {/* Saved Entities */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider px-2">
            Entities of Interest
        </h3>
        <div className="space-y-1">
            {[
                { name: "Maxwell, Ghislaine", type: "person", count: 142 },
                { name: "Dubin, Glenn", type: "person", count: 89 },
                { name: "N909JE", type: "asset", count: 34 },
                { name: "Palm Beach, FL", type: "location", count: 212 },
            ].map((entity, i) => (
                <div key={i} className="flex items-center justify-between group px-2 py-1.5 hover:bg-zinc-800/50 rounded-md cursor-pointer transition-colors">
                    <div className="flex items-center gap-2 overflow-hidden">
                        {entity.type === 'person' && <Users size={14} className="text-zinc-500" />}
                        {entity.type === 'asset' && <Hash size={14} className="text-zinc-500" />}
                        {entity.type === 'location' && <MapPin size={14} className="text-zinc-500" />}
                        <span className="text-sm text-zinc-300 truncate">{entity.name}</span>
                    </div>
                    <Badge variant="secondary" className="text-[10px] px-1.5 h-5 group-hover:bg-zinc-700 group-hover:text-zinc-200 transition-colors">
                        {entity.count}
                    </Badge>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
}

