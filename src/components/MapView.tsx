"use client"

import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import L from "leaflet"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { mapPriceLabel, validMapCoordinates } from "@/lib/real-estate/map-data"
import styles from "./PropertyMap.module.css"

type MapProperty = { id?: number; slug?: string; title?: string; location?: string; lat?: number; lng?: number; formatted_price?: string; price?: number | string }

function createIcon(label: string) {
    // Leaflet accepts a DOM node. textContent prevents listing data becoming HTML.
    const wrapper = document.createElement("span")
    wrapper.className = styles.marker
    const text = document.createElement("span")
    text.className = styles.label
    text.textContent = label
    wrapper.appendChild(text)
    return new L.DivIcon({html:wrapper,className:"",iconSize:[140,38],iconAnchor:[70,19],popupAnchor:[0,-22]})
}

function PositionMap({ data, active }: {data:MapProperty[]; active?: {coords?:unknown}}) {
    const map = useMap()
    useEffect(() => {
        map.invalidateSize()
        const coordinates = active?.coords
        if (Array.isArray(coordinates) && coordinates.length === 2 && validMapCoordinates(coordinates[0],coordinates[1])) {
            const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
            if (reduced) map.setView(coordinates as [number,number],14)
            else map.flyTo(coordinates as [number,number],14,{duration:0.6})
        } else if (data.length) {
            map.fitBounds(data.map(item => [item.lat!,item.lng!] as [number,number]), {padding:[80,60],maxZoom:14,animate:false})
        }
    }, [data, active, map])
    return null
}

export default function MapView({ data = [], active }: {data?:MapProperty[]; active?:{coords?:unknown}}) {
    const [tileError, setTileError] = useState(false)
    const mapped = useMemo(() => Array.isArray(data) ? data.filter(item => validMapCoordinates(item.lat,item.lng)) : [], [data])
    const markers = useMemo(() => mapped.map(item => ({item,label:mapPriceLabel(item),icon:createIcon(mapPriceLabel(item))})),[mapped])
    if (!mapped.length) return <div className="gth-glass flex h-full items-center justify-center p-6 text-center"><p>No project coordinates available. No approximate property pins are shown.</p></div>
    return <div className={styles.root}>
        <MapContainer center={[mapped[0].lat!,mapped[0].lng!]} zoom={10} scrollWheelZoom={false} style={{height:"100%",width:"100%"}}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' eventHandlers={{tileerror:()=>setTileError(true)}} />
            <PositionMap data={mapped} active={active} />
            {markers.map(({item,label,icon},index) => <Marker key={item.id ?? item.slug ?? index} position={[item.lat!,item.lng!]} icon={icon} title={`${item.title || "Property listing"}: ${label}`} alt={item.title || "Property listing"}>
                <Popup><div><h3 className="font-bold">{item.title || "Property listing"}</h3><p>{item.location || "Address not provided"}</p><p className="font-bold my-2">{label}</p>{item.slug && <Link className="underline" href={`/real-estate/${encodeURIComponent(item.slug)}`}>View project details</Link>}<p className="text-xs mt-2">Stored coordinates; confirm the project address.</p></div></Popup>
            </Marker>)}
        </MapContainer>
        {tileError && <p role="status" className={styles.notice}>Some map tiles could not load. Listing details remain available; reload the map to retry.</p>}
    </div>
}
