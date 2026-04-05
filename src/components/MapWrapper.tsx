"use client"

import dynamic from "next/dynamic"

const Map = dynamic(() => import("./MapView"), {
    ssr: false,
})

export default function MapWrapper(props: any) {
    return <Map {...props} />
}