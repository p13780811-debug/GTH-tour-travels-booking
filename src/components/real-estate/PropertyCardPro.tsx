"use client"

import { motion } from "framer-motion"
import { useThemeMode } from "@/lib/hooks/useThemeMode"

export default function PropertyCardPro({ p, user, onSelect, onLead, onBoost }: any) {

    const theme = useThemeMode()
    const isDay = theme === "day"

    return (
        <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => onSelect(p)}
            className="group relative rounded-3xl overflow-hidden cursor-pointer gth-glass gth-hover"
        >

            {/* IMAGE */}
            <div className="relative h-56 overflow-hidden select-none">

                <img
                    src={p.image}
                    draggable={false}
                    onContextMenu={(e) => e.preventDefault()}
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-110 pointer-events-none"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />

                {p.is_featured && (
                    <div className="absolute top-3 right-3 bg-yellow-400 text-black px-3 py-1 rounded-full text-[10px] font-bold">
                        ⭐ FEATURED
                    </div>
                )}
            </div>

            {/* CONTENT */}
            <div className="p-4">

                <h3 className="font-bold text-lg truncate">
                    {p.title}
                </h3>

                <p className="text-sm opacity-70">
                    {p.location}
                </p>

                <div className="flex justify-between items-center mt-4">

                    <span className="font-bold text-lg gold-text">
                        ₹ {p.price} L
                    </span>

                    <div className="flex gap-2">

                        {/* ENQUIRE */}
                        {user?.email !== p.created_by && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onLead(p.id)
                                }}
                                className="px-3 py-1 text-xs rounded font-bold gth-btn-gold text-black"
                            >
                                ENQUIRE
                            </button>
                        )}

                        {/* BOOST */}
                        {user?.email === p.created_by && !p.is_featured && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onBoost(p.id)
                                }}
                                className="px-3 py-1 text-xs rounded font-bold gth-btn-gold text-black"
                            >
                                BOOST
                            </button>
                        )}

                    </div>
                </div>
            </div>
        </motion.div>
    )
}