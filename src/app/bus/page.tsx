'use client';

import React, { useState } from 'react';
import {
    Train,
    Bus,
    ClipboardList,
    Activity,
    MapPin,
    Calendar,
    Car,
    Globe,
    Bed,
    Airplay,
} from 'lucide-react';

const STATIONS = ["New Delhi", "Mumbai Central", "Chennai Central", "Kolkata", "Bangalore", "Hyderabad", "Pune", "Jaipur", "Ahmedabad", "Lucknow"];
const CITIES = ["Mumbai", "Pune", "Bangalore", "Hyderabad", "Chennai", "Delhi", "Jaipur", "Lucknow", "Ahmedabad", "Kolkata"];
const CLASSES = ["Sleeper", "AC 3 Tier", "AC 2 Tier", "First Class"];
const BUS_TYPES = ["AC Sleeper", "AC Seater", "Non-AC Sleeper", "Non-AC Seater"];
const FLIGHT_CLASSES = ["Economy", "Premium Economy", "Business", "First Class"];
type SearchItem = {
    id: number;
    name: string;
    departure: string;
    arrival: string;
    seatsAvailable: number;
    fare: number;
};


export default function TravelDashboard() {

    const [activeTab, setActiveTab] = useState('train');
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [travelDate, setTravelDate] = useState('');
    const [seats, setSeats] = useState(1);
    const [classType, setClassType] = useState(CLASSES[0]);
    const [searchResult, setSearchResult] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showSeatModal, setShowSeatModal] = useState(false);
    const [selectedSeat, setSelectedSeat] = useState<string | null>(null);

    const handleSearch = () => {
        if (!from || !to || !travelDate) {
            setError("Please fill all fields!");
            return;
        }
        setError('');
        setLoading(true);
        setSearchResult([]);
        setTimeout(() => {
            const mockData = Array.from({ length: 5 }, (_, i) => ({
                id: i,
                name: `${activeTab.toUpperCase()} ${i + 1}`,
                departure: `${Math.floor(Math.random() * 12 + 6)}:00`,
                arrival: `${Math.floor(Math.random() * 12 + 12)}:30`,
                seatsAvailable: Math.floor(Math.random() * 40 + 1),
                fare: Math.floor(Math.random() * 5000 + 500),
            }));
            setSearchResult(mockData);
            setLoading(false);
        }, 1000);
    };

    const filterOptions = (input: string, list: string[]) =>
        list.filter((v) => v.toLowerCase().includes(input.toLowerCase()));

    return (
        <div className="min-h-screen bg-[#000d1a] text-white font-sans p-6">
            {/* Hero Section */}
            <section className="text-center mb-8">
                <h1 className="text-3xl font-black text-[#e6b800] uppercase tracking-tighter mb-2">
                    GTH PRO <span className="text-white font-light">Travel</span>
                </h1>
                <p className="text-slate-400 text-sm">Hotels, Flights, Trains, Buses, Cars & Tours</p>

                <div className="flex justify-center gap-2 mt-6 flex-wrap">
                    {[
                        { key: 'hotel', label: 'Hotel', icon: <Bed size={18} /> },
                        { key: 'flight', label: 'Flight', icon: <Airplay size={18} /> },
                        { key: 'train', label: 'Train', icon: <Train size={18} /> },
                        { key: 'bus', label: 'Bus', icon: <Bus size={18} /> },
                        { key: 'car', label: 'Car', icon: <Car size={18} /> },
                        { key: 'tour', label: 'Tour', icon: <Globe size={18} /> },
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => { setActiveTab(tab.key); setSearchResult([]); setError(''); }}
                            className={`flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-bold transition-all
                ${activeTab === tab.key ? 'bg-[#e6b800] text-[#000d1a]' : 'bg-[#001a33] text-slate-400 hover:gth-glass/10'}`}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>
            </section>

            {/* Search Form */}
            <div className="max-w-6xl mx-auto bg-[#001a33] p-6 rounded-3xl shadow-xl border border-slate-700 mb-6">
                {error && <div className="text-red-500 mb-2 font-bold">{error}</div>}
                {renderTabForm({ activeTab, from, to, travelDate, seats, classType, setFrom, setTo, setTravelDate, setClassType, setSeats, handleSearch, loading, filterOptions })}
            </div>

            {/* Search Results / Grids */}
            {activeTab === 'hotel' && <HotelGrid />}
            {activeTab === 'car' && <CarGrid />}
            {activeTab === 'tour' && <TourCarousel />}
            {(activeTab === 'train' || activeTab === 'bus' || activeTab === 'flight') && searchResult.length > 0 && (
                <SearchResultsTable
                    activeTab={activeTab}
                    searchResult={searchResult}
                    setShowSeatModal={setShowSeatModal}
                />
            )}

            {/* Seat Modal */}
            {showSeatModal && (
                <SeatSelectionModal
                    selectedSeat={selectedSeat}
                    setSelectedSeat={setSelectedSeat}
                    setShowSeatModal={setShowSeatModal}
                />
            )}

            <div className="mt-12 text-center text-gray-400">
                <p>Powered by GTH | 1% Education Fund</p>
            </div>
        </div>
    );
}

// Tab Form Renderer
function renderTabForm(props: any) {
    const { activeTab, from, to, travelDate, seats, classType, setFrom, setTo, setTravelDate, setClassType, setSeats, handleSearch, loading, filterOptions } = props;
    switch (activeTab) {
        case 'train':
            return <TransportForm options={STATIONS} from={from} to={to} setFrom={setFrom} setTo={setTo} travelDate={travelDate} setTravelDate={setTravelDate} classOptions={CLASSES} classType={classType} setClassType={setClassType} seats={seats} setSeats={setSeats} handleSearch={handleSearch} loading={loading} filterOptions={filterOptions} />;
        case 'bus':
            return <TransportForm options={CITIES} from={from} to={to} setFrom={setFrom} setTo={setTo} travelDate={travelDate} setTravelDate={setTravelDate} classOptions={BUS_TYPES} classType={classType} setClassType={setClassType} seats={seats} setSeats={setSeats} handleSearch={handleSearch} loading={loading} filterOptions={filterOptions} />;
        case 'flight':
            return <TransportForm options={CITIES} from={from} to={to} setFrom={setFrom} setTo={setTo} travelDate={travelDate} setTravelDate={setTravelDate} classOptions={FLIGHT_CLASSES} classType={classType} setClassType={setClassType} seats={seats} setSeats={setSeats} handleSearch={handleSearch} loading={loading} filterOptions={filterOptions} />;
        default:
            return null;
    }
}

// Generic Transport Form
function TransportForm({ options, from, to, setFrom, setTo, travelDate, setTravelDate, classOptions, classType, setClassType, seats, setSeats, handleSearch, loading, filterOptions }: any) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <AutocompleteInput value={from} onChange={setFrom} options={options} placeholder="From" />
            <AutocompleteInput value={to} onChange={setTo} options={options} placeholder="To" />
            <DateInput value={travelDate} onChange={setTravelDate} />
            <SelectInput value={classType} onChange={setClassType} options={classOptions} />
            <SeatsInput value={seats} onChange={setSeats} />
            <SearchButton loading={loading} onClick={handleSearch} />
        </div>
    );
}

// Reusable Inputs
function AutocompleteInput({ value, onChange, options, placeholder }: any) {
    const [showList, setShowList] = useState(false);
    const filtered = options.filter((o: string) => o.toLowerCase().includes(value.toLowerCase()) && value);
    return (
        <div className="relative">
            <input className="bg-[#000d1a] p-3 rounded-lg border border-gray-600 w-full text-sm outline-none" placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} onFocus={() => setShowList(true)} onBlur={() => setTimeout(() => setShowList(false), 100)} />
            {showList && filtered.length > 0 && (
                <ul className="absolute z-10 top-full left-0 right-0 bg-[#1a1f2b] max-h-40 overflow-auto rounded-lg shadow-lg border border-gray-600">
                    {filtered.map((f: string) => (
                        <li key={f} onMouseDown={() => onChange(f)} className="p-2 cursor-pointer hover:bg-[#e6b800] hover:text-black transition-colors">{f}</li>
                    ))}
                </ul>
            )}
        </div>
    );
}

function DateInput({ value, onChange }: any) {
    return (
        <div className="bg-[#000d1a] p-3 rounded-lg flex items-center gap-2 border border-gray-600">
            <Calendar className="text-[#e6b800]" />
            <input type="date" value={value} onChange={e => onChange(e.target.value)} className="bg-transparent outline-none text-sm w-full" />
        </div>
    );
}

function SelectInput({ value, onChange, options }: any) {
    return (
        <div className="bg-[#000d1a] p-3 rounded-lg border border-gray-600">
            <select className="bg-transparent outline-none text-sm w-full" value={value} onChange={e => onChange(e.target.value)}>
                {options.map((o: string) => <option key={o} value={o}>{o}</option>)}
            </select>
        </div>
    );
}

function SeatsInput({ value, onChange }: any) {
    return (
        <div className="bg-[#000d1a] p-3 rounded-lg border border-gray-600 flex items-center">
            <input type="number" min={1} max={10} value={value} onChange={e => onChange(Number(e.target.value))} className="bg-transparent outline-none text-sm w-full" placeholder="Seats" />
        </div>
    );
}

function SearchButton({ loading, onClick }: any) {
    return (
        <button onClick={onClick} className="bg-[#e6b800] text-[#000d1a] font-bold py-3 rounded-xl hover:bg-[#ffcc00] transition-all">
            {loading ? "Searching..." : "Search"}
        </button>
    );
}

// Search Results Table
function SearchResultsTable({ activeTab, searchResult, setShowSeatModal }: any) {
    return (
        <div className="max-w-6xl mx-auto overflow-x-auto">
            <table className="w-full text-sm border-collapse">
                <thead className="bg-[#001a33] text-[#e6b800]">
                    <tr>
                        <th className="p-2 border border-slate-700">{activeTab.toUpperCase()} Name</th>
                        <th className="p-2 border border-slate-700">Departure</th>
                        <th className="p-2 border border-slate-700">Arrival</th>
                        <th className="p-2 border border-slate-700">Seats</th>
                        <th className="p-2 border border-slate-700">Fare</th>
                        <th className="p-2 border border-slate-700">Action</th>
                    </tr>
                </thead>
                <tbody>
                    {searchResult.map((item: SearchItem) => (
                        <tr key={item.id} className="hover:gth-glass/10 transition-colors">
                            <td className="p-2 border border-slate-700">{item.name}</td>
                            <td className="p-2 border border-slate-700">{item.departure}</td>
                            <td className="p-2 border border-slate-700">{item.arrival}</td>
                            <td className="p-2 border border-slate-700">{item.seatsAvailable}</td>
                            <td className="p-2 border border-slate-700">₹{item.fare}</td>
                            <td className="p-2 border border-slate-700">
                                <button
                                    onClick={() => setShowSeatModal(true)}
                                    className="bg-[#e6b800] text-[#000d1a] px-3 py-1 rounded-lg font-bold hover:bg-[#ffcc00]"
                                >
                                    Select Seat
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// Seat Selection Modal
function SeatSelectionModal({ selectedSeat, setSelectedSeat, setShowSeatModal }: any) {
    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="bg-[#001a33] p-6 rounded-2xl w-11/12 md:w-2/3 shadow-xl">
                <h2 className="text-xl font-bold text-[#e6b800] mb-4">Select Seat</h2>
                <div className="grid grid-cols-8 gap-2 mb-4">
                    {Array.from({ length: 40 }, (_, i) => (
                        <button
                            key={i}
                            onClick={() => setSelectedSeat(`S${i + 1}`)}
                            className={`p-2 rounded text-sm font-bold border ${selectedSeat === `S${i + 1}` ? 'bg-[#e6b800] text-black' : 'bg-[#111827] text-white border-gray-600'} hover:bg-[#ffcc00] hover:text-black transition-all`}
                        >
                            S{i + 1}
                        </button>
                    ))}
                </div>
                <div className="flex justify-end gap-4">
                    <button onClick={() => setShowSeatModal(false)} className="px-4 py-2 rounded-lg border border-gray-600">Cancel</button>
                    <button onClick={() => { alert(`Booked Seat: ${selectedSeat}`); setShowSeatModal(false); }} className="px-4 py-2 rounded-lg bg-[#e6b800] text-black hover:bg-[#ffcc00] font-bold">Confirm</button>
                </div>
            </div>
        </div>
    );
}

// Hotel Grid
function HotelGrid() {
    const hotels = Array.from({ length: 8 }, (_, i) => ({
        id: i,
        name: `Hotel ${i + 1}`,
        price: Math.floor(Math.random() * 10000 + 2000),
        image: `https://source.unsplash.com/400x300/?hotel,room,${i}`
    }));
    return (
        <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-6">
            {hotels.map(h => (
                <div key={h.id} className="bg-[#001a33] rounded-2xl overflow-hidden shadow-lg border border-gray-700">
                    <img src={h.image} className="w-full h-40 object-cover" />
                    <div className="p-4">
                        <h3 className="font-bold text-[#e6b800]">{h.name}</h3>
                        <p className="text-slate-400 mt-1">₹{h.price}/night</p>
                    </div>
                </div>
            ))}
        </div>
    );
}

// Car Grid
function CarGrid() {
    const cars = Array.from({ length: 6 }, (_, i) => ({
        id: i,
        name: `Car ${i + 1}`,
        price: Math.floor(Math.random() * 5000 + 500),
        image: `https://source.unsplash.com/400x300/?car,vehicle,${i}`
    }));
    return (
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6">
            {cars.map(c => (
                <div key={c.id} className="bg-[#001a33] rounded-2xl overflow-hidden shadow-lg border border-gray-700">
                    <img src={c.image} className="w-full h-40 object-cover" />
                    <div className="p-4">
                        <h3 className="font-bold text-[#e6b800]">{c.name}</h3>
                        <p className="text-slate-400 mt-1">₹{c.price}/day</p>
                    </div>
                </div>
            ))}
        </div>
    );
}

// Tour Carousel
function TourCarousel() {
    const tours = Array.from({ length: 6 }, (_, i) => ({
        id: i,
        name: `Tour ${i + 1}`,
        price: Math.floor(Math.random() * 15000 + 2000),
        image: `https://source.unsplash.com/400x300/?tour,travel,${i}`
    }));
    return (
        <div className="max-w-6xl mx-auto flex overflow-x-auto gap-6 py-4">
            {tours.map(t => (
                <div key={t.id} className="min-w-[250px] bg-[#001a33] rounded-2xl overflow-hidden shadow-lg border border-gray-700 flex-shrink-0">
                    <img src={t.image} className="w-full h-40 object-cover" />
                    <div className="p-4">
                        <h3 className="font-bold text-[#e6b800]">{t.name}</h3>
                        <p className="text-slate-400 mt-1">₹{t.price}/package</p>
                    </div>
                </div>
            ))}
        </div>
    );
}