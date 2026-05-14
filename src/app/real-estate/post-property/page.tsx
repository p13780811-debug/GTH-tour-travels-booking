"use client"

import { useState } from "react"

import {
    Upload,
    IndianRupee,
    MapPin,
    Home,
    FileText,
    BedDouble,
} from "lucide-react"

export default function PostPropertyPage() {

    const [loading, setLoading] = useState(false)

    async function handleSubmit(
        e: React.FormEvent<HTMLFormElement>
    ) {

        e.preventDefault()

        setLoading(true)

        await new Promise(resolve =>
            setTimeout(resolve, 1500)
        )

        setLoading(false)

        alert("Property Posted Successfully 🚀")
    }

    return (

        <main
            className="
                min-h-screen
                gth-container
                px-4
                py-24
            "
        >

            <div
                className="
                    max-w-3xl
                    mx-auto
                    gth-glass-ultra
                    rounded-[32px]
                    p-5
                    md:p-8
                "
            >

                {/* HEADER */}

                <div className="mb-8">

                    <div
                        className="
                            gth-badge
                            gth-badge-gold
                            mb-4
                        "
                    >
                        Post New Property
                    </div>

                    <h1 className="gth-title">
                        List Your Property
                    </h1>

                    <p className="gth-sub mt-3">
                        Reach premium buyers & tenants
                        with the GTH luxury ecosystem.
                    </p>

                </div>

                {/* FORM */}

                <form
                    onSubmit={handleSubmit}
                    className="gth-stack"
                >

                    {/* TITLE */}

                    <div className="gth-stack">

                        <label className="font-semibold">
                            Property Title
                        </label>

                        <div
                            className="
                                gth-glass
                                flex
                                items-center
                                gap-3
                                px-4
                                py-3
                            "
                        >

                            <Home
                                size={18}
                                opacity={0.7}
                            />

                            <input
                                type="text"
                                required
                                placeholder="Luxury 3BHK Apartment..."
                                className="
                                    bg-transparent
                                    outline-none
                                    w-full
                                "
                            />

                        </div>

                    </div>

                    {/* PRICE */}

                    <div className="gth-stack">

                        <label className="font-semibold">
                            Price
                        </label>

                        <div
                            className="
                                gth-glass
                                flex
                                items-center
                                gap-3
                                px-4
                                py-3
                            "
                        >

                            <IndianRupee
                                size={18}
                                opacity={0.7}
                            />

                            <input
                                type="number"
                                required
                                placeholder="8500000"
                                className="
                                    bg-transparent
                                    outline-none
                                    w-full
                                "
                            />

                        </div>

                    </div>

                    {/* LOCATION */}

                    <div className="gth-stack">

                        <label className="font-semibold">
                            Location
                        </label>

                        <div
                            className="
                                gth-glass
                                flex
                                items-center
                                gap-3
                                px-4
                                py-3
                            "
                        >

                            <MapPin
                                size={18}
                                opacity={0.7}
                            />

                            <input
                                type="text"
                                required
                                placeholder="Mumbai"
                                className="
                                    bg-transparent
                                    outline-none
                                    w-full
                                "
                            />

                        </div>

                    </div>

                    {/* GRID */}

                    <div
                        className="
                            grid
                            md:grid-cols-2
                            gap-4
                        "
                    >

                        {/* TYPE */}

                        <div className="gth-stack">

                            <label className="font-semibold">
                                Property Type
                            </label>

                            <select
                                className="
                                    gth-input
                                "
                            >

                                <option>
                                    Apartment
                                </option>

                                <option>
                                    Villa
                                </option>

                                <option>
                                    Plot
                                </option>

                                <option>
                                    Commercial
                                </option>

                            </select>

                        </div>

                        {/* BHK */}

                        <div className="gth-stack">

                            <label className="font-semibold">
                                BHK
                            </label>

                            <div
                                className="
                                    gth-glass
                                    flex
                                    items-center
                                    gap-3
                                    px-4
                                    py-3
                                "
                            >

                                <BedDouble
                                    size={18}
                                    opacity={0.7}
                                />

                                <input
                                    type="text"
                                    placeholder="3 BHK"
                                    className="
                                        bg-transparent
                                        outline-none
                                        w-full
                                    "
                                />

                            </div>

                        </div>

                    </div>

                    {/* PURPOSE */}

                    <div className="gth-stack">

                        <label className="font-semibold">
                            Listing Purpose
                        </label>

                        <div
                            className="
                                flex
                                gap-3
                            "
                        >

                            <button
                                type="button"
                                className="
                                    gth-btn
                                    flex-1
                                "
                            >
                                Buy
                            </button>

                            <button
                                type="button"
                                className="
                                    gth-glass
                                    flex-1
                                    py-3
                                    font-semibold
                                "
                            >
                                Rent
                            </button>

                        </div>

                    </div>

                    {/* DESCRIPTION */}

                    <div className="gth-stack">

                        <label className="font-semibold">
                            Description
                        </label>

                        <div
                            className="
                                gth-glass
                                flex
                                gap-3
                                p-4
                            "
                        >

                            <FileText
                                size={18}
                                opacity={0.7}
                                className="mt-1"
                            />

                            <textarea
                                rows={5}
                                placeholder="Write property details..."
                                className="
                                    bg-transparent
                                    outline-none
                                    w-full
                                    resize-none
                                "
                            />

                        </div>

                    </div>

                    {/* IMAGE */}

                    <div className="gth-stack">

                        <label className="font-semibold">
                            Upload Images
                        </label>

                        <label
                            className="
                                gth-glass
                                rounded-[24px]
                                p-8
                                flex
                                flex-col
                                items-center
                                justify-center
                                text-center
                                cursor-pointer
                            "
                        >

                            <Upload
                                size={34}
                                opacity={0.75}
                            />

                            <p className="mt-3 font-semibold">
                                Click to Upload
                            </p>

                            <span className="gth-sub">
                                JPG, PNG supported
                            </span>

                            <input
                                type="file"
                                multiple
                                hidden
                            />

                        </label>

                    </div>

                    {/* SUBMIT */}

                    <button
                        type="submit"
                        disabled={loading}
                        className="
                            gth-btn-gold
                            py-4
                            text-base
                            mt-3
                        "
                    >

                        {loading
                            ? "Posting..."
                            : "Post Property"}

                    </button>

                </form>

            </div>

        </main>
    )
}