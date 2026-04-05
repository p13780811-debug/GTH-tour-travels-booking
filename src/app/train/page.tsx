'use client';

import React, { useState } from 'react';
import {
    Search,
    Train,
    ClipboardList,
    Activity,
    MapPin,
    Calendar,
} from 'lucide-react';

const STATIONS = [
    "New Delhi",
    "Mumbai Central",
    "Chennai Central",
    "Kolkata",
    "Bangalore",
    "Hyderabad",
    "Pune",
    "Jaipur",
    "Ahmedabad",
    "Lucknow",
]; // Example stations for autocomplete

const CLASSES = ["Sleeper", "AC 3 Tier", "AC 2 Tier", "First Class"];

export default function TrainServicePage() {
    const [activeTab, setActiveTab] = useState('search');

    // Form states
    const [fromStation, setFromStation] = useState('');
    const [toStation, setToStation] = useState('');
    const [travelDate, setTravelDate] = useState('');
    const [pnrNumber, setPnrNumber] = useState('');
    const [trainNumber, setTrainNumber] = useState('');
    const [seats, setSeats] = useState(1);
    const [classType, setClassType] = useState(CLASSES[0]);

    // Results & UI state
    const [searchResult, setSearchResult] = useState<any[]>([]);
    const [pnrResult, setPnrResult] = useState<any>(null);
    const [liveResult, setLiveResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const API_KEY = 'YOUR_API_KEY'; // Replace with your API key

    const handleSearch = async () => {
        if (!fromStation || !toStation || !travelDate) {
            setError('Please fill all fields!');
            return;
        }
        setError('');
        setLoading(true);
        setSearchResult([]);
        try {
            const dateStr = travelDate.replaceAll('-', '');
            // Fetch real train data
            const res = await fetch(
                `https://indianrailapi.com/api/v2/TrainBetweenStation/apikey/${API_KEY}/From/${fromStation}/To/${toStation}/Date/${dateStr}/`
            );
            const data = await res.json();
            // Mock seat & fare info if API doesn't provide
            const resultsWithFare = data.Trains?.map((t: any) => ({
                ...t,
                availableSeats: Math.floor(Math.random() * 100),
                fare: Math.floor(Math.random() * 1500) + 200,
            })) || [];
            setSearchResult(resultsWithFare);
        } catch (err) {
            console.error(err);
            setError('Failed to fetch train data.');
        } finally {
            setLoading(false);
        }
    };

    const handlePnrCheck = async () => {
        if (!pnrNumber) {
            setError('Enter PNR Number!');
            return;
        }
        setError('');
        setLoading(true);
        setPnrResult(null);
        try {
            const res = await fetch(
                `https://indianrailapi.com/api/v2/PNRCheck/apikey/${API_KEY}/PNRNumber/${pnrNumber}/`
            );
            const data = await res.json();
            setPnrResult(data);
        } catch (err) {
            console.error(err);
            setError('Failed to fetch PNR status.');
        } finally {
            setLoading(false);
        }
    };

    const handleLiveStatus = async () => {
        if (!trainNumber || !travelDate) {
            setError('Enter train number and date!');
            return;
        }
        setError('');
        setLoading(true);
        setLiveResult(null);
        try {
            const dateStr = travelDate.replaceAll('-', '');
            const res = await fetch(
                `https://indianrailapi.com/api/v2/livetrainstatus/apikey/${API_KEY}/trainnumber/${trainNumber}/date/${dateStr}/`
            );
            const data = await res.json();
            setLiveResult(data);
        } catch (err) {
            console.error(err);
            setError('Failed to fetch live status.');
        } finally {
            setLoading(false);
        }
    };

    // Autocomplete helper
    const filterStations = (input: string) =>
        STATIONS.filter((s) => s.toLowerCase().includes(input.toLowerCase()));

    return (
        <div className="min-h-screen bg-[#000d1a] text-white font-sans">
            {/* Header */}
            <section className="p-8 text-center bg-gradient-to-b from-[#001a33] to-[#000d1a] border-b border-slate-800">
                <h1 className="text-3xl font-black text-[#e6b800] uppercase tracking-tighter">
                    GTH PRO <span className="text-white font-light">RAILWAYS</span>
                </h1>
                <p className="text-slate-400 text-xs mt-2 uppercase tracking-widest">
                    Premium Train Booking & Tracking
                </p>
            </section>

            {/* Tabs */}
            <div className="max-w-4xl mx-auto px-4 -mt-6">
                <div className="bg-[#001a33] p-2 rounded-2xl border border-slate-700 flex justify-around shadow-2xl">
                    {[
                        { key: 'search', icon: <Search size={20} />, label: 'Search' },
                        { key: 'pnr', icon: <ClipboardList size={20} />, label: 'PNR Status' },
                        { key: 'live', icon: <Activity size={20} />, label: 'Live Status' },
                    ].map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex flex-col items-center gap-1 px-6 py-3 rounded-xl transition-all
                ${activeTab === tab.key
                                    ? 'bg-[#e6b800] text-[#000d1a] shadow-lg'
                                    : 'text-slate-400 hover:bg-white/5'
                                }`}
                        >
                            {tab.icon}
                            <span className="text-[10px] font-bold uppercase">{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {error && (
                <div className="max-w-4xl mx-auto mt-4 text-red-500 text-sm font-bold">
                    {error}
                </div>
            )}

            <main className="max-w-6xl mx-auto p-6 space-y-8 mt-6">
                {/* Search Trains */}
                {activeTab === 'search' && (
                    <div className="bg-[#001a33] p-6 rounded-2xl border border-slate-800 shadow-xl">
                        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                            <div className="bg-[#000d1a] p-3 rounded-lg border border-slate-800 flex items-center gap-2">
                                <MapPin className="text-[#e6b800]" />
                                <input
                                    list="fromStations"
                                    placeholder="From Station"
                                    value={fromStation}
                                    onChange={(e) => setFromStation(e.target.value)}
                                    className="bg-transparent outline-none text-sm w-full"
                                />
                                <datalist id="fromStations">
                                    {filterStations(fromStation).map((s) => (
                                        <option key={s} value={s} />
                                    ))}
                                </datalist>
                            </div>

                            <div className="bg-[#000d1a] p-3 rounded-lg border border-slate-800 flex items-center gap-2">
                                <MapPin className="text-[#e6b800]" />
                                <input
                                    list="toStations"
                                    placeholder="To Station"
                                    value={toStation}
                                    onChange={(e) => setToStation(e.target.value)}
                                    className="bg-transparent outline-none text-sm w-full"
                                />
                                <datalist id="toStations">
                                    {filterStations(toStation).map((s) => (
                                        <option key={s} value={s} />
                                    ))}
                                </datalist>
                            </div>

                            <div className="bg-[#000d1a] p-3 rounded-lg border border-slate-800 flex items-center gap-2">
                                <Calendar className="text-[#e6b800]" />
                                <input
                                    type="date"
                                    value={travelDate}
                                    onChange={(e) => setTravelDate(e.target.value)}
                                    className="bg-transparent outline-none text-sm w-full"
                                />
                            </div>

                            <div className="bg-[#000d1a] p-3 rounded-lg border border-slate-800 flex items-center gap-2">
                                <select
                                    value={classType}
                                    onChange={(e) => setClassType(e.target.value)}
                                    className="bg-transparent outline-none text-sm w-full"
                                >
                                    {CLASSES.map((c) => (
                                        <option key={c} value={c}>
                                            {c}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="bg-[#000d1a] p-3 rounded-lg border border-slate-800 flex items-center gap-2">
                                <input
                                    type="number"
                                    min={1}
                                    max={10}
                                    value={seats}
                                    onChange={(e) => setSeats(Number(e.target.value))}
                                    placeholder="Seats"
                                    className="bg-transparent outline-none text-sm w-full"
                                />
                            </div>

                            <button
                                onClick={handleSearch}
                                className="bg-[#e6b800] text-[#000d1a] font-bold py-3 rounded-xl hover:bg-[#ffcc00]"
                            >
                                {loading ? 'Searching...' : 'Search'}
                            </button>
                        </div>

                        {/* Train Table */}
                        {searchResult.length > 0 && (
                            <div className="mt-6 overflow-x-auto">
                                <table className="w-full text-sm text-left border-collapse">
                                    <thead>
                                        <tr className="bg-[#001a33] text-[#e6b800]">
                                            <th className="p-2 border border-slate-700">Train</th>
                                            <th className="p-2 border border-slate-700">Departure</th>
                                            <th className="p-2 border border-slate-700">Arrival</th>
                                            <th className="p-2 border border-slate-700">Seats</th>
                                            <th className="p-2 border border-slate-700">Fare</th>
                                            <th className="p-2 border border-slate-700">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {searchResult.map((train: any) => (
                                            <tr
                                                key={train.TrainNo || train.name}
                                                className="hover:bg-white/10 transition-colors"
                                            >
                                                <td className="p-2 border border-slate-700">{train.TrainName}</td>
                                                <td className="p-2 border border-slate-700">{train.DepartureTime || train.src_departure_time}</td>
                                                <td className="p-2 border border-slate-700">{train.ArrivalTime || train.dest_arrival_time}</td>
                                                <td className="p-2 border border-slate-700">{train.availableSeats}</td>
                                                <td className="p-2 border border-slate-700">₹{train.fare}</td>
                                                <td className="p-2 border border-slate-700">
                                                    <button className="bg-[#e6b800] text-[#000d1a] px-3 py-1 rounded-lg font-bold hover:bg-[#ffcc00]">
                                                        Book Now
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* PNR */}
                {activeTab === 'pnr' && (
                    <div className="bg-[#001a33] p-6 rounded-2xl border border-slate-800 shadow-xl">
                        <div className="flex gap-4 flex-col md:flex-row">
                            <input
                                type="text"
                                placeholder="Enter 10-digit PNR"
                                value={pnrNumber}
                                onChange={(e) => setPnrNumber(e.target.value)}
                                className="bg-[#000d1a] p-3 rounded-lg text-sm outline-none flex-1"
                            />
                            <button
                                onClick={handlePnrCheck}
                                className="bg-[#e6b800] text-[#000d1a] font-bold px-6 rounded-lg hover:bg-[#ffcc00]"
                            >
                                {loading ? 'Checking...' : 'Check'}
                            </button>
                        </div>

                        {pnrResult && (
                            <div className="mt-4 bg-[#000d1a] p-4 rounded-lg border border-slate-800">
                                <pre className="text-xs text-slate-200 overflow-x-auto">
                                    {JSON.stringify(pnrResult, null, 2)}
                                </pre>
                            </div>
                        )}
                    </div>
                )}

                {/* Live Status */}
                {activeTab === 'live' && (
                    <div className="bg-[#001a33] p-6 rounded-2xl border border-slate-800 shadow-xl">
                        <div className="flex gap-4 flex-col md:flex-row">
                            <input
                                type="text"
                                placeholder="Enter Train Number"
                                value={trainNumber}
                                onChange={(e) => setTrainNumber(e.target.value)}
                                className="bg-[#000d1a] p-3 rounded-lg text-sm outline-none flex-1"
                            />
                            <input
                                type="date"
                                value={travelDate}
                                onChange={(e) => setTravelDate(e.target.value)}
                                className="bg-[#000d1a] p-3 rounded-lg text-sm outline-none"
                            />
                            <button
                                onClick={handleLiveStatus}
                                className="bg-[#e6b800] text-[#000d1a] font-bold px-6 rounded-lg hover:bg-[#ffcc00]"
                            >
                                {loading ? 'Tracking...' : 'Track'}
                            </button>
                        </div>

                        {liveResult && (
                            <div className="mt-4 bg-[#000d1a] p-4 rounded-lg border border-slate-800">
                                <pre className="text-xs text-slate-200 overflow-x-auto">
                                    {JSON.stringify(liveResult, null, 2)}
                                </pre>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}