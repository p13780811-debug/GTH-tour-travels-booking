"use client"
import { Home, Map, Plus, User } from "lucide-react"

export default function BottomNav({ onMap }: any) {
    return (
        <div className="fixed bottom-0 left-0 w-full bg-black border-t border-slate-800 flex justify-around py-2 z-50 md:hidden">

            <button className="flex flex-col items-center text-xs text-white">
                <Home size={20} />
                Home
            </button>

            <button onClick={onMap} className="flex flex-col items-center text-xs text-cyan-400">
                <Map size={20} />
                Map
            </button>

            <button className="flex flex-col items-center text-xs text-white">
                <Plus size={20} />
                Post
            </button>

            <button className="flex flex-col items-center text-xs text-white">
                <User size={20} />
                Profile
            </button>
        </div>
    )
}