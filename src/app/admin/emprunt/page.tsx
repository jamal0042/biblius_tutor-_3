    "use client"

    import { useEffect, useState, useCallback } from "react"
    import { createClient } from "@/lib/supabase/client"
    import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
    import { Button } from "@/components/ui/button"
    import { Badge } from "@/components/ui/badge"
    import { Input } from "@/components/ui/input"
    import {
        ArrowLeft,
        BookOpen,
        RotateCcw,
        Search,
        Clock,
        X,
        UserRound,
        Plus,
        ScanLine,
        CheckCircle2,
        Users,
        CalendarDays,
        Trash2,
        ChevronRight,
        Loader2,
    } from "lucide-react"
    import Link from "next/link"

    const EXTENSION_DAYS = 7

    type MaybeArray<T> = T | T[] | null

    interface AuteurData {
        id: string
        name: string
    }

    interface MemberData {
        id: string
        first_name: string
        last_name: string
        email: string
    }

    interface DocumentData {
        id: string
        title: string
        auteurs: MaybeArray<AuteurData>
    }

    interface LocationData {
        id: string
        name: string
        code: string
    }

    interface ExemplaireData {
        id: string
        barcode: string
        status: string
    }

    interface MemberOption {
        id: string
        first_name: string
        last_name: string
        email: string
        max_loans: number
        phone?: string | null
        matricule?: string | null
        department?: string | null
    }

    interface ExemplaireOption {
        id: string
        barcode: string
        document_id: string
        status: string
        location_id?: string | null
        documents: MaybeArray<DocumentData>
        locations: MaybeArray<LocationData>
    }

    interface ActiveLoan {
        id: string
        loan_date: string
        due_date: string
        exemplaire_id: string
        members: MaybeArray<MemberData>
        exemplaires: MaybeArray<ExemplaireData & { documents: MaybeArray<DocumentData> }>
    }

    function toSingle<T>(rel: MaybeArray<T>): T | null {
        if (!rel) return null
        if (Array.isArray(rel)) return rel[0] ?? null
        return rel
    }

    function getAuthorName(doc: DocumentData | null | undefined): string {
        if (!doc) return "Auteur inconnu"

        const auteur = toSingle(doc.auteurs)

        return auteur?.name || "Auteur inconnu"
    }

    function getLocationName(
        ex: ExemplaireOption | null | undefined
    ): string {
        if (!ex) return "—"

        const loc = toSingle(ex.locations)

        return loc ? `${loc.name} (${loc.code})` : "—"
    }

    function formatDate(date: string) {
        return new Date(date).toLocaleDateString("fr-FR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        })
    }

    function getDefaultDueDate() {
        const date = new Date()
        date.setDate(date.getDate() + EXTENSION_DAYS)

        return date.toISOString().split("T")[0]
    }

    export default function AdminEmpruntPage() {
        const supabase = createClient()

        /* =========================================================
        DONNÉES
        ========================================================= */

        const [members, setMembers] = useState<MemberOption[]>([])
        const [documents, setDocuments] = useState<DocumentData[]>([])
        const [availableExemplaires, setAvailableExemplaires] = useState<
            ExemplaireOption[]
        >([])
        const [loans, setLoans] = useState<ActiveLoan[]>([])

        const [loading, setLoading] = useState(true)
        const [saving, setSaving] = useState(false)

        /* =========================================================
        FORMULAIRE
        ========================================================= */

        const [memberId, setMemberId] = useState("")
        const [documentId, setDocumentId] = useState("")
        const [barcodeInput, setBarcodeInput] = useState("")
        const [dueDate, setDueDate] = useState(getDefaultDueDate())

        /* =========================================================
        PANIER D'EMPRUNTS
        ========================================================= */

        const [pendingLoans, setPendingLoans] = useState<
            ExemplaireOption[]
        >([])

        /* =========================================================
        RECHERCHE
        ========================================================= */

        const [exemplaireSearch, setExemplaireSearch] = useState("")

        /* =========================================================
        RETOUR
        ========================================================= */

        const [returnLoan, setReturnLoan] =
            useState<ActiveLoan | null>(null)

        const [condition, setCondition] = useState("good")
        const [notes, setNotes] = useState("")

        const selectedMember =
            members.find((m) => m.id === memberId) || null

        /* =========================================================
        CHARGEMENT
        ========================================================= */

        const loadData = useCallback(async () => {
            setLoading(true)

            try {
                const [
                    membersResult,
                    documentsResult,
                    exemplairesResult,
                    loansResult,
                ] = await Promise.all([
                    supabase
                        .from("members")
                        .select(
                            "id, first_name, last_name, email, phone, matricule, department, max_loans"
                        )
                        .eq("status", "active")
                        .order("last_name", { ascending: true }),

                    supabase
                        .from("documents")
                        .select(
                            "id, title, auteurs (id, name)"
                        )
                        .order("title", {
                            ascending: true,
                        }),

                    supabase
                        .from("exemplaires")
                        .select(
                            `
                            id,
                            barcode,
                            document_id,
                            status,
                            location_id,
                            documents (
                                id,
                                title,
                                auteurs (id, name)
                            ),
                            locations (
                                id,
                                name,
                                code
                            )
                        `
                        )
                        .eq("status", "available")
                        .order("barcode", {
                            ascending: true,
                        }),

                    supabase
                        .from("prets")
                        .select(
                            `
                            id,
                            loan_date,
                            due_date,
                            exemplaire_id,
                            members (
                                id,
                                first_name,
                                last_name,
                                email
                            ),
                            exemplaires (
                                id,
                                barcode,
                                status,
                                documents (
                                    id,
                                    title,
                                    auteurs (id, name)
                                )
                            )
                        `
                        )
                        .in("status", ["active", "overdue"])
                        .order("due_date", {
                            ascending: true,
                        }),
                ])

                setMembers(
                    (membersResult.data as unknown as MemberOption[]) || []
                )

                setDocuments(
                    (documentsResult.data as unknown as DocumentData[]) || []
                )

                setAvailableExemplaires(
                    (exemplairesResult.data as unknown as ExemplaireOption[]) ||
                        []
                )

                setLoans(
                    (loansResult.data as unknown as ActiveLoan[]) || []
                )
            } finally {
                setLoading(false)
            }
        }, [supabase])

        useEffect(() => {
            const timeout = window.setTimeout(() => {
                void loadData()
            }, 0)

            return () => window.clearTimeout(timeout)
        }, [loadData])

        /* =========================================================
        EXEMPLAIRES FILTRÉS
        ========================================================= */

        const filteredExemplaires = documentId
            ? availableExemplaires.filter(
                (ex) => ex.document_id === documentId
            )
            : availableExemplaires

        const displayedExemplaires = filteredExemplaires.filter((ex) => {
            const q = exemplaireSearch.trim().toLowerCase()

            if (!q) return true

            const doc = toSingle(ex.documents)

            return (
                ex.barcode.toLowerCase().includes(q) ||
                doc?.title?.toLowerCase().includes(q) ||
                getAuthorName(doc).toLowerCase().includes(q)
            )
        })

        /* =========================================================
        PANIER
        ========================================================= */

        const isPending = (id: string) =>
            pendingLoans.some((loan) => loan.id === id)

        const handleAddToPendingLoans = (
            ex: ExemplaireOption
        ) => {
            if (!memberId) {
                alert(
                    "Veuillez d'abord sélectionner un membre."
                )
                return
            }

            if (isPending(ex.id)) {
                return
            }

            const maxLoans =
                selectedMember?.max_loans ?? 5

            if (pendingLoans.length >= maxLoans) {
                alert(
                    `Ce membre ne peut pas avoir plus de ${maxLoans} emprunts.`
                )
                return
            }

            setPendingLoans((current) => [
                ...current,
                ex,
            ])
        }

        const handleRemovePendingLoan = (
            exemplaireId: string
        ) => {
            setPendingLoans((current) =>
                current.filter(
                    (loan) => loan.id !== exemplaireId
                )
            )
        }

        const clearPendingLoans = () => {
            setPendingLoans([])
        }

        /* =========================================================
        RECHERCHE CODE-BARRES
        ========================================================= */

        const handleBarcodeSearch = () => {
            const trimmed = barcodeInput.trim()

            if (!trimmed) return

            const found = availableExemplaires.find(
                (ex) =>
                    ex.barcode.toLowerCase() ===
                    trimmed.toLowerCase()
            )

            if (!found) {
                alert(
                    "Aucun exemplaire disponible avec ce code-barres."
                )
                return
            }

            handleAddToPendingLoans(found)

            setBarcodeInput("")
        }

        /* =========================================================
        CHANGEMENT DE MEMBRE
        ========================================================= */

        const handleMemberChange = (
            newMemberId: string
        ) => {
            if (
                pendingLoans.length > 0 &&
                newMemberId !== memberId
            ) {
                const confirmed = confirm(
                    "Changer de membre va vider les emprunts actuellement sélectionnés. Continuer ?"
                )

                if (!confirmed) return

                setPendingLoans([])
            }

            setMemberId(newMemberId)
        }

        /* =========================================================
        CONFIRMATION DES EMPRUNTS
        ========================================================= */

        const handleConfirmLoans = async () => {
            if (!memberId) {
                alert(
                    "Veuillez sélectionner un membre."
                )
                return
            }

            if (!dueDate) {
                alert(
                    "Veuillez définir une date de retour."
                )
                return
            }

            if (pendingLoans.length === 0) {
                alert(
                    "Aucun exemplaire n'a été ajouté."
                )
                return
            }

            setSaving(true)

            try {
                /*
                * Vérification réelle en base du nombre
                * d'emprunts actifs du membre.
                */
                const { count, error: countError } =
                    await supabase
                        .from("prets")
                        .select("*", {
                            count: "exact",
                            head: true,
                        })
                        .eq("member_id", memberId)
                        .in("status", [
                            "active",
                            "overdue",
                        ])

                if (countError) {
                    throw countError
                }

                const maxLoans =
                    selectedMember?.max_loans ?? 5

                const currentLoans = count || 0

                if (
                    currentLoans +
                        pendingLoans.length >
                    maxLoans
                ) {
                    const remaining = Math.max(
                        maxLoans - currentLoans,
                        0
                    )

                    alert(
                        `Ce membre peut encore emprunter ${remaining} document(s).`
                    )

                    return
                }

                const loanDate = new Date()
                    .toISOString()
                    .split("T")[0]

                /*
                * Création de tous les prêts
                * en une seule opération.
                */
                const loanRows = pendingLoans.map(
                    (ex) => ({
                        member_id: memberId,
                        exemplaire_id: ex.id,
                        loan_date: loanDate,
                        due_date: dueDate,
                        status: "active",
                        notified_overdue: false,
                    })
                )

                const { error: loanError } =
                    await supabase
                        .from("prets")
                        .insert(loanRows)

                if (loanError) {
                    throw loanError
                }

                /*
                * Passage des exemplaires à "loaned".
                */
                const exemplaireIds =
                    pendingLoans.map(
                        (ex) => ex.id
                    )

                const {
                    error: exemplaireError,
                } = await supabase
                    .from("exemplaires")
                    .update({
                        status: "loaned",
                    })
                    .in(
                        "id",
                        exemplaireIds
                    )

                if (exemplaireError) {
                    throw exemplaireError
                }

                /*
                * Nettoyage du formulaire.
                */
                setPendingLoans([])
                setMemberId("")
                setDocumentId("")
                setBarcodeInput("")
                setDueDate(
                    getDefaultDueDate()
                )

                await loadData()

                alert(
                    `${loanRows.length} emprunt${
                        loanRows.length > 1
                            ? "s"
                            : ""
                    } enregistré${
                        loanRows.length > 1
                            ? "s"
                            : ""
                    } avec succès.`
                )
            } catch (error) {
                console.error(error)

                alert(
                    error instanceof Error
                        ? error.message
                        : "Une erreur est survenue lors de la confirmation."
                )
            } finally {
                setSaving(false)
            }
        }

        /* =========================================================
        RETOUR
        ========================================================= */

        const handleReturn = async () => {
            if (!returnLoan) return

            setSaving(true)

            try {
                const today = new Date()

                const {
                    error: returnError,
                } = await supabase
                    .from("retours")
                    .insert({
                        pret_id: returnLoan.id,
                        return_date:
                            today.toISOString(),
                        book_condition: condition,
                        notes: notes || null,
                    })

                if (returnError) {
                    throw returnError
                }

                /*
                * Mise à jour du prêt.
                */
                const {
                    error: pretError,
                } = await supabase
                    .from("prets")
                    .update({
                        status: "returned",
                    })
                    .eq(
                        "id",
                        returnLoan.id
                    )

                if (pretError) {
                    throw pretError
                }

                /*
                * Mise à jour de l'exemplaire.
                */
                let newStatus = "available"

                if (condition === "damaged") {
                    newStatus = "damaged"
                }

                if (condition === "lost") {
                    newStatus = "lost"
                }

                const {
                    error: exError,
                } = await supabase
                    .from("exemplaires")
                    .update({
                        status: newStatus,
                    })
                    .eq(
                        "id",
                        returnLoan.exemplaire_id
                    )

                if (exError) {
                    throw exError
                }

                setReturnLoan(null)
                setCondition("good")
                setNotes("")

                await loadData()

                alert(
                    "Retour enregistré avec succès."
                )
            } catch (error) {
                console.error(error)

                alert(
                    error instanceof Error
                        ? error.message
                        : "Erreur lors de l'enregistrement du retour."
                )
            } finally {
                setSaving(false)
            }
        }

        /* =========================================================
        PROLONGATION
        ========================================================= */

        const handleExtend = async (
            loan: ActiveLoan
        ) => {
            const confirmed = confirm(
                `Prolonger ce prêt de ${EXTENSION_DAYS} jours ?`
            )

            if (!confirmed) return

            const newDue = new Date(
                loan.due_date
            )

            newDue.setDate(
                newDue.getDate() +
                    EXTENSION_DAYS
            )

            const { error } =
                await supabase
                    .from("prets")
                    .update({
                        due_date:
                            newDue
                                .toISOString()
                                .split("T")[0],
                    })
                    .eq(
                        "id",
                        loan.id
                    )

            if (error) {
                alert(
                    "Erreur lors de la prolongation : " +
                        error.message
                )

                return
            }

            await loadData()
        }

        const today = new Date()

        const memberCurrentLoans =
            memberId
                ? loans.filter((loan) => {
                    const member =
                        toSingle(
                            loan.members
                        )

                    return (
                        member?.id ===
                        memberId
                    )
                }).length
                : 0

        const memberMaxLoans =
            selectedMember?.max_loans ?? 5

        const remainingSlots =
            Math.max(
                memberMaxLoans -
                    memberCurrentLoans -
                    pendingLoans.length,
                0
            )

        /* =========================================================
        INTERFACE
        ========================================================= */

        return (
            <main className="min-h-full bg-slate-50 text-slate-900 dark:bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.18),transparent_24%),radial-gradient(circle_at_bottom_right,_rgba(168,85,247,0.12),transparent_30%),linear-gradient(180deg,#020817_0%,#0f172a_100%)] dark:text-slate-100">
                <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">

                    {/* =====================================================
                        HEADER
                    ===================================================== */}

                    <header className="mb-6 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-white/[0.04] dark:shadow-[0_30px_80px_rgba(15,23,42,0.45)] backdrop-blur-xl">

                        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">

                            <div className="flex items-center gap-4">

                                <Link
                                    href="/admin"
                                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-300 bg-slate-100 text-slate-700 transition hover:border-slate-400 hover:bg-slate-200 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800 dark:hover:text-white"
                                >
                                    <ArrowLeft className="h-5 w-5" />
                                </Link>

                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-600 dark:text-sky-400">
                                            Biblius
                                        </p>

                                        <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400">
                                            <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
                                            En ligne
                                        </Badge>
                                    </div>

                                    <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                                        Gestion des emprunts
                                    </h1>

                                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                                        Préparez, vérifiez et confirmez les emprunts des membres.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="hidden rounded-2xl border border-sky-400/20 bg-sky-500/10 px-4 py-2 text-right sm:block dark:shadow-lg dark:shadow-sky-950/20">
                                    <p className="text-[10px] uppercase tracking-[0.2em] text-sky-700 dark:text-sky-200/70">
                                        Emprunts actifs
                                    </p>

                                    <p className="text-lg font-bold text-slate-900 dark:text-white">
                                        {loans.length}
                                    </p>
                                </div>

                                <div className="rounded-2xl border border-violet-400/20 bg-violet-500/10 px-4 py-2 text-right dark:shadow-lg dark:shadow-violet-950/20">
                                    <p className="text-[10px] uppercase tracking-[0.2em] text-violet-700 dark:text-violet-200/70">
                                        Disponibles
                                    </p>

                                    <p className="text-lg font-bold text-violet-600 dark:text-violet-300">
                                        {availableExemplaires.length}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Barre d'étapes */}

                        <div className="border-t border-slate-200 bg-slate-100 px-5 py-3 dark:border-white/10 dark:bg-slate-950/40">
                            <div className="flex flex-wrap items-center gap-2 text-xs">

                                <div
                                    className={`flex items-center gap-2 rounded-full px-3 py-1.5 ${
                                        memberId
                                            ? "bg-sky-500/10 text-sky-600 dark:text-sky-300"
                                            : "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                                    }`}
                                >
                                    <UserRound className="h-3.5 w-3.5" />
                                    1. Membre
                                </div>

                                <ChevronRight className="h-3.5 w-3.5 text-slate-400 dark:text-slate-600" />

                                <div
                                    className={`flex items-center gap-2 rounded-full px-3 py-1.5 ${
                                        pendingLoans.length > 0
                                            ? "bg-sky-500/10 text-sky-600 dark:text-sky-300"
                                            : "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                                    }`}
                                >
                                    <BookOpen className="h-3.5 w-3.5" />
                                    2. Sélection
                                </div>

                                <ChevronRight className="h-3.5 w-3.5 text-slate-400 dark:text-slate-600" />

                                <div
                                    className={`flex items-center gap-2 rounded-full px-3 py-1.5 ${
                                        pendingLoans.length > 0
                                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-300"
                                            : "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                                    }`}
                                >
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    3. Confirmation
                                </div>
                            </div>
                        </div>
                    </header>

                    {/* =====================================================
                        ZONE PRINCIPALE
                    ===================================================== */}

                    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">

                        {/* =================================================
                            COLONNE PRINCIPALE
                        ================================================= */}

                        <div className="space-y-6">

                            {/* ---------------------------------------------
                                1. CONFIGURATION
                            --------------------------------------------- */}

                            <Card className="overflow-hidden border border-slate-200 bg-white text-slate-900 dark:border-white/10 dark:bg-slate-900/70 dark:text-white dark:shadow-[0_20px_60px_rgba(15,23,42,0.4)] backdrop-blur-sm">

                                <CardHeader className="border-b border-slate-200 bg-gradient-to-r from-sky-500/12 via-white to-violet-500/10 pb-4 dark:border-white/10 dark:via-slate-900/70">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500/20 to-indigo-500/20 ring-1 ring-sky-400/30">
                                            <Users className="h-5 w-5 text-sky-600 dark:text-sky-300" />
                                        </div>

                                        <div>
                                            <CardTitle className="text-lg tracking-tight text-slate-900 dark:text-white">
                                                Préparer l&apos;emprunt
                                            </CardTitle>

                                            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                                                Sélectionnez le membre et la date limite de retour.
                                            </p>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardContent className="p-5">

                                    <div className="grid gap-5 md:grid-cols-2">

                                        {/* Membre */}

                                        <div>
                                            <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                                                <UserRound className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                                                Membre
                                            </label>

                                            <select
                                                value={memberId}
                                                onChange={(e) =>
                                                    handleMemberChange(
                                                        e.target.value
                                                    )
                                                }
                                                className="h-12 w-full rounded-2xl border border-slate-300 bg-slate-100 px-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20 dark:border-slate-700 dark:bg-slate-950/80 dark:text-white"
                                            >
                                                <option value="">
                                                    Sélectionner un membre
                                                </option>

                                                {members.map((member) => (
                                                    <option
                                                        key={member.id}
                                                        value={member.id}
                                                    >
                                                        {member.first_name}{" "}
                                                        {member.last_name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Date */}

                                        <div>
                                            <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                                                <CalendarDays className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                                Date de retour
                                            </label>

                                            <Input
                                                type="date"
                                                value={dueDate}
                                                onChange={(e) =>
                                                    setDueDate(
                                                        e.target.value
                                                    )
                                                }
                                                className="h-12 border-slate-300 bg-slate-100 text-slate-900 dark:border-slate-700 dark:bg-[#091525] dark:text-white"
                                            />
                                        </div>
                                    </div>

                                    {/* Informations membre */}

                                    {selectedMember && (
                                        <div className="mt-5 grid gap-3 rounded-xl border border-sky-500/20 bg-sky-500/5 p-4 sm:grid-cols-3">

                                            <div>
                                                <p className="text-xs text-slate-500">
                                                    Membre
                                                </p>

                                                <p className="mt-1 font-medium text-slate-900 dark:text-white">
                                                    {selectedMember.first_name}{" "}
                                                    {selectedMember.last_name}
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-xs text-slate-500">
                                                    Emprunts
                                                </p>

                                                <p className="mt-1 font-semibold text-sky-600 dark:text-sky-300">
                                                    {memberCurrentLoans} /{" "}
                                                    {memberMaxLoans}
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-xs text-slate-500">
                                                    Restant après sélection
                                                </p>

                                                <p
                                                    className={`mt-1 font-semibold ${
                                                        remainingSlots > 0
                                                            ? "text-emerald-600 dark:text-emerald-400"
                                                            : "text-red-600 dark:text-red-400"
                                                    }`}
                                                >
                                                    {remainingSlots} place
                                                    {remainingSlots > 1
                                                        ? "s"
                                                        : ""}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* ---------------------------------------------
                                2. RECHERCHE EXEMPLAIRES
                            --------------------------------------------- */}

                            <Card className="overflow-hidden border border-slate-200 bg-white text-slate-900 dark:border-white/10 dark:bg-slate-900/70 dark:text-white dark:shadow-[0_20px_60px_rgba(15,23,42,0.42)]">

                                <CardHeader className="border-b border-slate-200 bg-gradient-to-r from-amber-500/10 via-white to-sky-500/10 dark:border-white/10 dark:via-slate-900/80">

                                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                                        <div>
                                            <CardTitle className="flex items-center gap-2 text-lg">
                                                <BookOpen className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                                                Exemplaires disponibles
                                            </CardTitle>

                                            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                                                Ajoutez les livres à l&apos;opération d&apos;emprunt.
                                            </p>
                                        </div>

                                        <Badge
                                            variant="outline"
                                            className="w-fit border-sky-400/20 bg-sky-500/10 px-3 py-1 text-sky-700 dark:text-sky-200"
                                        >
                                            {displayedExemplaires.length} disponible
                                            {displayedExemplaires.length > 1
                                                ? "s"
                                                : ""}
                                        </Badge>
                                    </div>
                                </CardHeader>

                                <CardContent className="p-0">

                                    {/* Recherche */}

                                    <div className="border-b border-slate-200 p-4 dark:border-slate-800">

                                        <div className="grid gap-3 md:grid-cols-[1fr_220px]">

                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

                                                <Input
                                                    placeholder="Rechercher par titre, auteur ou code-barres..."
                                                    value={exemplaireSearch}
                                                    onChange={(e) =>
                                                        setExemplaireSearch(
                                                            e.target.value
                                                        )
                                                    }
                                                    className="h-11 border-slate-300 bg-slate-100 pl-10 text-slate-900 placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-sky-500/20 dark:border-slate-700 dark:bg-slate-950/80 dark:text-white"
                                                />
                                            </div>

                                            <select
                                                value={documentId}
                                                onChange={(e) =>
                                                    setDocumentId(
                                                        e.target.value
                                                    )
                                                }
                                                className="h-11 rounded-2xl border border-slate-300 bg-slate-100 px-3 text-sm text-slate-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20 dark:border-slate-700 dark:bg-slate-950/80 dark:text-white"
                                            >
                                                <option value="">
                                                    Tous les documents
                                                </option>

                                                {documents.map((doc) => (
                                                    <option
                                                        key={doc.id}
                                                        value={doc.id}
                                                    >
                                                        {doc.title}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Scanner */}

                                        <div className="mt-3 flex gap-2">
                                            <Input
                                                placeholder="Scanner ou saisir un code-barres..."
                                                value={barcodeInput}
                                                onChange={(e) =>
                                                    setBarcodeInput(
                                                        e.target.value
                                                    )
                                                }
                                                onKeyDown={(e) => {
                                                    if (
                                                        e.key ===
                                                        "Enter"
                                                    ) {
                                                        handleBarcodeSearch()
                                                    }
                                                }}
                                                className="h-11 border-slate-300 bg-slate-100 text-slate-900 placeholder:text-slate-500 dark:border-slate-700 dark:bg-[#091525] dark:text-white"
                                            />

                                            <Button
                                                type="button"
                                                onClick={
                                                    handleBarcodeSearch
                                                }
                                                className="h-11 shrink-0 bg-gradient-to-r from-sky-500 to-indigo-500 text-white hover:brightness-110 dark:shadow-lg dark:shadow-sky-900/30"
                                            >
                                                <ScanLine className="mr-2 h-4 w-4" />
                                                Scanner
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Liste */}

                                    {loading ? (
                                        <div className="flex items-center justify-center gap-2 p-10 text-sm text-slate-600 dark:text-slate-400">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Chargement des exemplaires...
                                        </div>
                                    ) : displayedExemplaires.length === 0 ? (
                                        <div className="p-10 text-center">
                                            <BookOpen className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-700" />

                                            <p className="mt-3 font-medium text-slate-700 dark:text-slate-300">
                                                Aucun exemplaire trouvé
                                            </p>

                                            <p className="mt-1 text-sm text-slate-500">
                                                Essayez une autre recherche.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-slate-200 dark:divide-slate-800">
                                            {displayedExemplaires.map(
                                                (ex) => {
                                                    const doc =
                                                        toSingle(
                                                            ex.documents
                                                        )

                                                    const added =
                                                        isPending(
                                                            ex.id
                                                        )

                                                    return (
                                                        <div
                                                            key={
                                                                ex.id
                                                            }
                                                            className={`p-4 transition ${
                                                                added
                                                                    ? "bg-sky-500/[0.04]"
                                                                    : "hover:bg-slate-200 dark:hover:bg-slate-800/30"
                                                            }`}
                                                        >
                                                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                                                                <div className="min-w-0">
                                                                    <div className="flex items-start gap-3">
                                                                        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-200 dark:bg-slate-800">
                                                                            <BookOpen className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                                                                        </div>

                                                                        <div className="min-w-0">
                                                                            <p className="truncate font-semibold text-slate-900 dark:text-white">
                                                                                {doc?.title ||
                                                                                    "Document inconnu"}
                                                                            </p>

                                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                                                                                {getAuthorName(
                                                                                    doc
                                                                                )}
                                                                            </p>

                                                                            <div className="mt-2 flex flex-wrap gap-2">
                                                                                <Badge
                                                                                    variant="outline"
                                                                                    className="border-slate-300 bg-white font-mono text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                                                                                >
                                                                                    {
                                                                                        ex.barcode
                                                                                    }
                                                                                </Badge>

                                                                                <Badge
                                                                                    variant="outline"
                                                                                    className="border-slate-300 bg-white text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
                                                                                >
                                                                                    {
                                                                                        getLocationName(
                                                                                            ex
                                                                                        )
                                                                                    }
                                                                                </Badge>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <Button
                                                                    size="sm"
                                                                    disabled={
                                                                        added ||
                                                                        !memberId
                                                                    }
                                                                    onClick={() =>
                                                                        handleAddToPendingLoans(
                                                                            ex
                                                                        )
                                                                    }
                                                                    className={
                                                                        added
                                                                            ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-300"
                                                                            : "bg-sky-500 text-white hover:bg-sky-600"
                                                                    }
                                                                >
                                                                    {added ? (
                                                                        <>
                                                                            <CheckCircle2 className="mr-2 h-4 w-4" />
                                                                            Ajouté
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <Plus className="mr-2 h-4 w-4" />
                                                                            Ajouter
                                                                        </>
                                                                    )}
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    )
                                                }
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* =================================================
                            PANIER
                        ================================================= */}

                        <div className="xl:sticky xl:top-5 xl:self-start">

                            <Card className="overflow-hidden border border-sky-400/20 bg-white text-slate-900 backdrop-blur-sm dark:bg-slate-900/70 dark:text-white dark:shadow-[0_24px_70px_rgba(14,116,144,0.18)]">

                                <CardHeader className="border-b border-slate-200 bg-gradient-to-r from-sky-500/12 via-white to-violet-500/10 dark:border-white/10 dark:via-slate-900/80">

                                    <div className="flex items-center justify-between">

                                        <div className="flex items-center gap-3">
                                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-500/10">
                                                <BookOpen className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                                            </div>

                                            <div>
                                                <CardTitle className="text-lg">
                                                    À confirmer
                                                </CardTitle>

                                                <p className="text-xs text-slate-500">
                                                    Panier d&apos;emprunts
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex h-9 min-w-9 items-center justify-center rounded-full bg-sky-500/10 px-3 text-sm font-bold text-sky-600 dark:text-sky-300">
                                            {pendingLoans.length}
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardContent className="p-4">

                                    {!memberId ? (
                                        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-100 p-7 text-center dark:border-slate-700 dark:bg-slate-900/30">
                                            <UserRound className="mx-auto h-9 w-9 text-slate-400 dark:text-slate-600" />

                                            <p className="mt-3 font-medium text-slate-700 dark:text-slate-300">
                                                Aucun membre sélectionné
                                            </p>

                                            <p className="mt-1 text-xs leading-5 text-slate-500">
                                                Sélectionnez un membre pour commencer une opération d&apos;emprunt.
                                            </p>
                                        </div>
                                    ) : pendingLoans.length === 0 ? (
                                        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-100 p-7 text-center dark:border-slate-700 dark:bg-slate-900/30">
                                            <BookOpen className="mx-auto h-9 w-9 text-slate-400 dark:text-slate-600" />

                                            <p className="mt-3 font-medium text-slate-700 dark:text-slate-300">
                                                Votre panier est vide
                                            </p>

                                            <p className="mt-1 text-xs leading-5 text-slate-500">
                                                Cliquez sur « Ajouter » pour sélectionner les exemplaires à emprunter.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">

                                            {/* Membre */}

                                            <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-500/10">
                                                        <UserRound className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                                                    </div>

                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                                                            {selectedMember?.first_name}{" "}
                                                            {selectedMember?.last_name}
                                                        </p>

                                                        <p className="text-xs text-slate-500">
                                                            {selectedMember?.email}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Livres */}

                                            <div className="max-h-[430px] space-y-2 overflow-y-auto pr-1">

                                                {pendingLoans.map(
                                                    (ex) => {
                                                        const doc =
                                                            toSingle(
                                                                ex.documents
                                                            )

                                                        return (
                                                            <div
                                                                key={
                                                                    ex.id
                                                                }
                                                                className="group rounded-xl border border-slate-300 bg-slate-100 p-3 dark:border-slate-700 dark:bg-[#091525]"
                                                            >
                                                                <div className="flex gap-3">
                                                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
                                                                        <BookOpen className="h-4 w-4 text-amber-400" />
                                                                    </div>

                                                                    <div className="min-w-0 flex-1">
                                                                        <div className="flex items-start justify-between gap-2">
                                                                            <p className="line-clamp-2 text-sm font-medium text-slate-900 dark:text-white">
                                                                                {doc?.title ||
                                                                                    "Document inconnu"}
                                                                            </p>

                                                                            <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                onClick={() =>
                                                                                    handleRemovePendingLoan(
                                                                                        ex.id
                                                                                    )
                                                                                }
                                                                                className="h-7 w-7 shrink-0 text-slate-500 hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400"
                                                                            >
                                                                                <X className="h-4 w-4" />
                                                                            </Button>
                                                                        </div>

                                                                        <p className="mt-1 text-xs text-slate-500">
                                                                            {getAuthorName(
                                                                                doc
                                                                            )}
                                                                        </p>

                                                                        <div className="mt-2 flex flex-wrap gap-1.5">
                                                                            <Badge
                                                                                variant="outline"
                                                                                className="border-slate-300 bg-white font-mono text-[10px] text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
                                                                            >
                                                                                {
                                                                                    ex.barcode
                                                                                }
                                                                            </Badge>

                                                                            <Badge
                                                                                variant="outline"
                                                                                className="border-slate-300 bg-white text-[10px] text-slate-500 dark:border-slate-700 dark:bg-slate-900"
                                                                            >
                                                                                {getLocationName(
                                                                                    ex
                                                                                )}
                                                                            </Badge>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )
                                                    }
                                                )}
                                            </div>

                                            {/* Résumé */}

                                            <div className="border-t border-slate-200 pt-4 dark:border-slate-800">

                                                <div className="space-y-2 text-sm">

                                                    <div className="flex justify-between">
                                                        <span className="text-slate-500">
                                                            Documents
                                                        </span>

                                                        <span className="font-medium text-slate-900 dark:text-white">
                                                            {
                                                                pendingLoans.length
                                                            }
                                                        </span>
                                                    </div>

                                                    <div className="flex justify-between">
                                                        <span className="text-slate-500">
                                                            Retour prévu
                                                        </span>

                                                        <span className="font-medium text-slate-900 dark:text-white">
                                                            {dueDate
                                                                ? formatDate(
                                                                    dueDate
                                                                )
                                                                : "—"}
                                                        </span>
                                                    </div>

                                                    <div className="flex justify-between">
                                                        <span className="text-slate-500">
                                                            Limite
                                                        </span>

                                                        <span
                                                            className={`font-medium ${
                                                                remainingSlots >
                                                                0
                                                                    ? "text-emerald-600 dark:text-emerald-400"
                                                                    : "text-red-600 dark:text-red-400"
                                                            }`}
                                                        >
                                                            {
                                                                remainingSlots
                                                            }{" "}
                                                            restant
                                                            {remainingSlots >
                                                            1
                                                                ? "s"
                                                                : ""}
                                                        </span>
                                                    </div>
                                                </div>

                                                <Button
                                                    onClick={
                                                        handleConfirmLoans
                                                    }
                                                    disabled={
                                                        saving ||
                                                        pendingLoans.length ===
                                                            0 ||
                                                        !memberId ||
                                                        !dueDate
                                                    }
                                                    className="mt-5 h-12 w-full bg-sky-500 font-semibold text-white hover:bg-sky-600 dark:shadow-lg dark:shadow-sky-950/30"
                                                >
                                                    {saving ? (
                                                        <>
                                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                            Enregistrement...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <CheckCircle2 className="mr-2 h-4 w-4" />
                                                            Confirmer les emprunts
                                                        </>
                                                    )}
                                                </Button>

                                                <Button
                                                    variant="ghost"
                                                    onClick={
                                                        clearPendingLoans
                                                    }
                                                    disabled={
                                                        saving
                                                    }
                                                    className="mt-2 w-full text-slate-500 hover:bg-red-500/5 hover:text-red-600 dark:hover:text-red-400"
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Vider le panier
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* =====================================================
                        EMPRUNTS EN COURS
                    ===================================================== */}

                    <Card className="mt-6 overflow-hidden border border-slate-200 bg-white text-slate-900 dark:border-white/10 dark:bg-slate-900/70 dark:text-white dark:shadow-[0_20px_60px_rgba(15,23,42,0.42)]">

                        <CardHeader className="border-b border-slate-200 bg-gradient-to-r from-slate-100 via-white to-sky-500/10 dark:border-white/10 dark:from-slate-900/90 dark:via-slate-900/80">

                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <RotateCcw className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                                        Emprunts en cours
                                    </CardTitle>

                                    <p className="mt-1 text-xs text-slate-500">
                                        Suivez les documents actuellement empruntés.
                                    </p>
                                </div>

                                <Badge
                                    variant="outline"
                                    className="w-fit border-slate-300 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                                >
                                    {loans.length} actif
                                    {loans.length > 1
                                        ? "s"
                                        : ""}
                                </Badge>
                            </div>
                        </CardHeader>

                        <CardContent className="p-0">

                            {loading ? (
                                <div className="flex items-center justify-center gap-2 p-10 text-sm text-slate-600 dark:text-slate-400">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Chargement...
                                </div>
                            ) : loans.length === 0 ? (
                                <div className="p-10 text-center">
                                    <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500/30" />

                                    <p className="mt-3 font-medium text-slate-700 dark:text-slate-300">
                                        Aucun emprunt en cours
                                    </p>

                                    <p className="mt-1 text-sm text-slate-500">
                                        Tous les exemplaires sont actuellement disponibles.
                                    </p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">

                                        <thead className="bg-slate-100 text-xs uppercase tracking-wider text-slate-500 dark:bg-[#091525]">
                                            <tr>
                                                <th className="px-5 py-4 font-medium">
                                                    Document
                                                </th>

                                                <th className="px-5 py-4 font-medium">
                                                    Membre
                                                </th>

                                                <th className="px-5 py-4 font-medium">
                                                    Exemplaire
                                                </th>

                                                <th className="px-5 py-4 font-medium">
                                                    Retour
                                                </th>

                                                <th className="px-5 py-4 font-medium">
                                                    Statut
                                                </th>

                                                <th className="px-5 py-4 text-right font-medium">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>

                                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">

                                            {loans.map(
                                                (loan) => {
                                                    const member =
                                                        toSingle(
                                                            loan.members
                                                        )

                                                    const exemplaire =
                                                        toSingle(
                                                            loan.exemplaires
                                                        )

                                                    const doc =
                                                        exemplaire
                                                            ? toSingle(
                                                                  exemplaire.documents
                                                              )
                                                            : null

                                                    const isOverdue =
                                                        new Date(
                                                            loan.due_date
                                                        ) <
                                                        today

                                                    return (
                                                        <tr
                                                            key={
                                                                loan.id
                                                            }
                                                            className="transition hover:bg-slate-200 dark:hover:bg-slate-800/20"
                                                        >

                                                            <td className="px-5 py-4">
                                                                <div className="max-w-[280px]">
                                                                    <p className="truncate font-medium text-slate-900 dark:text-white">
                                                                        {doc?.title ||
                                                                            "Inconnu"}
                                                                    </p>

                                                                    <p className="mt-1 text-xs text-slate-500">
                                                                        {getAuthorName(
                                                                            doc
                                                                        )}
                                                                    </p>
                                                                </div>
                                                            </td>

                                                            <td className="px-5 py-4">
                                                                <p className="font-medium text-slate-900 dark:text-white">
                                                                    {member
                                                                        ? `${member.first_name} ${member.last_name}`
                                                                        : "Inconnu"}
                                                                </p>

                                                                <p className="mt-1 text-xs text-slate-500">
                                                                    {member?.email}
                                                                </p>
                                                            </td>

                                                            <td className="px-5 py-4">
                                                                <Badge
                                                                    variant="outline"
                                                                    className="border-slate-300 bg-white font-mono text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                                                                >
                                                                    {exemplaire?.barcode ||
                                                                        "N/A"}
                                                                </Badge>
                                                            </td>

                                                            <td
                                                                className={`px-5 py-4 ${
                                                                    isOverdue
                                                                        ? "font-semibold text-red-600 dark:text-red-400"
                                                                        : "text-slate-700 dark:text-slate-300"
                                                                }`}
                                                            >
                                                                {formatDate(
                                                                    loan.due_date
                                                                )}

                                                                {isOverdue && (
                                                                    <p className="mt-1 text-[11px]">
                                                                        Dépassé
                                                                    </p>
                                                                )}
                                                            </td>

                                                            <td className="px-5 py-4">
                                                                <Badge
                                                                    className={
                                                                        isOverdue
? "border border-red-500/20 bg-red-500/10 text-red-600 hover:bg-red-500/10 dark:text-red-300"
: "border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-300"
                                                                    }
                                                                >
                                                                    {isOverdue
                                                                        ? "En retard"
                                                                        : "À temps"}
                                                                </Badge>
                                                            </td>

                                                            <td className="px-5 py-4">
                                                                <div className="flex justify-end gap-2">

                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        onClick={() =>
                                                                            handleExtend(
                                                                                loan
                                                                            )
                                                                        }
                                                                        className="border-slate-300 bg-white text-slate-700 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                                                                        title={`Prolonger de ${EXTENSION_DAYS} jours`}
                                                                    >
                                                                        <Clock className="mr-1.5 h-4 w-4" />
                                                                        Prolonger
                                                                    </Button>

                                                                    <Button
                                                                        size="sm"
                                                                        onClick={() =>
                                                                            setReturnLoan(
                                                                                loan
                                                                            )
                                                                        }
                                                                        className="bg-sky-500 text-white hover:bg-sky-600"
                                                                    >
                                                                        <RotateCcw className="mr-1.5 h-4 w-4" />
                                                                        Retour
                                                                    </Button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )
                                                }
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* =====================================================
                        MODAL RETOUR
                    ===================================================== */}

                    {returnLoan && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">

                            <Card className="w-full max-w-lg overflow-hidden border-slate-300 bg-white text-slate-900 shadow-2xl dark:border-slate-700 dark:bg-[#0c192b] dark:text-white">

                                <CardHeader className="border-b border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-[#0e1d31]">

                                    <div className="flex items-start justify-between gap-4">

                                        <div>
                                            <div className="flex items-center gap-2">
                                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10">
                                                    <RotateCcw className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                                </div>

                                                <CardTitle>
                                                    Enregistrer le retour
                                                </CardTitle>
                                            </div>

                                            <p className="mt-2 text-xs text-slate-500">
                                                Vérifiez l&apos;état de l&apos;exemplaire avant de confirmer.
                                            </p>
                                        </div>

                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() =>
                                                setReturnLoan(
                                                    null
                                                )
                                            }
                                            className="text-slate-500 hover:bg-slate-200 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                                        >
                                            <X className="h-5 w-5" />
                                        </Button>
                                    </div>
                                </CardHeader>

                                <CardContent className="space-y-5 p-5">

                                    {/* Livre */}

                                    <div className="rounded-xl border border-slate-300 bg-slate-100 p-4 dark:border-slate-700 dark:bg-[#091525]">

                                        <div className="flex gap-3">

                                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
                                                <BookOpen className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                                            </div>

                                            <div>
                                                <p className="font-semibold text-slate-900 dark:text-white">
                                                    {
                                                        toSingle(
                                                            toSingle(returnLoan.exemplaires)?.documents
                                                        )?.title
                                                    }
                                                </p>

                                                <p className="mt-1 text-sm text-slate-500">
                                                    {getAuthorName(
                                                        toSingle(
                                                            toSingle(returnLoan.exemplaires)?.documents
                                                        )
                                                    )}
                                                </p>

                                                <Badge
                                                    variant="outline"
                                                    className="mt-2 border-slate-300 bg-white font-mono text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
                                                >
                                                    {
                                                        toSingle(
                                                            returnLoan.exemplaires
                                                        )?.barcode
                                                    }
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>

                                    {/* État */}

                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                            État du livre
                                        </label>

                                        <select
                                            value={
                                                condition
                                            }
                                            onChange={(e) =>
                                                setCondition(
                                                    e.target.value
                                                )
                                            }
                                            className="h-11 w-full rounded-xl border border-slate-300 bg-slate-100 px-3 text-sm text-slate-900 outline-none focus:border-sky-500 dark:border-slate-700 dark:bg-[#091525] dark:text-white"
                                        >
                                            <option value="good">
                                                Bon état
                                            </option>

                                            <option value="damaged">
                                                Endommagé
                                            </option>

                                            <option value="lost">
                                                Perdu
                                            </option>
                                        </select>
                                    </div>

                                    {/* Notes */}

                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                            Notes
                                            <span className="ml-1 text-slate-400 dark:text-slate-600">
                                                (optionnel)
                                            </span>
                                        </label>

                                        <Input
                                            value={notes}
                                            onChange={(e) =>
                                                setNotes(
                                                    e.target.value
                                                )
                                            }
                                            placeholder="Ex. couverture légèrement déchirée..."
                                            className="h-11 border-slate-300 bg-slate-100 text-slate-900 placeholder:text-slate-500 dark:border-slate-700 dark:bg-[#091525] dark:text-white"
                                        />
                                    </div>

                                    <Button
                                        onClick={
                                            handleReturn
                                        }
                                        disabled={
                                            saving
                                        }
                                        className="h-11 w-full bg-sky-500 font-semibold hover:bg-sky-600"
                                    >
                                        {saving ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Enregistrement...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                                Confirmer le retour
                                            </>
                                        )}
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>
            </main>
        )
    }