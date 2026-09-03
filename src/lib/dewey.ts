// Génère la cote complète collée sur le dos du livre
// Ex : code "540.21" + auteur "Lavoisier" → "540.21 LAV"
export function genererCoteComplete(codeDewey: string, auteur: string): string {
  const cleanCode = codeDewey.trim()
  const cleanAuteur = auteur.trim()

  if (!cleanCode) return ""
  if (!cleanAuteur) return cleanCode

  // On prend le NOM (dernier mot) pour les 3 lettres
  const mots = cleanAuteur.split(/\s+/)
  const nom = mots[mots.length - 1] ?? cleanAuteur
  const lettres =
    nom.replace(/[^a-zA-Z]/g, "").substring(0, 3).toUpperCase() || "XXX"

  return `${cleanCode} ${lettres}`
}