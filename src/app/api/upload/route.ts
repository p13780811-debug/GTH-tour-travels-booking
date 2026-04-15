import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import sharp from "sharp"

export async function POST(req: Request) {
    try {
        const formData = await req.formData()
        const file = formData.get("file") as File

        if (!file) {
            return NextResponse.json({ error: "No file" }, { status: 400 })
        }

        // 🔄 Convert to buffer
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        // 🧠 Convert to WebP + compress
        const webpBuffer = await sharp(buffer)
            .resize({ width: 800 }) // resize
            .webp({ quality: 70 }) // compression
            .toBuffer()

        // 🔑 filename
        const fileName = `${Date.now()}.webp`
        const filePath = `properties/${fileName}`

        // 📤 upload
        const { error } = await supabase.storage
            .from("property-images")
            .upload(filePath, webpBuffer, {
                contentType: "image/webp",
            })

        if (error) throw error

        const { data } = supabase.storage
            .from("property-images")
            .getPublicUrl(filePath)

        return NextResponse.json({ url: data.publicUrl })

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}