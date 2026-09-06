import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: Request) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide." }, { status: 400 })
  }

  const type = String(body.type || "").trim()
  const name = String(body.name || "").trim()
  const email = String(body.email || "").trim().toLowerCase()
  const subject = body.subject ? String(body.subject).trim() || null : null
  const message = body.message ? String(body.message).trim() || null : null
  const establishment = body.establishment ? String(body.establishment).trim() || null : null

  if (!type || !["contact", "demo"].includes(type)) {
    return NextResponse.json({ error: "Type invalide." }, { status: 400 })
  }
  if (!name) {
    return NextResponse.json({ error: "Le nom est obligatoire." }, { status: 400 })
  }
  if (!email) {
    return NextResponse.json({ error: "L'email est obligatoire." }, { status: 400 })
  }

  const { error } = await supabase.from("contact_messages").insert({
    type,
    name,
    email,
    subject,
    message,
    establishment,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
