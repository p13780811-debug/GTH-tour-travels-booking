"use client"

import MapWrapper from "@/components/MapWrapper"

export default function MapFullscreen({ open, onClose, data, active }: any) {
    if (!open) return null

    return (
        <div className="fixed inset-0 z-50 bg-black">

            <button
                onClick={onClose}
                className="absolute top-4 left-4 z-50 gth-glass text-black px-3 py-1 rounded"
            >
                Back
            </button>

            <div className="w-full h-full">
                <MapWrapper data={data} active={active} />
            </div>
        </div>
    )
}