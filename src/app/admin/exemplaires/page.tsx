    "use client"

    import { useCallback, useEffect, useState } from "react"
    import { createClient } from "@/lib/supabase/client"
    import { Badge } from "@/components/ui/badge"
    import { Button } from "@/components/ui/button"
    import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
    import { Input } from "@/components/ui/input"
    import { AlertCircle, BookOpen, Plus, RotateCcw, ScanLine, X } from "lucide-react"

    // 🌟 NOUVELLES INTERFACES adaptées à la relation auteurs
    interface MemberData {
    id: string
    first_name: string
    last_name: string
    email: string
    }

    interface AuteurData {
    id: string
    name: string
    }

    interface DocumentData {
    id: string
    title: string
    auteurs: AuteurData[] | null  // 🌟 Changé de "author" à "auteurs"
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
    }

    interface ExemplaireOption {
    id: string
    barcode: string
    document_id: string
    status: string
    documents: DocumentData[] | null
    }

    interface ActiveLoan {
    id: string
    loan_date: string
    due_date: string
    exemplaire_id: string
    members: MemberData[] | null
    documents: DocumentData[] | null
    exemplaires: ExemplaireData[] | null
    }

    function first<T>(rel: T[] | null | undefined): T | null {
    if (!rel || rel.length === 0) return null
    return rel[0]
    }

    // 🌟 Fonction utilitaire pour extraire le nom de l'auteur
    function getAuthorName(doc: DocumentData | null | undefined): string {
    const auteur = first(doc?.auteurs)
    return auteur?.name || "Auteur inconnu"
    }

    export default function AdminExemplairesPage() {
    const supabase = createClient()

    const [members, setMembers] = useState<MemberOption[]>([])
    const [availableExemplaires, setAvailableExemplaires] = useState<ExemplaireOption[]>([])
    const [loans, setLoans] = useState<ActiveLoan[]>([])
    const [loading, setLoading] = useState(true)

    const [memberId, setMemberId] = useState("")
    const [barcodeInput, setBarcodeInput] = useState("")
    const [selectedExemplaire, setSelectedExemplaire] = useState<ExemplaireOption | null>(null)
    const [dueDate, setDueDate] = useState("")
    const [saving, setSaving] = useState(false)

    const [returnLoan, setReturnLoan] = useState<ActiveLoan | null>(null)
    const [condition, setCondition] = useState("good")
    const [notes, setNotes] = useState("")

    const loadData = useCallback(async () => {
        setLoading(true)

        try {
        const [membersResult, exemplairesResult, loansResult] = await Promise.all([
            supabase
            .from("members")
            .select("id, first_name, last_name, email")
            .eq("status", "active"),
            supabase
            .from("exemplaires")
            // 🌟 NOUVEAU : Jointure avec auteurs au lieu de author
            .select("id, barcode, document_id, status, documents (id, title, auteurs (id, name))")
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
        setAvailableExemplaires((exemplairesResult.data as unknown as ExemplaireOption[]) || [])
        setLoans((loansResult.data as unknown as ActiveLoan[]) || [])
        } finally {
        setLoading(false)
        }
    }, [supabase])

    useEffect(() => {
        const fetchData = async () => {
        await loadData()
        }
        void fetchData()
    }, [loadData])

    const handleBarcodeSearch = () => {
        const trimmed = barcodeInput.trim()
        if (!trimmed) {
        setSelectedExemplaire(null)
        return
        }
        const found = availableExemplaires.find(
        (exemplaire) => exemplaire.barcode.toLowerCase() === trimmed.toLowerCase()
        )
        setSelectedExemplaire(found || null)
    }

    const handleCreateLoan = async () => {
        if (!memberId || !selectedExemplaire || !dueDate) {
        alert("Veuillez remplir tous les champs et scanner un exemplaire valide.")
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
        notified_overdue: false
        })

        if (!error) {
        await supabase
            .from("exemplaires")
            .update({ status: "loaned" })
            .eq("id", selectedExemplaire.id)

        setMemberId("")
        setBarcodeInput("")
        setSelectedExemplaire(null)
        setDueDate("")
        await loadData()
        } else {
        alert("Erreur : " + error.message)
        }

        setSaving(false)
    }

    const handleReturn = async () => {
        if (!returnLoan) return
        setSaving(true)

        const today = new Date()
        const member = first(returnLoan.members)
        const doc = first(returnLoan.documents)

        const { error } = await supabase.from("retours").insert({
        pret_id: returnLoan.id,
        member_id: member?.id,
        document_id: doc?.id,
        exemplaire_id: returnLoan.exemplaire_id,
        return_date: today.toISOString(),
        book_condition: condition,
        notes: notes || null
        })

        if (error) {
        alert("Erreur : " + error.message)
        setSaving(false)
        return
        }

        setReturnLoan(null)
        setCondition("good")
        setNotes("")
        await loadData()
        setSaving(false)
    }

    const today = new Date()

    return (
        <div className="space-y-6">
        <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Circulation</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
            Empruntez et retournez des exemplaires physiques précis.
            </p>
        </div>

        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
                <Plus className="w-5 h-5 text-amber-500" />
                Nouvel emprunt d&apos;exemplaire
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
                    {members.map((member) => (
                    <option key={member.id} value={member.id}>
                        {member.first_name} {member.last_name}
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
                    placeholder="Scanner ou saisir le code-barres"
                    autoFocus
                    />
                    <Button type="button" variant="outline" onClick={handleBarcodeSearch}>
                    <ScanLine className="w-4 h-4" />
                    </Button>
                </div>

                {selectedExemplaire && (
                    <div className="mt-2 p-2 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded text-sm">
                    <div className="font-semibold text-emerald-900 dark:text-emerald-300">
                        ✓ {first(selectedExemplaire.documents)?.title || "Document inconnu"}
                    </div>
                    {/* 🌟 Utilisation de la nouvelle fonction */}
                    <div className="text-emerald-700 dark:text-emerald-400 text-xs">
                        {getAuthorName(first(selectedExemplaire.documents))} • {selectedExemplaire.barcode}
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
                <label className="text-sm font-medium mb-1 block">Date de retour prévue</label>
                <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                </div>
            </div>

            <div className="mt-4 flex justify-end">
                <Button
                onClick={handleCreateLoan}
                disabled={saving || !selectedExemplaire}
                className="bg-amber-500 hover:bg-amber-600 text-white"
                >
                <BookOpen className="w-4 h-4 mr-2" />
                Emprunter l&apos;exemplaire
                </Button>
            </div>
            </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
                <BookOpen className="w-5 h-5 text-amber-500" />
                Exemplaires disponibles ({availableExemplaires.length})
            </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
            {loading ? (
                <div className="p-8 text-center text-slate-500">Chargement...</div>
            ) : availableExemplaires.length === 0 ? (
                <div className="p-8 text-center text-slate-500">Aucun exemplaire disponible.</div>
            ) : (
                <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Document</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Auteur</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Code-barres</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Statut</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {availableExemplaires.map((exemplaire) => {
                        const doc = first(exemplaire.documents)
                        return (
                        <tr key={exemplaire.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <td className="px-6 py-4">
                            <div className="font-medium text-slate-900 dark:text-white">
                                {doc?.title || "Document inconnu"}
                            </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                            {getAuthorName(doc)}
                            </td>
                            <td className="px-6 py-4">
                            <Badge variant="outline" className="font-mono text-xs">
                                {exemplaire.barcode}
                            </Badge>
                            </td>
                            <td className="px-6 py-4">
                            <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
                                Disponible
                            </Badge>
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

        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
                <RotateCcw className="w-5 h-5 text-amber-500" />
                Emprunts en cours ({loans.length})
            </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
            {loans.length === 0 ? (
                <div className="p-8 text-center text-slate-500">Aucun emprunt en cours.</div>
            ) : (
                <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Document</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Exemplaire</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Membre</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Retour prévu</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Action</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {loans.map((loan) => {
                        const member = first(loan.members)
                        const doc = first(loan.documents)
                        const exemplaire = first(loan.exemplaires)
                        const isOverdue = new Date(loan.due_date) < today

                        return (
                        <tr key={loan.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <td className="px-6 py-4">
                            <div className="font-medium text-slate-900 dark:text-white">
                                {doc?.title || "Inconnu"}
                            </div>
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
                            <td className={`px-6 py-4 ${isOverdue ? "text-red-600 font-semibold" : "text-slate-700 dark:text-slate-300"}`}>
                            {new Date(loan.due_date).toLocaleDateString("fr-FR")}
                            </td>
                            <td className="px-6 py-4 text-right">
                            <Button size="sm" variant="outline" onClick={() => setReturnLoan(loan)}>
                                <RotateCcw className="w-4 h-4 mr-1" />
                                Retour
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
                    {first(returnLoan.documents)?.title}
                    </p>
                    <p className="text-sm text-slate-500 mt-1">
                    {getAuthorName(first(returnLoan.documents))}
                    </p>
                    <Badge variant="outline" className="font-mono text-xs mt-2">
                    {first(returnLoan.exemplaires)?.barcode}
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
                    <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ex: couverture déchirée" />
                </div>

                <Button onClick={handleReturn} disabled={saving} className="w-full bg-amber-500 hover:bg-amber-600 text-white">
                    Confirmer le retour
                </Button>
                </CardContent>
            </Card>
            </div>
        )}
        </div>
    )
    }