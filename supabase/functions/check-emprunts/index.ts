// import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY")!
// const SENDER_EMAIL = Deno.env.get("SENDER_EMAIL") || "votre-email-valide-dans-brevo@gmail.com"
// const TARIFF_PENALTY_PER_DAY = 100 // Ex: 100 FC par jour de retard

// serve(async (req) => {
//   // Connexion au projet Supabase via le Service Role Key
//   const supabase = createClient(
//     Deno.env.get("SUPABASE_URL")!,
//     Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
//   )

//   // 1. Récupérer les prêts actifs (non encore retournés)
//   const { data: prets, error } = await supabase
//     .from('prets')
//     .select(`
//       id, 
//       due_date, 
//       notified_overdue,
//       members (first_name, last_name, email), 
//       documents (title)
//     `)
//     .eq('status', 'active')

//   if (error) {
//     return new Response(JSON.stringify({ error: error.message }), { status: 500 })
//   }

//   const resultats = []

//   for (const item of prets) {
//     // Vérification de la présence des données associées
//     const member = Array.isArray(item.members) ? item.members[0] : item.members
//     const document = Array.isArray(item.documents) ? item.documents[0] : item.documents

//     if (!member?.email || !document?.title) continue

//     const memberName = `${member.first_name || ''} ${member.last_name || ''}`.trim() || 'Membre'
//     const due_date = new Date(item.due_date)
//     const aujourdhui = new Date()
    
//     // Calcul de la différence en jours
//     const diffTemps = due_date.getTime() - aujourdhui.getTime()
//     const diffJours = Math.ceil(diffTemps / (1000 * 3600 * 24))

//     let sujet = ""
//     let contenuEmail = ""
//     let shouldUpdateNotified = false

//     // 2. Logique d'alerte et calcul d'amende
//     if (diffJours === 2) {
//       // Rappel à J-2 avant échéance
//       sujet = `Rappel : Restitution du document "${document.title}"`
//       contenuEmail = `Bonjour ${memberName},\n\nCeci est un rappel pour vous informer que le document "${document.title}" doit être rendu dans 2 jours.\n\nCordialement,\nLa Bibliothèque.`
//     } else if (diffJours < 0) {
//       // Retard constaté
//       const daysLate = Math.abs(diffJours)
//       const penaltyAmount = daysLate * TARIFF_PENALTY_PER_DAY

//       sujet = `RETARD : Restitution urgente de "${document.title}"`
//       contenuEmail = `Bonjour ${memberName},\n\nLe document "${document.title}" devait être rendu il y a ${daysLate} jour(s).\n` +
//                      `Une pénalité estimée à ${penaltyAmount} FC a été accumulée.\n` +
//                      `Merci de le ramener au plus vite à la bibliothèque.\n\nCordialement,\nLa Bibliothèque.`

//       shouldUpdateNotified = true
//     } else {
//       // Prêt dans les délais (supérieur à 2 jours), pas d'action
//       continue
//     }

//     // 3. Envoi du mail via l'API Brevo
//     const envoiEmail = await fetch("https://api.brevo.com/v3/smtp/email", {
//       method: "POST",
//       headers: {
//         "api-key": BREVO_API_KEY,
//         "Content-Type": "application/json"
//       },
//       body: JSON.stringify({
//         sender: { name: "Bibliothèque", email: SENDER_EMAIL },
//         to: [{ email: member.email, name: memberName }],
//         subject: sujet,
//         textContent: contenuEmail
//       })
//     })

//     // 4. Si l'email a été envoyé avec succès pour un retard, marquer le prêt comme notifié
//     if (envoiEmail.ok && shouldUpdateNotified) {
//       await supabase
//         .from('prets')
//         .update({ notified_overdue: true })
//         .eq('id', item.id)
//     }

//     resultats.push({ 
//       pret_id: item.id, 
//       membre: memberName, 
//       statut_email: envoiEmail.status 
//     })
//   }

//   return new Response(JSON.stringify({ message: "Traitement des alertes terminé", resultats }), {
//     headers: { "Content-Type": "application/json" },
//     status: 200,
// //   })
// })