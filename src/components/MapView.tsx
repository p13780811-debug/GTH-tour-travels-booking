"use client"

import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { useEffect } from "react"

const createIcon = (price: number) =>
    new L.DivIcon({
        html: `<div style="
      background:#ff385c;
      color:white;
      padding:4px 10px;
      border-radius:20px;
      font-size:12px;
      font-weight:bold;">
      ₹${price}
    </div>`,
        className: "",
    })
function FlyTo({ position }: any) {
    const map = useMap()

    useEffect(() => {
        if (position) {
            map.flyTo(position, 10)
        }
    }, [position])

    return null
}

export default function ToursMap({ tours, active }: any) {
    return (
        <MapContainer
            center={[20.5937, 78.9629]}
            zoom={4}
            style={{ height: "100%", width: "100%" }}
        >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

            <FlyTo position={active?.coords} />

            {tours.map((t: any) => {
                if (!t.lat || !t.lng) return null

                return (
                    <Marker
                        key={t.id}
                        position={[t.lat, t.lng]}
                        icon={createIcon(t.price)}
                    >
                        <Popup>{t.title}</Popup>
                    </Marker>
                )
            })}
        </MapContainer>
    )
}