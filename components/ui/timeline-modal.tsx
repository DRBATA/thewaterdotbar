"use client"

import { TimelineEvent } from "@/lib/client-db"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { X, Clock, Droplet, Zap, Beef, GlassWater, Activity } from "lucide-react"

interface TimelineModalProps {
  events: TimelineEvent[]
  onClose: () => void
}

function getIconForType(type: TimelineEvent['type']) {
    switch (type) {
        case 'consumption': return <GlassWater className="size-5 text-cyan-300" />;
        case 'activity': return <Activity className="size-5 text-amber-300" />;
        default: return <Droplet className="size-5 text-gray-400" />;
    }
}

export function TimelineModal({ events, onClose }: TimelineModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-xl border-2 border-cyan-300/50 bg-slate-900/90 p-6 text-white shadow-[0_0_60px_rgb(0_255_255_/_0.2)]">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/20">
          <div className="flex items-center gap-3">
            <Clock className="size-6 text-cyan-300" />
            <h2 className="text-xl font-bold">Today's Hydration Timeline</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-white/80 hover:text-white">
            <X className="size-5" />
          </Button>
        </div>
        <ScrollArea className="h-[60vh] w-full pr-4">
          {events.length > 0 ? (
            <div className="space-y-4">
              {events.map(event => (
                <div key={event.id} className="flex items-start gap-4 rounded-lg bg-slate-800/70 p-3">
                    <div className="mt-1">
                        {getIconForType(event.type)}
                    </div>
                    <div className="flex-1">
                        <div className="flex justify-between items-center">
                            <p className="font-semibold text-base text-white">{event.title}</p>
                            <p className="text-xs text-slate-400">
                                {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                            </p>
                        </div>
                        <p className="text-sm text-slate-300 mt-1">{event.description}</p>
                        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                            {event.kpi_water_ml > 0 && <span className="flex items-center gap-1"><Droplet className="size-3 text-cyan-400" /> {event.kpi_water_ml}ml</span>}
                            {event.kpi_sodium_mg > 0 && <span className="flex items-center gap-1"><Zap className="size-3 text-yellow-400" /> {event.kpi_sodium_mg}mg Na</span>}
                            {event.kpi_potassium_mg > 0 && <span className="flex items-center gap-1"><Zap className="size-3 text-orange-400" /> {event.kpi_potassium_mg}mg K</span>}
                            {event.kpi_protein_g > 0 && <span className="flex items-center gap-1"><Beef className="size-3 text-red-400" /> {event.kpi_protein_g}g</span>}
                        </div>
                    </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <p>No events logged for today.</p>
              <p className="text-sm">Chat with the AI to log your meals and drinks!</p>
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  )
}
