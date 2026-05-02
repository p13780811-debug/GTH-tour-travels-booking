"use client"

export default function FiltersSheet({ open, onClose, setQuery }: any) {
    if (!open) return null

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">

            <div className="gth-glass w-full rounded-t-2xl p-4">

                <h2 className="font-bold mb-4">Filters</h2>

                <button
                    onClick={() => setQuery("2bhk")}
                    className="w-full gth-glass-200 p-2 rounded mb-2"
                >
                    2 BHK
                </button>

                <button
                    onClick={() => setQuery("under 5000000")}
                    className="w-full gth-glass-200 p-2 rounded"
                >
                    Under 50L
                </button>

                <button
                    onClick={onClose}
                    className="mt-4 w-full bg-black text-white p-2 rounded"
                >
                    Close
                </button>
            </div>
        </div>
    )
}