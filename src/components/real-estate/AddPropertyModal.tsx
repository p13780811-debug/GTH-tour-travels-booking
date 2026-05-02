"use client"

import { useState } from "react"
import { Upload, Sparkles, X } from "lucide-react"
import styles from "@/app/real-estate/RealEstate.module.css"

export default function AddPropertyModal({ onSave, onClose }: any) {
    const [form, setForm] = useState<any>({})
    const [preview, setPreview] = useState<string | null>(null)
    const [file, setFile] = useState<File | null>(null)

    const [loading, setLoading] = useState(false)
    const [aiLoading, setAiLoading] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState(false)

    const [files, setFiles] = useState<File[]>([])
    const [previews, setPreviews] = useState<string[]>([])

    // 📸 MULTI IMAGE
    const handleImages = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files ? Array.from(e.target.files) : []

        setFiles(selected)

        const previewUrls = selected.map((f) =>
            URL.createObjectURL(f)
        )

        setPreviews(previewUrls)
    }

    // ❌ REMOVE IMAGE
    const removeImage = (index: number) => {
        const newFiles = files.filter((_, i) => i !== index)
        const newPreviews = previews.filter((_, i) => i !== index)

        setFiles(newFiles)
        setPreviews(newPreviews)
    }

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

                const MAX_WIDTH = 800
                const scale = MAX_WIDTH / img.width

                canvas.width = MAX_WIDTH
                canvas.height = img.height * scale

                ctx?.drawImage(img, 0, 0, canvas.width, canvas.height)

                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            resolve(new File([blob], file.name, { type: "image/jpeg" }))
                        }
                    },
                    "image/jpeg",
                    0.7 // compression quality
                )
            }

            reader.readAsDataURL(file)
        })
    }

    // 🤖 AI AUTO FILL
    const runAI = async () => {
        if (!form.title && !form.location) {
            setError("Enter title or location for AI help")
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
                    `Premium property in ${form.location || "prime area"}`,
                price: prev.price || data?.price || "",
            }))
        } catch {
            setError("AI failed, try manually")
        } finally {
            setAiLoading(false)
        }
    }

    const detectType = (name: string) => {
        const n = name.toLowerCase()

        if (n.includes("villa")) return "villa"
        if (n.includes("flat") || n.includes("apartment")) return "apartment"
        if (n.includes("office")) return "commercial"

        return "property"
    }
    const type = detectType(form.title || "")



    // 💾 SAVE
    const handleSave = async () => {
        if (!form.title || !form.location || !form.price) {
            setError("⚠️ Required fields missing")
            return
        }
        await onSave({
            ...form,
            type,
        })

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

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end md:items-center justify-center">

            <div className={`${styles.glassCard} w-full md:w-[500px] rounded-t-2xl md:rounded-2xl`}>

                {/* HEADER */}
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold">Add Property</h2>
                    <button onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>

                {/* IMAGE UPLOAD */}
                <label className="block border border-dashed border-white/20 rounded-xl p-4 text-center cursor-pointer mb-4">
                    <div className="text-gray-400 text-sm flex flex-col items-center gap-2">
                        <Upload size={20} />
                        Upload Images (Multiple)
                    </div>

                    <input
                        type="file"
                        accept="image/*"
                        multiple
                        hidden
                        onChange={handleImages}
                    />
                </label>

                {/* PREVIEW GRID */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                    {previews.map((src, i) => (
                        <div key={i} className="relative">
                            <img src={src} className="h-24 w-full object-cover rounded" />
                            <button
                                onClick={() => removeImage(i)}
                                className="absolute top-1 right-1 bg-black/70 p-1 rounded"
                            >
                                ❌
                            </button>
                        </div>
                    ))}
                </div>

                {/* INPUTS */}
                <input
                    placeholder="Title"
                    className="w-full mb-2 p-2 rounded bg-black/40 border border-white/10"
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                />

                <input
                    placeholder="Location"
                    className="w-full mb-2 p-2 rounded bg-black/40 border border-white/10"
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                />

                <input
                    placeholder="Price"
                    type="number"
                    className="w-full mb-2 p-2 rounded bg-black/40 border border-white/10"
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                />

                <textarea
                    placeholder="Description (optional)"
                    className="w-full mb-3 p-2 rounded bg-black/40 border border-white/10"
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                />

                {/* AI BUTTON */}
                <button
                    onClick={runAI}
                    className="w-full mb-3 bg-gradient-to-r from-cyan-400 to-blue-500 text-black py-2 rounded font-bold flex items-center justify-center gap-2"
                >
                    <Sparkles size={16} />
                    {aiLoading ? "AI Thinking..." : "Auto Fill with AI"}
                </button>

                {/* ERRORS */}
                {error && <p className="text-red-400 text-sm mb-2">{error}</p>}
                {success && <p className="text-green-400 text-sm mb-2">✅ Added Successfully</p>}

                {/* SAVE */}
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="w-full gth-glass text-black py-2 rounded font-bold"
                >
                    {loading ? "Saving..." : "Save Property"}
                </button>

            </div>
        </div>
    )
}