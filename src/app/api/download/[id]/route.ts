    import { NextRequest, NextResponse } from "next/server"
    import { getSupabaseAdmin } from "@/lib/supabase/admin"

    const DIGITAL_BUCKET = "digital-resources"

    export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
    ) {
    try {
        const { id } = await params
        const supabaseAdmin = getSupabaseAdmin()

        const { data: resource, error: dbError } = await supabaseAdmin
        .from("digital_resources")
        .select("id, title, url, type, downloadable")
        .eq("id", id)
        .maybeSingle()

        if (dbError || !resource) {
        return NextResponse.json({ error: "Ressource introuvable" }, { status: 404 })
        }

        if (!resource.downloadable) {
        return NextResponse.json(
            { error: "Le téléchargement n'est pas autorisé pour cette ressource." },
            { status: 403 }
        )
        }

        const storageBase = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${DIGITAL_BUCKET}/`
        let filePath = resource.url

        if (filePath.startsWith(storageBase)) {
        filePath = filePath.replace(storageBase, "")
        } else if (filePath.startsWith("/")) {
        filePath = filePath.slice(1)
        }

        const { data: fileData, error: downloadError } = await supabaseAdmin.storage
        .from(DIGITAL_BUCKET)
        .download(filePath)

        if (downloadError || !fileData) {
        console.error("Erreur download:", downloadError)
        return NextResponse.json(
            { error: "Impossible de télécharger le fichier" },
            { status: 500 }
        )
        }

        const arrayBuffer = await fileData.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        const ext = filePath.split(".").pop()?.toLowerCase() || "bin"
        const mimeTypes: Record<string, string> = {
        pdf: "application/pdf",
        doc: "application/msword",
        docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ppt: "application/vnd.ms-powerpoint",
        pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        xls: "application/vnd.ms-excel",
        xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        mp3: "audio/mpeg",
        mp4: "video/mp4",
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        png: "image/png",
        gif: "image/gif",
        webp: "image/webp",
        epub: "application/epub+zip",
        }
        const contentType = mimeTypes[ext] || "application/octet-stream"

        const safeName = (resource.title || "document")
        .replace(/[^a-zA-Z0-9À-ÿ\s-]/g, "")
        .replace(/\s+/g, "_")
        .substring(0, 100)
        const filename = `${safeName}.${ext}`

        return new NextResponse(buffer, {
        status: 200,
        headers: {
            "Content-Type": contentType,
            "Content-Disposition": `attachment; filename="${filename}"`,
            "Content-Length": buffer.length.toString(),
            "Cache-Control": "public, max-age=3600",
        },
        })
    } catch (err) {
        console.error("Erreur téléchargement:", err)
        return NextResponse.json(
        { error: "Erreur serveur lors du téléchargement" },
        { status: 500 }
        )
    }
    }