"use client";

import * as React from "react";
import { ChevronRight, Download, ExternalLink, ZoomIn, ZoomOut, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DocumentViewerProps {
  onClose?: () => void;
}

export function DocumentViewer({ onClose }: DocumentViewerProps) {
  return (
    <div className="flex flex-col h-full bg-zinc-900">
      {/* Header / Toolbar */}
      <div className="flex flex-col border-b border-zinc-800 bg-zinc-925">
         {/* Breadcrumbs */}
         <div className="flex items-center gap-1 px-4 py-2 text-xs text-zinc-500 overflow-x-auto whitespace-nowrap">
            {onClose && (
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 mr-2 text-zinc-500 hover:text-zinc-300" 
                    onClick={onClose}
                >
                    <X className="h-4 w-4" />
                </Button>
            )}
            <span className="hover:text-zinc-300 cursor-pointer">Evidence</span>
            <ChevronRight className="h-3 w-3" />
            <span className="hover:text-zinc-300 cursor-pointer">Flight Logs</span>
            <ChevronRight className="h-3 w-3" />
            <span className="hover:text-zinc-300 cursor-pointer">2002</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-primary font-medium">N909JE_Manifest_Jun02.pdf</span>
         </div>
         
         {/* Tools */}
         <div className="flex items-center justify-between px-3 py-2 gap-2">
            <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-zinc-400 hover:text-zinc-100">
                    <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-xs text-zinc-400 w-12 text-center">120%</span>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-zinc-400 hover:text-zinc-100">
                    <ZoomIn className="h-4 w-4" />
                </Button>
            </div>
            
            <div className="flex items-center gap-1 bg-zinc-800/50 rounded-md px-2 py-1">
                 <Search className="h-3 w-3 text-zinc-500" />
                 <input 
                    className="bg-transparent border-none text-xs text-zinc-200 focus:outline-none w-24 placeholder:text-zinc-600"
                    placeholder="Find in doc..."
                 />
            </div>

            <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-zinc-400 hover:text-zinc-100">
                    <Download className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-zinc-400 hover:text-zinc-100">
                    <ExternalLink className="h-4 w-4" />
                </Button>
            </div>
         </div>
      </div>

      {/* Document Content (Mock) */}
      <div className="flex-1 overflow-y-auto p-6 bg-zinc-800/30">
        <div className="max-w-2xl mx-auto bg-white min-h-[800px] shadow-2xl p-12 text-black font-serif relative">
            {/* Mock Watermark/Header */}
            <div className="absolute top-6 left-6 right-6 border-b-2 border-black pb-4 flex justify-between items-end opacity-80">
                 <div className="text-sm font-bold uppercase tracking-widest">Official Flight Manifest</div>
                 <div className="text-xs font-mono">REF: US-EP-2002-094B</div>
            </div>

            {/* Mock Content */}
            <div className="mt-16 space-y-6 text-sm leading-relaxed text-zinc-800">
                <p>
                    <strong>AIRCRAFT:</strong> BOEING 727<br/>
                    <strong>REGISTRATION:</strong> N909JE<br/>
                    <strong>DATE:</strong> JUNE 14, 2002
                </p>
                
                <table className="w-full text-left border-collapse mt-8 font-mono text-xs">
                    <thead>
                        <tr className="border-b border-black">
                            <th className="py-2">LAST NAME</th>
                            <th className="py-2">FIRST NAME</th>
                            <th className="py-2">PASSPORT</th>
                            <th className="py-2">NOTES</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="border-b border-zinc-300 bg-yellow-200/50">
                            <td className="py-2">EPSTEIN</td>
                            <td className="py-2">JEFFREY</td>
                            <td className="py-2">USA********</td>
                            <td className="py-2">OWNER</td>
                        </tr>
                        <tr className="border-b border-zinc-300 bg-yellow-200/50">
                            <td className="py-2">MAXWELL</td>
                            <td className="py-2">GHISLAINE</td>
                            <td className="py-2">FRA********</td>
                            <td className="py-2">PAX</td>
                        </tr>
                        <tr className="border-b border-zinc-300">
                            <td className="py-2">REDACTED</td>
                            <td className="py-2">REDACTED</td>
                            <td className="py-2">---</td>
                            <td className="py-2">---</td>
                        </tr>
                         <tr className="border-b border-zinc-300">
                            <td className="py-2">DOE</td>
                            <td className="py-2">JANE</td>
                            <td className="py-2">---</td>
                            <td className="py-2">MINOR</td>
                        </tr>
                    </tbody>
                </table>

                <div className="mt-12 p-4 border border-red-600/30 bg-red-50 text-red-900 text-xs font-mono">
                    <p className="font-bold mb-1">INVESTIGATOR NOTE:</p>
                    <p>Discrepancy in passenger count vs. Teterboro departure logs. Check Log 2002-06-14 for secondary confirmation.</p>
                </div>

                <p className="text-justify mt-8">
                    The above listed passengers boarded the aircraft at approximately 14:00 hours local time. Weather conditions were clear. Flight duration estimated at 2 hours 45 minutes. Destination: Palm Beach International (PBI).
                </p>
                
                <p className="text-justify">
                    <mark className="bg-yellow-300 px-1">Maintenance records indicate hydraulic service performed prior to departure.</mark> Pilot in command: [REDACTED]. Co-pilot: [REDACTED].
                </p>
            </div>

            {/* Page Number */}
            <div className="absolute bottom-6 right-6 text-xs font-mono text-zinc-500">
                Page 12 of 45
            </div>
        </div>
      </div>
    </div>
  );
}

