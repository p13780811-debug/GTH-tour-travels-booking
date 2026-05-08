"use client"

import { useState } from "react"
import {
    Upload,
    Sparkles,
    X,
    MapPin,
    IndianRupee,
    Building2,
    ImagePlus,
    Loader2
} from "lucide-react"

export default function AddPropertyModal({ onSave, onClose }: any) {

    const [form, setForm] = useState<any>({})
    const [loading, setLoading] = useState(false)
    const [aiLoading, setAiLoading] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState(false)

    const [files, setFiles] = useState<File[]>([])
    const [previews, setPreviews] = useState<string[]>([])

    // =========================
    // 📸 MULTI IMAGE
    // =========================

    const handleImages = (e: React.ChangeEvent<HTMLInputElement>) => {

        const selected = e.target.files
            ? Array.from(e.target.files)
            : []

        setFiles(selected)

        const previewUrls = selected.map((f) =>
            URL.createObjectURL(f)
        )

        setPreviews(previewUrls)
    }

    // =========================
    // ❌ REMOVE
    // =========================

    const removeImage = (index: number) => {

        const newFiles = files.filter((_, i) => i !== index)
        const newPreviews = previews.filter((_, i) => i !== index)

        setFiles(newFiles)
        setPreviews(newPreviews)
    }

    // =========================
    // 🗜️ IMAGE COMPRESS
    // =========================

    const compressImage = (file: File): Promise<File> => {

        return new Promise((resolve) => {

            const img = new Image()
            const reader = new FileReader()

            reader.onload = (e: any) => {
                img.src = e.target.result
            }

            img.onload = () => {

                const canvas = document.createElement("canvas")
                const ctx = canvas.getContext("2d")

                const MAX_WIDTH = 1200
                const scale = MAX_WIDTH / img.width

                canvas.width = MAX_WIDTH
                canvas.height = img.height * scale

                ctx?.drawImage(img, 0, 0, canvas.width, canvas.height)

                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            resolve(
                                new File(
                                    [blob],
                                    file.name,
                                    { type: "image/jpeg" }
                                )
                            )
                        }
                    },
                    "image/jpeg",
                    0.75
                )
            }

            reader.readAsDataURL(file)
        })
    }

    // =========================
    // 🤖 AI
    // =========================

    const runAI = async () => {

        if (!form.title && !form.location) {
            setError("Enter title or location first")
            return
        }

        try {

            setAiLoading(true)
            setError("")

            const res = await fetch("/api/ai-search", {
                method: "POST",
                body: JSON.stringify({
                    query: `${form.title || ""} ${form.location || ""}`,
                }),
            })

            const data = await res.json()

            setForm((prev: any) => ({
                ...prev,
                description:
                    data?.description ||
                    `Luxury property in ${form.location || "prime location"}`,
                price:
                    prev.price || data?.price || "",
            }))

        } catch {

            setError("AI failed. Fill manually.")

        } finally {

            setAiLoading(false)
        }
    }

    // =========================
    // 🧠 TYPE DETECT
    // =========================

    const detectType = (name: string) => {

        const n = name.toLowerCase()

        if (n.includes("villa")) return "villa"
        if (n.includes("flat")) return "apartment"
        if (n.includes("office")) return "commercial"

        return "property"
    }

    const type = detectType(form.title || "")

    // =========================
    // 💾 SAVE
    // =========================

    const handleSave = async () => {

        if (!form.title || !form.location || !form.price) {

            setError("Required fields missing")
            return
        }

        try {

            setLoading(true)
            setError("")

            let imageUrls: string[] = []

            if (files.length > 0) {

                for (let file of files) {

                    const compressed = await compressImage(file)

                    const body = new FormData()
                    body.append("file", compressed)

                    const res = await fetch("/api/upload", {
                        method: "POST",
                        body,
                    })

                    const data = await res.json()

                    imageUrls.push(data.url)
                }
            }

            await onSave({
                ...form,
                type,
                images: imageUrls,
                image: imageUrls[0] || "",
            })

            setSuccess(true)

            setTimeout(() => {
                onClose()
            }, 1200)

        } catch (err: any) {

            setError(err.message || "Save failed")

        } finally {

            setLoading(false)
        }
    }

    // =========================
    // UI
    // =========================

    return (

        <div className="fixed inset-0 z-[999] bg-black/70 backdrop-blur-md flex items-end md:items-center justify-center p-0 md:p-6">

            {/* MODAL */}
            <div className="relative w-full md:max-w-2xl rounded-t-[28px] md:rounded-[32px] gth-glass border border-white/10 overflow-hidden animate-in slide-in-from-bottom duration-300">

                {/* ✨ Glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--gold)]/[0.05] via-transparent to-cyan-400/[0.03]" />

                {/* HEADER */}
                <div className="relative z-10 flex items-center justify-between px-5 py-4 border-b border-white/10">

                    <div>
                        <h2 className="text-xl font-black text-[var(--text)]">
                            Add Property
                        </h2>

                        <p className="text-xs text-[var(--muted)] mt-1">
                            Upload premium listings with AI assistance
                        </p>
                    </div>

                    <button
                        onClick={onClose}
                        className="h-10 w-10 rounded-full gth-glass flex items-center justify-center hover:scale-105 transition"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* BODY */}
                <div className="relative z-10 p-5 space-y-4 max-h-[85vh] overflow-y-auto">

                    {/* UPLOAD */}
                    <label className="relative block border border-dashed border-white/15 rounded-2xl p-8 text-center cursor-pointer transition hover:border-[var(--gold)]/40 hover:bg-white/[0.03]">

                        <div className="flex flex-col items-center gap-3">

                            <div className="h-14 w-14 rounded-2xl gth-glass flex items-center justify-center">
                                <ImagePlus size={24} />
                            </div>

                            <div>
                                <h3 className="font-bold text-sm">
                                    Upload Property Images
                                </h3>

                                <p className="text-xs text-[var(--muted)] mt-1">
                                    Multiple high-quality photos supported
                                </p>
                            </div>
                        </div>

                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            hidden
                            onChange={handleImages}
                        />
                    </label>

                    {/* PREVIEW */}
                    {previews.length > 0 && (

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">

                            {previews.map((src, i) => (

                                <div
                                    key={i}
                                    className="relative overflow-hidden rounded-2xl border border-white/10 group"
                                >

                                    <img
                                        src={src}
                                        className="h-32 w-full object-cover transition duration-500 group-hover:scale-105"
                                    />

                                    <button
                                        onClick={() => removeImage(i)}
                                        className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/70 backdrop-blur flex items-center justify-center"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* INPUTS */}
                    <div className="grid md:grid-cols-2 gap-4">

                        <div className="gth-glass rounded-2xl p-3">
                            <div className="flex items-center gap-2 mb-2 text-xs text-[var(--muted)]">
                                <Building2 size={14} />
                                Property Title
                            </div>

                            <input
                                placeholder="Luxury Villa..."
                                className="w-full bg-transparent outline-none text-sm"
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        title: e.target.value
                                    })
                                }
                            />
                        </div>

                        <div className="gth-glass rounded-2xl p-3">
                            <div className="flex items-center gap-2 mb-2 text-xs text-[var(--muted)]">
                                <MapPin size={14} />
                                Location
                            </div>

                            <input
                                placeholder="Mumbai, Delhi..."
                                className="w-full bg-transparent outline-none text-sm"
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        location: e.target.value
                                    })
                                }
                            />
                        </div>

                    </div>

                    {/* PRICE */}
                    <div className="gth-glass rounded-2xl p-3">

                        <div className="flex items-center gap-2 mb-2 text-xs text-[var(--muted)]">
                            <IndianRupee size={14} />
                            Price
                        </div>

                        <input
                            type="number"
                            placeholder="25000000"
                            className="w-full bg-transparent outline-none text-sm"
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    price: e.target.value
                                })
                            }
                        />
                    </div>

                    {/* DESCRIPTION */}
                    <div className="gth-glass rounded-2xl p-3">

                        <div className="text-xs text-[var(--muted)] mb-2">
                            Description
                        </div>

                        <textarea
                            rows={4}
                            placeholder="Describe your property..."
                            className="w-full bg-transparent outline-none resize-none text-sm"
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    description: e.target.value
                                })
                            }
                        />
                    </div>

                    {/* AI */}
                    <button
                        onClick={runAI}
                        className="w-full h-12 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-black flex items-center justify-center gap-2 hover:scale-[1.01] transition-all"
                    >

                        {aiLoading ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                AI Thinking...
                            </>
                        ) : (
                            <>
                                <Sparkles size={16} />
                                Auto Fill with AI
                            </>
                        )}
                    </button>

                    {/* ERROR */}
                    {error && (
                        <div className="text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {/* SUCCESS */}
                    {success && (
                        <div className="text-green-400 text-sm">
                            ✅ Property Added Successfully
                        </div>
                    )}

                    {/* SAVE */}
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="w-full h-14 rounded-2xl bg-gradient-to-r from-[#bf953f] via-[#fcf6ba] to-[#b38728] text-black font-black text-sm tracking-wide hover:scale-[1.01] transition-all shadow-[0_10px_30px_rgba(212,175,55,0.25)]"
                    >

                        {loading ? (
                            <div className="flex items-center justify-center gap-2">
                                <Loader2 size={18} className="animate-spin" />
                                Saving Property...
                            </div>
                        ) : (
                            "SAVE PROPERTY"
                        )}
                    </button>

                </div>
            </div>
        </div>
    )
}