import * as React from "react";
import { Card } from "@/components/ui/card";

interface Story {
  id: string;
  title: string;
  description: string;
}

const MOCK_STORIES: Story[] = [
  {
    id: "1",
    title: "Bill Clinton on flight logs",
    description: "Explore flight logs revealing Bill Clinton's travels on Epstein's private jets, including trips on the infamous N908JE from 1993 to 1999. Key documents highlight passenger lists and dates."
  },
  {
    id: "2",
    title: "Prince Andrew's visits",
    description: "Detailed analysis of Prince Andrew's presence at key locations including Little St. James and the New York mansion, cross-referenced with flight manifests and witness testimonies."
  },
  {
    id: "3",
    title: "MIT Funding Connections",
    description: "Investigation into donations and funding received by the Media Lab, examining correspondence and financial records linking institutional support to the Epstein network."
  }
];

export function TopStories() {
  return (
    <div className="w-full max-w-3xl mt-4 space-y-4 opacity-70 hover:opacity-100 transition-opacity duration-200">
      <h2 className="text-zinc-400 text-lg font-medium text-left">Top discoveries
        
      </h2>
      <div className="space-y-3">
        {MOCK_STORIES.map((story) => (
          <Card 
            key={story.id}
            className="p-4 bg-[#18181b]/50 border-zinc-800 hover:bg-[#18181b] transition-colors cursor-pointer"
          >
            <h3 className="text-zinc-200 font-serif text-lg mb-2 font-medium">{story.title}</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">{story.description}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

