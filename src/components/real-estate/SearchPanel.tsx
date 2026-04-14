export default function SearchPanel({ setQuery }: any) {
    return (
        <div className="p-4 bg-gray-100 flex gap-2">
            <button onClick={() => setQuery("under 50 lakh")}>
                Under 50L
            </button>

            <button onClick={() => setQuery("2bhk")}>
                2BHK
            </button>

            <button onClick={() => setQuery("villa")}>
                Villas
            </button>
        </div>
    )
}