    "use client"

    import { useEffect, useRef, useState } from "react"
    import * as pdfjsLib from "pdfjs-dist"
    import { Button } from "@/components/ui/button"
    import { ChevronLeft, ChevronRight, Loader2, ZoomIn, ZoomOut } from "lucide-react"

    // Worker pdf.js chargé depuis un CDN (version synchronisée automatiquement)
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`

    interface PdfViewerProps {
    url: string
    }

    export function PdfViewer({ url }: PdfViewerProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const pdfRef = useRef<pdfjsLib.PDFDocumentProxy | null>(null)
    const loadingRef = useRef(false)

    const [numPages, setNumPages] = useState(0)
    const [pageNumber, setPageNumber] = useState(1)
    const [scale, setScale] = useState(1.2)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    /* ---------- Chargement du document ---------- */
    useEffect(() => {
        let cancelled = false
        loadingRef.current = true

        // pdfjs-dist v6 attend un objet DocumentInitParameters
        pdfjsLib
        .getDocument({ url })
        .promise.then((pdf) => {
            if (cancelled) return
            pdfRef.current = pdf
            setNumPages(pdf.numPages)
            loadingRef.current = false
            setLoading(false)
            setError(null)
        })
        .catch((err) => {
            if (!cancelled) {
            loadingRef.current = false
            setLoading(false)
            setError("Impossible de charger le PDF.")
            console.error("Erreur PDF:", err)
            }
        })

        return () => {
        cancelled = true
        }
    }, [url])

    /* ---------- Rendu de la page sur canvas (lecture seule) ---------- */
    useEffect(() => {
        const pdf = pdfRef.current
        const canvas = canvasRef.current
        if (!pdf || !canvas || loadingRef.current || error) return

        let cancelled = false

        pdf.getPage(pageNumber).then((page) => {
        if (cancelled) return
        const viewport = page.getViewport({ scale })
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        canvas.height = viewport.height
        canvas.width = viewport.width

        // pdfjs-dist v6 nécessite `canvas` au lieu de `canvasContext`
        page.render({ canvas, viewport }).promise.catch((err) => {
            console.error("Erreur rendu page:", err)
        })
        })

        return () => {
        cancelled = true
        }
    }, [pageNumber, scale, loading, error, numPages])

    return (
        <div
        className="flex h-full flex-col bg-slate-800"
        onContextMenu={(e) => e.preventDefault()}
        >
        {/* Barre d'outils maison (lecture seule) */}
        <div className="flex flex-wrap items-center justify-center gap-2 border-b border-slate-700 bg-slate-900 px-4 py-2">
            <Button
            size="sm"
            variant="ghost"
            disabled={pageNumber <= 1}
            onClick={() => setPageNumber((p) => p - 1)}
            className="text-slate-300 hover:bg-slate-800 hover:text-white"
            >
            <ChevronLeft className="h-4 w-4" />
            </Button>

            <span className="text-sm text-slate-300">
            Page {pageNumber} / {numPages || "…"}
            </span>

            <Button
            size="sm"
            variant="ghost"
            disabled={pageNumber >= numPages}
            onClick={() => setPageNumber((p) => p + 1)}
            className="text-slate-300 hover:bg-slate-800 hover:text-white"
            >
            <ChevronRight className="h-4 w-4" />
            </Button>

            <div className="mx-2 h-5 w-px bg-slate-700" />

            <Button
            size="sm"
            variant="ghost"
            onClick={() => setScale((s) => Math.max(0.5, s - 0.25))}
            className="text-slate-300 hover:bg-slate-800 hover:text-white"
            >
            <ZoomOut className="h-4 w-4" />
            </Button>

            <span className="w-12 text-center text-xs text-slate-400">
            {Math.round(scale * 100)}%
            </span>

            <Button
            size="sm"
            variant="ghost"
            onClick={() => setScale((s) => Math.min(2.5, s + 0.25))}
            className="text-slate-300 hover:bg-slate-800 hover:text-white"
            >
            <ZoomIn className="h-4 w-4" />
            </Button>
        </div>

        {/* Zone de rendu */}
        <div className="flex flex-1 justify-center overflow-auto p-4">
            {loading ? (
            <div className="flex items-center gap-2 text-slate-300">
                <Loader2 className="h-5 w-5 animate-spin" />
                Chargement du document...
            </div>
            ) : error ? (
            <p className="text-red-400">{error}</p>
            ) : (
            <canvas
                ref={canvasRef}
                className="max-w-full rounded-md shadow-2xl"
            />
            )}
        </div>
        </div>
    )
    }