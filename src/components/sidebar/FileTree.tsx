"use client";

import * as React from "react";
import { ChevronRight, ChevronDown, Folder, FileText, Database, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

type FileNode = {
  id: string;
  name: string;
  type: "folder" | "file" | "database" | "network";
  children?: FileNode[];
};

const mockFileSystem: FileNode[] = [
  {
    id: "root-1",
    name: "Epstein Case Files",
    type: "folder",
    children: [
      {
        id: "f-1",
        name: "Flight Logs",
        type: "folder",
        children: [
          { id: "doc-1", name: "Lolita Express 2002.pdf", type: "file" },
          { id: "doc-2", name: "Pilot Manifests.xlsx", type: "file" },
        ],
      },
      {
        id: "f-2",
        name: "Court Documents",
        type: "folder",
        children: [
          { id: "doc-3", name: "Deposition - Maxwell.pdf", type: "file" },
          { id: "doc-4", name: "Exhibit A - Bank Records.pdf", type: "file" },
        ],
      },
    ],
  },
  {
    id: "root-2",
    name: "External Databases",
    type: "folder",
    children: [
        { id: "db-1", name: "Offshore Leaks", type: "database" },
        { id: "net-1", name: "OpenSanctions API", type: "network" }
    ]
  }
];

function FileTreeNode({ node, depth = 0 }: { node: FileNode; depth?: number }) {
  const [isOpen, setIsOpen] = React.useState(depth < 1); // Open root by default

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const Icon = {
    folder: Folder,
    file: FileText,
    database: Database,
    network: Globe,
  }[node.type];

  return (
    <div className="select-none">
      <div
        className={cn(
          "flex items-center py-1 px-2 hover:bg-zinc-800/50 cursor-pointer rounded-md text-sm transition-colors",
          depth > 0 && "ml-4"
        )}
        onClick={node.children ? handleToggle : undefined}
      >
        <span className="mr-1 text-zinc-500">
            {node.children ? (
                isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />
            ) : (
                <span className="w-[14px] inline-block" />
            )}
        </span>
        <Icon size={14} className={cn("mr-2 text-zinc-400", node.type === 'folder' && "text-zinc-500")} />
        <span className={cn("truncate", node.type === 'file' ? "text-zinc-300" : "text-zinc-200 font-medium")}>
            {node.name}
        </span>
      </div>
      {isOpen && node.children && (
        <div>
          {node.children.map((child) => (
            <FileTreeNode key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function FileTree() {
  return (
    <div className="space-y-1">
      {mockFileSystem.map((node) => (
        <FileTreeNode key={node.id} node={node} />
      ))}
    </div>
  );
}

