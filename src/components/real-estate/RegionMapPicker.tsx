"use client";
import {MapContainer,TileLayer,Polygon,useMapEvents} from 'react-leaflet';
import type {SearchRegion} from '@/lib/real-estate/search-region';
function Clicks({add}:{add:(point:[number,number])=>void}){useMapEvents({click:e=>add([((e.latlng.lng+540)%360)-180,e.latlng.lat])});return null;}
export default function RegionMapPicker({points,onPoint}:{points:SearchRegion;onPoint:(point:[number,number])=>void}){return <div className="gold-text h-72 overflow-hidden rounded-xl"><MapContainer center={points.length?[points[0][1],points[0][0]]:[19.07,72.88]} zoom={11} className="h-full w-full"><TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/><Clicks add={onPoint}/>{points.length>1&&<Polygon positions={points.map(([lng,lat])=>[lat,lng])} pathOptions={{className:'gold-text',color:'currentColor'}}/>}</MapContainer></div>;}
