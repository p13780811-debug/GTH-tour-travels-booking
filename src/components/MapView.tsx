"use client"

import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import L from "leaflet"
import { useEffect, useRef } from "react"

// ==============================
// 🔥 HEATMAP (SSR SAFE)
// ==============================
function HeatMap({ data }: any) {
    const map = useMap()
    const layerRef = useRef<any>(null)

    useEffect(() => {
        if (!map || typeof window === "undefined") return

        let isMounted = true

        const load = async () => {
            await import("leaflet.heat")
            if (!isMounted) return

            const points = data
                ?.filter((p: any) => p.lat && p.lng)
                ?.map((p: any) => [p.lat, p.lng, 0.6])

            if (!points || points.length === 0) return

            // cleanup old layer
            if (layerRef.current) {
                map.removeLayer(layerRef.current)
            }

            // @ts-ignore
            const heat = L.heatLayer(points, {
                radius: 30,
                blur: 20,
                maxZoom: 12,
            })

            heat.addTo(map)
            layerRef.current = heat
        }

        load()

        return () => {
            isMounted = false
            if (layerRef.current) {
                map.removeLayer(layerRef.current)
                layerRef.current = null
            }
        }
    }, [data, map])

    return null
}

// ==============================
// 📍 CUSTOM PRICE MARKER
// ==============================
const createIcon = (price: number) =>
    new L.DivIcon({
        html: `
        <div style="
            background:#0ea5e9;
            color:white;
            padding:6px 12px;
            border-radius:20px;
            font-size:12px;
            font-weight:bold;
            box-shadow:0 2px 8px rgba(0,0,0,0.3);
        ">
            ${Number.isFinite(Number(price)) && Number(price) > 0 ? `₹${Number(price).toLocaleString("en-IN")}` : "Price on request"}
        </div>
        `,
        className: "",
    })

// ==============================
// 🎯 FLY TO ACTIVE
// ==============================
function FlyTo({ position }: any) {
    const map = useMap()

    useEffect(() => {
        if (
            Array.isArray(position) &&
            position.length === 2 &&
            typeof position[0] === "number" &&
            typeof position[1] === "number"
        ) {
            map.flyTo(position as [number, number], 12, { duration: 1.5 })
        }
    }, [position, map])

    return null
}

// ==============================
// 📦 AUTO FIT BOUNDS
// ==============================
function FitBounds({ data }: any) {
    const map = useMap()

    useEffect(() => {
        if (!Array.isArray(data) || data.length === 0) return

        const bounds = data
            .filter((d: any) =>
                typeof d.lat === "number" &&
                typeof d.lng === "number"
            )
            .map((d: any) => [d.lat, d.lng])

        if (bounds.length > 0) {
            map.fitBounds(bounds as [number, number][])
        }
    }, [data, map])

    return null
}

// ==============================
// 🔥 MAIN MAP
// ==============================
export default function MapView({ data = [], active }: any) {
    return (
        <MapContainer
            center={[20.5937, 78.9629]}
            zoom={5}
            scrollWheelZoom={true}
            style={{ height: "100%", width: "100%" }}
        >
            {/* 🌍 MAP TILE */}
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />

            {/* 🔥 FEATURES */}
            <FlyTo position={active?.coords} />
            <FitBounds data={data} />
            <HeatMap data={data} />

            {/* 📍 MARKERS */}
            {Array.isArray(data) &&
                data.map((item: any) => {
                    if (
                        typeof item.lat !== "number" ||
                        typeof item.lng !== "number" || !Number.isFinite(item.lat) || !Number.isFinite(item.lng) || Math.abs(item.lat) > 90 || Math.abs(item.lng) > 180
                    ) return null

                    return (
                        <Marker
                            key={item.id}
                            position={[item.lat, item.lng]}
                            icon={createIcon(item.price || 0)}
                        >
                            <Popup>
                                <div>
                                    <h3 className="font-bold">{item.title}</h3>
                                    <p>{item.location}</p>
                                    <p>₹ {item.price}</p>
                                </div>
                            </Popup>
                        </Marker>
                    )
                })}
        </MapContainer>
    )
}