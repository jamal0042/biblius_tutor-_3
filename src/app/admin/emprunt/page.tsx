    "use client"

    import { useEffect, useState, useCallback } from "react"
    import { createClient } from "@/lib/supabase/client"
    import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
    import { Button } from "@/components/ui/button"
    import { Badge } from "@/components/ui/badge"
    import { Input } from "@/components/ui/input"
    import { Plus, ScanLine, AlertCircle, BookOpen, RotateCcw, Search, Clock, X } from "lucide-react"

    const PENALTY_PER_DAY = 100
    const EXTENSION_DAYS = 7 // Prolongation de 7 jours par défaut

    // Types flexibles pour gérer objet OU tableau (Supabase renvoie les deux)
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
    documents: MaybeArray<DocumentData>
    exemplaires: MaybeArray<ExemplaireData>
    }

    // Fonction robuste : extrait un élément unique, que ce soit un objet ou un tableau
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

    function getLocationName(ex: ExemplaireOption | null | undefined): string {
    if (!ex) return "—"
    const loc = toSingle(ex.locations)
    return loc ? `${loc.name} (${loc.code})` : "—"
    }

    export default function AdminEmpruntPage() {
    const supabase = createClient()

    const [members, setMembers] = useState<MemberOption[]>([])
    const [documents, setDocuments] = useState<DocumentData[]>([])
    const [availableExemplaires, setAvailableExemplaires] = useState<ExemplaireOption[]>([])
    const [loans, setLoans] = useState<ActiveLoan[]>([])
    const [loading, setLoading] = useState(true)

    // Formulaire nouvel emprunt
    const [memberId, setMemberId] = useState("")
    const [documentId, setDocumentId] = useState("")
    const [barcodeInput, setBarcodeInput] = useState("")
    const [selectedExemplaire, setSelectedExemplaire] = useState<ExemplaireOption | null>(null)
    const [dueDate, setDueDate] = useState("")
    const [saving, setSaving] = useState(false)

    // Recherche dans la liste des exemplaires
    const [exemplaireSearch, setExemplaireSearch] = useState("")

    // Modal de retour
    const [returnLoan, setReturnLoan] = useState<ActiveLoan | null>(null)
    const [condition, setCondition] = useState("good")
    const [notes, setNotes] = useState("")

    const selectedMember = members.find((m) => m.id === memberId) || null
    const selectedDocument = documents.find((d) => d.id === documentId) || null

    const loadData = useCallback(async () => {
        setLoading(true)
        try {
        const [membersResult, documentsResult, exemplairesResult, loansResult] = await Promise.all([
            supabase.from("members").select("id, first_name, last_name, email, phone, matricule, department").eq("status", "active"),
            supabase.from("documents").select("id, title, auteurs (id, name)").order("title", { ascending: true }),
            supabase
            .from("exemplaires")
            .select("id, barcode, document_id, status, location_id, documents (id, title, auteurs (id, name)), locations (id, name, code)")
            .eq("status", "available")
            .order("barcode", { ascending: true }),
            supabase
            .from("prets")
            .select(`
                id,
                loan_date,
                due_date,
                exemplaire_id,
                members (id, first_name, last_name, email),
                documents (id, title, auteurs (id, name)),
                exemplaires (id, barcode, status)
            `)
            .in("status", ["active", "overdue"])
            .order("due_date", { ascending: true })
        ])

        setMembers((membersResult.data as unknown as MemberOption[]) || [])
        setDocuments((documentsResult.data as unknown as DocumentData[]) || [])
        setAvailableExemplaires((exemplairesResult.data as unknown as ExemplaireOption[]) || [])
        setLoans((loansResult.data as unknown as ActiveLoan[]) || [])
        } finally {
        setLoading(false)
        }
    }, [supabase])

    useEffect(() => {
        const timeout = window.setTimeout(() => { void loadData() }, 0)
        return () => window.clearTimeout(timeout)
    }, [loadData])

    const filteredExemplaires = documentId
        ? availableExemplaires.filter((ex) => ex.document_id === documentId)
        : availableExemplaires

    const handleBarcodeSearch = () => {
        const trimmed = barcodeInput.trim()
        if (!trimmed) { setSelectedExemplaire(null); return }
        const source = filteredExemplaires.length > 0 ? filteredExemplaires : availableExemplaires
        const found = source.find((ex) => ex.barcode.toLowerCase() === trimmed.toLowerCase())
        setSelectedExemplaire(found || null)
    }

    // Sélection directe d'un exemplaire depuis la liste
    const handleSelectExemplaire = (ex: ExemplaireOption) => {
        setSelectedExemplaire(ex)
        setBarcodeInput(ex.barcode)
        if (!documentId) setDocumentId(ex.document_id)
    }

    const handleCreateLoan = async () => {
        if (!memberId || !selectedExemplaire || !dueDate) {
        alert("Veuillez remplir tous les champs et sélectionner un exemplaire disponible.")
        return
        }
        if (documentId && selectedExemplaire.document_id !== documentId) {
        alert("L'exemplaire sélectionné ne correspond pas au document choisi.")
        return
        }

        const { count } = await supabase
        .from("prets")
        .select("*", { count: "exact", head: true })
        .eq("member_id", memberId)
        .in("status", ["active", "overdue"])

        if ((count || 0) >= 5) {
        alert("Ce membre a atteint sa limite de 5 emprunts simultanés.")
        return
        }

        setSaving(true)
        const { error } = await supabase.from("prets").insert({
        member_id: memberId,
        document_id: selectedExemplaire.document_id,
        exemplaire_id: selectedExemplaire.id,
        loan_date: new Date().toISOString().split("T")[0],
        due_date: dueDate,
        status: "active",
        notified_overdue: false,
        })

        if (!error) {
        await supabase.from("exemplaires").update({ status: "loaned" }).eq("id", selectedExemplaire.id)
        setMemberId("")
        setDocumentId("")
        setBarcodeInput("")
        setSelectedExemplaire(null)
        setDueDate("")
        await loadData()
        } else {
        alert("Erreur : " + error.message)
        }
        setSaving(false)
    }

    // 🌟 RETOUR D'UN EXEMPLAIRE
    const handleReturn = async () => {
        if (!returnLoan) return
        setSaving(true)

        const today = new Date()
        const due = new Date(returnLoan.due_date)
        const daysLate = Math.max(0, Math.ceil((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)))
        const penalty = daysLate * PENALTY_PER_DAY
        const member = toSingle(returnLoan.members)
        const doc = toSingle(returnLoan.documents)

        await supabase.from("retours").insert({
        pret_id: returnLoan.id,
        member_id: member?.id ?? null,
        document_id: doc?.id ?? null,
        exemplaire_id: returnLoan.exemplaire_id,
        return_date: today.toISOString(),
        days_late: daysLate,
        penalty_amount: penalty,
        book_condition: condition,
        notes: notes || null
        })

        await supabase.from("prets").update({ status: "returned" }).eq("id", returnLoan.id)

        if (returnLoan.exemplaire_id) {
        await supabase.from("exemplaires").update({ status: "available" }).eq("id", returnLoan.exemplaire_id)
        }

        if (penalty > 0 && member) {
        await supabase.from("penalites").insert({
            member_id: member.id,
            pret_id: returnLoan.id,
            amount: penalty,
            days: daysLate,
            reason: `Retard de ${daysLate} jour(s)`,
            status: "unpaid",
            type: "late"
        })
        }

        setReturnLoan(null)
        setCondition("good")
        setNotes("")
        await loadData()
        setSaving(false)
    }

    // 🌟 PROLONGATION D'UN PRÊT
    const handleExtend = async (loan: ActiveLoan) => {
        if (!confirm(`Prolonger ce prêt de ${EXTENSION_DAYS} jours ?`)) return

        const newDue = new Date(loan.due_date)
        newDue.setDate(newDue.getDate() + EXTENSION_DAYS)

        const { error } = await supabase
        .from("prets")
        .update({ due_date: newDue.toISOString().split("T")[0] })
        .eq("id", loan.id)

        if (error) {
        alert("Erreur lors de la prolongation : " + error.message)
        } else {
        await loadData()
        }
    }

    // Filtrage des exemplaires disponibles par recherche textuelle
    const displayedExemplaires = exemplaireSearch.trim()
        ? availableExemplaires.filter((ex) => {
            const doc = toSingle(ex.documents)
            const q = exemplaireSearch.toLowerCase()
            return (
            ex.barcode.toLowerCase().includes(q) ||
            doc?.title?.toLowerCase().includes(q) ||
            getAuthorName(doc).toLowerCase().includes(q)
            )
        })
        : availableExemplaires

    const today = new Date()

    return (
        <div className="space-y-6">
        <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Gestion des emprunts</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
            Enregistrez un emprunt, consultez les exemplaires disponibles et gérez les retours.
            </p>
        </div>

        {/* ========== NOUVEAU PRÊT ========== */}
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
                <Plus className="w-5 h-5 text-amber-500" />
                Nouveau prêt
            </CardTitle>
            </CardHeader>
            <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                <label className="text-sm font-medium mb-1 block">Membre</label>
                <select
                    value={memberId}
                    onChange={(e) => setMemberId(e.target.value)}
                    className="w-full h-10 px-3 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                    <option value="">-- Choisir un membre --</option>
                    {members.map((m) => (
                    <option key={m.id} value={m.id}>
                        {m.first_name} {m.last_name}
                    </option>
                    ))}
                </select>
                </div>

                <div>
                <label className="text-sm font-medium mb-1 block">Document</label>
                <select
                    value={documentId}
                    onChange={(e) => {
                    setDocumentId(e.target.value)
                    setSelectedExemplaire(null)
                    setBarcodeInput("")
                    }}
                    className="w-full h-10 px-3 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                    <option value="">-- Choisir un document --</option>
                    {documents.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                        {doc.title} — {getAuthorName(doc)}
                    </option>
                    ))}
                </select>
                </div>

                <div className="md:col-span-2">
                <label className="text-sm font-medium mb-1 block">Code-barres de l&apos;exemplaire</label>
                <div className="flex gap-2">
                    <Input
                    type="text"
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleBarcodeSearch()}
                    placeholder="Scanner ou saisir un code-barres"
                    autoFocus
                    />
                    <Button type="button" variant="outline" onClick={handleBarcodeSearch}>
                    <ScanLine className="w-4 h-4" />
                    </Button>
                </div>

                {selectedExemplaire && (
                    <div className="mt-2 p-2 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded text-sm">
                    <div className="font-semibold text-emerald-900 dark:text-emerald-300">
                        ✓ {toSingle(selectedExemplaire.documents)?.title}
                    </div>
                    <div className="text-emerald-700 dark:text-emerald-400 text-xs">
                        {getAuthorName(toSingle(selectedExemplaire.documents))} • {selectedExemplaire.barcode} • {getLocationName(selectedExemplaire)}
                    </div>
                    </div>
                )}

                {barcodeInput && !selectedExemplaire && (
                    <div className="mt-2 p-2 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded text-sm flex items-center gap-2 text-red-700 dark:text-red-400">
                    <AlertCircle className="w-4 h-4" />
                    Aucun exemplaire disponible avec ce code.
                    </div>
                )}
                </div>

                <div>
                <label className="text-sm font-medium mb-1 block">Date retour prévue</label>
                <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                </div>
            </div>

            <div className="mt-6 grid grid-cols-1 xl:grid-cols-2 gap-4">
                <Card className="border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">Informations du membre</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                    <div className="flex justify-between gap-3"><span className="text-slate-500 dark:text-slate-400">Nom complet</span><span className="font-medium text-right">{selectedMember ? `${selectedMember.first_name} ${selectedMember.last_name}` : "Aucun membre sélectionné"}</span></div>
                    <div className="flex justify-between gap-3"><span className="text-slate-500 dark:text-slate-400">Téléphone</span><span className="font-medium text-right">{selectedMember?.phone || "—"}</span></div>
                    <div className="flex justify-between gap-3"><span className="text-slate-500 dark:text-slate-400">Matricule</span><span className="font-medium text-right">{selectedMember?.matricule || "—"}</span></div>
                    <div className="flex justify-between gap-3"><span className="text-slate-500 dark:text-slate-400">Filière</span><span className="font-medium text-right">{selectedMember?.department || "—"}</span></div>
                    <div className="flex justify-between gap-3"><span className="text-slate-500 dark:text-slate-400">Email</span><span className="font-medium text-right break-all">{selectedMember?.email || "—"}</span></div>
                </CardContent>
                </Card>

                <Card className="border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">Détails du document</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                    <div className="flex justify-between gap-3"><span className="text-slate-500 dark:text-slate-400">Livre</span><span className="font-medium text-right">{selectedDocument?.title || "Aucun document sélectionné"}</span></div>
                    <div className="flex justify-between gap-3"><span className="text-slate-500 dark:text-slate-400">Auteur</span><span className="font-medium text-right">{selectedDocument ? getAuthorName(selectedDocument) : "—"}</span></div>
                    <div className="flex justify-between gap-3"><span className="text-slate-500 dark:text-slate-400">Exemplaire</span><span className="font-medium text-right">{selectedExemplaire?.barcode || "—"}</span></div>
                    <div className="flex justify-between gap-3"><span className="text-slate-500 dark:text-slate-400">Emplacement</span><span className="font-medium text-right">{selectedExemplaire ? getLocationName(selectedExemplaire) : "—"}</span></div>
                    <div className="flex justify-between gap-3"><span className="text-slate-500 dark:text-slate-400">Date prévue</span><span className="font-medium text-right">{dueDate ? new Date(dueDate).toLocaleDateString("fr-FR") : "—"}</span></div>
                </CardContent>
                </Card>
            </div>

            <div className="mt-4 flex justify-end">
                <Button
                onClick={handleCreateLoan}
                disabled={saving || !selectedExemplaire}
                className="bg-amber-500 hover:bg-amber-600 text-white"
                >
                <BookOpen className="w-4 h-4 mr-2" />
                Enregistrer l&apos;emprunt
                </Button>
            </div>
            </CardContent>
        </Card>

        {/* ========== EMPRUNTS EN COURS (avec actions) ========== */}
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
                <RotateCcw className="w-5 h-5 text-amber-500" />
                Emprunts en cours ({loans.length})
            </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
            {loading ? (
                <div className="p-8 text-center text-slate-500">Chargement...</div>
            ) : loans.length === 0 ? (
                <div className="p-8 text-center text-slate-500">Aucun emprunt en cours.</div>
            ) : (
                <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Document</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Exemplaire</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Membre</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Emprunté le</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Retour prévu</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Statut</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {loans.map((loan) => {
                        const member = toSingle(loan.members)
                        const doc = toSingle(loan.documents)
                        const exemplaire = toSingle(loan.exemplaires)
                        const isOverdue = new Date(loan.due_date) < today

                        return (
                        <tr key={loan.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <td className="px-6 py-4">
                            <div className="font-medium text-slate-900 dark:text-white">{doc?.title || "Inconnu"}</div>
                            <div className="text-sm text-slate-500">{getAuthorName(doc)}</div>
                            </td>
                            <td className="px-6 py-4">
                            <Badge variant="outline" className="font-mono text-xs">
                                {exemplaire?.barcode || "N/A"}
                            </Badge>
                            </td>
                            <td className="px-6 py-4">
                            <div className="font-medium text-slate-900 dark:text-white">
                                {member ? `${member.first_name} ${member.last_name}` : "Inconnu"}
                            </div>
                            <div className="text-sm text-slate-500">{member?.email}</div>
                            </td>
                            <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                            {new Date(loan.loan_date).toLocaleDateString("fr-FR")}
                            </td>
                            <td className={`px-6 py-4 ${isOverdue ? "text-red-600 font-semibold" : "text-slate-700 dark:text-slate-300"}`}>
                            {new Date(loan.due_date).toLocaleDateString("fr-FR")}
                            </td>
                            <td className="px-6 py-4">
                            <Badge
                                className={isOverdue
                                ? "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400"
                                : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"}
                            >
                                {isOverdue ? "En retard" : "À temps"}
                            </Badge>
                            </td>
                            <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-1">
                                <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleExtend(loan)}
                                title="Prolonger de 7 jours"
                                >
                                <Clock className="w-4 h-4" />
                                </Button>
                                <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setReturnLoan(loan)}
                                >
                                <RotateCcw className="w-4 h-4 mr-1" />
                                Retour
                                </Button>
                            </div>
                            </td>
                        </tr>
                        )
                    })}
                    </tbody>
                </table>
                </div>
            )}
            </CardContent>
        </Card>

        {/* ========== TOUS LES EXEMPLAIRES DISPONIBLES ========== */}
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
                <BookOpen className="w-5 h-5 text-amber-500" />
                Exemplaires disponibles ({availableExemplaires.length})
            </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                    placeholder="Rechercher par titre, auteur ou code-barres..."
                    value={exemplaireSearch}
                    onChange={(e) => setExemplaireSearch(e.target.value)}
                    className="pl-10"
                />
                </div>
            </div>

            {loading ? (
                <div className="p-8 text-center text-slate-500">Chargement...</div>
            ) : displayedExemplaires.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                {exemplaireSearch ? "Aucun exemplaire ne correspond à votre recherche." : "Aucun exemplaire disponible."}
                </div>
            ) : (
                <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Document</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Auteur</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Code-barres</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Emplacement</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Action</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {displayedExemplaires.map((ex) => {
                        const doc = toSingle(ex.documents)
                        return (
                        <tr key={ex.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <td className="px-6 py-4">
                            <div className="font-medium text-slate-900 dark:text-white">{doc?.title || "Inconnu"}</div>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                            {getAuthorName(doc)}
                            </td>
                            <td className="px-6 py-4">
                            <Badge variant="outline" className="font-mono text-xs">
                                {ex.barcode}
                            </Badge>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                            {getLocationName(ex)}
                            </td>
                            <td className="px-6 py-4 text-right">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleSelectExemplaire(ex)}
                                className="text-amber-600 border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10"
                            >
                                <Plus className="w-4 h-4 mr-1" />
                                Emprunter
                            </Button>
                            </td>
                        </tr>
                        )
                    })}
                    </tbody>
                </table>
                </div>
            )}
            </CardContent>
        </Card>

        {/* ========== MODALE DE RETOUR ========== */}
        {returnLoan && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <Card className="w-full max-w-md bg-white dark:bg-slate-900">
                <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Enregistrer le retour</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setReturnLoan(null)}>
                    <X className="w-5 h-5" />
                </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                <div>
                    <p className="font-semibold text-slate-900 dark:text-white">
                    {toSingle(returnLoan.documents)?.title}
                    </p>
                    <p className="text-sm text-slate-500 mt-1">
                    {getAuthorName(toSingle(returnLoan.documents))}
                    </p>
                    <Badge variant="outline" className="font-mono text-xs mt-2">
                    {toSingle(returnLoan.exemplaires)?.barcode}
                    </Badge>
                </div>

                <div>
                    <label className="text-sm font-medium mb-1 block">État du livre</label>
                    <select
                    value={condition}
                    onChange={(e) => setCondition(e.target.value)}
                    className="w-full h-10 px-3 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    >
                    <option value="good">Bon état</option>
                    <option value="damaged">Endommagé</option>
                    <option value="lost">Perdu</option>
                    </select>
                </div>

                <div>
                    <label className="text-sm font-medium mb-1 block">Notes (optionnel)</label>
                    <Input
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ex: couverture déchirée"
                    />
                </div>

                {(() => {
                    const daysLate = Math.max(
                    0,
                    Math.ceil((today.getTime() - new Date(returnLoan.due_date).getTime()) / (1000 * 60 * 60 * 24))
                    )
                    return daysLate > 0 ? (
                    <div className="p-3 bg-red-50 dark:bg-red-500/10 rounded-lg text-sm text-red-700 dark:text-red-400">
                        Retard de {daysLate} jour(s) → Pénalité : {daysLate * PENALTY_PER_DAY} FCFA
                    </div>
                    ) : (
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg text-sm text-emerald-700 dark:text-emerald-400">
                        Retour à temps, aucune pénalité.
                    </div>
                    )
                })()}

                <Button
                    onClick={handleReturn}
                    disabled={saving}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-white"
                >
                    Confirmer le retour
                </Button>
                </CardContent>
            </Card>
            </div>
        )}
        </div>
    )
    }