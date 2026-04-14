"use client"

import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import L from "leaflet"
import { useEffect } from "react"

// 🔥 Marker UI
const createIcon = (price: number) =>
    new L.DivIcon({
        html: `<div style="
      background:#ff385c;
      color:white;
      padding:6px 12px;
      border-radius:20px;
      font-size:13px;
      font-weight:bold;">
      ₹${price}
    </div>`,
        className: "",
    })

function FlyTo({ position }: any) {
    const map = useMap()

    useEffect(() => {
        if (position) {
            map.flyTo(position, 12)
        }
    }, [position])

    return null
}

function FitBounds({ data }: any) {
    const map = useMap()

    useEffect(() => {
        if (!Array.isArray(data) || data.length === 0) return

        const bounds: any = data
            .filter((d: any) => d.lat && d.lng)
            .map((d: any) => [d.lat, d.lng])

        if (bounds.length > 0) {
            map.fitBounds(bounds)
        }
    }, [data])

    return null
}

export default function MapView({ data = [], active }: any) {
    return (
        <MapContainer
            center={[20.5937, 78.9629]}
            zoom={5}
            style={{ height: "200px", width: "100%" }}
        >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

            <FlyTo position={active?.coords} />
            <FitBounds data={data} />

            {Array.isArray(data) &&
                data.map((item: any) => {
                    if (!item.lat || !item.lng) return null

                    return (
                        <Marker
                            key={item.id}
                            position={[item.lat, item.lng]}
                            icon={createIcon(item.price || 0)}
                        >
                            <Popup>{item.title}</Popup>
                        </Marker>
                    )
                })}
        </MapContainer>
    )
}