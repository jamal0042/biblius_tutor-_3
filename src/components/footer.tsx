    import { Globe, Mail, Shield, HelpCircle } from "lucide-react"
    import Link from "next/link"
    import { Logo } from "@/components/logo"

    export function Footer() {
    return (
        <footer className="bg-slate-900 dark:bg-slate-950 border-t border-slate-800 text-slate-300">
        <div className="max-w-7xl mx-auto px-6 py-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            
            {/* Colonne 1: Logo et reseaux */}
            <div className="space-y-4">
                <Logo showSubtitle={true} />
                <p className="text-sm text-slate-400">
                Systeme integre de Gestion de Bibliotheque moderne et performant.
                </p>
                
                {/* Icones de contact / reseaux */}
                <div className="flex items-center gap-3 pt-2">
                <a href="#" className="p-2 rounded-lg bg-slate-800 hover:bg-amber-500/20 hover:text-amber-500 transition-colors">
                    <Globe className="w-4 h-4" />
                </a>
                <a href="#" className="p-2 rounded-lg bg-slate-800 hover:bg-amber-500/20 hover:text-amber-500 transition-colors">
                    <Mail className="w-4 h-4" />
                </a>
                <a href="#" className="p-2 rounded-lg bg-slate-800 hover:bg-amber-500/20 hover:text-amber-500 transition-colors">
                    <Shield className="w-4 h-4" />
                </a>
                <a href="#" className="p-2 rounded-lg bg-slate-800 hover:bg-amber-500/20 hover:text-amber-500 transition-colors">
                    <HelpCircle className="w-4 h-4" />
                </a>
                </div>
            </div>

            {/* Colonne 2: A propos */}
            <div>
                <h3 className="text-white font-semibold mb-4">A propos</h3>
                <ul className="space-y-2 text-sm">
                <li>
                    <Link href="/about" className="text-slate-400 hover:text-amber-500 transition-colors">
                    A propos de Biblius
                    </Link>
                </li>
                <li>
                    <Link href="/features" className="text-slate-400 hover:text-amber-500 transition-colors">
                    Fonctionnalites
                    </Link>
                </li>
                <li>
                    <Link href="/demo" className="text-slate-400 hover:text-amber-500 transition-colors">
                    Demander une demo
                    </Link>
                </li>
                <li>
                    <Link href="/pricing" className="text-slate-400 hover:text-amber-500 transition-colors">
                    Tarifs
                    </Link>
                </li>
                <li>
                    <Link href="/contact" className="text-slate-400 hover:text-amber-500 transition-colors">
                    Nous contacter
                    </Link>
                </li>
                </ul>
            </div>

            {/* Colonne 3: Ressources */}
            <div>
                <h3 className="text-white font-semibold mb-4">Ressources</h3>
                <ul className="space-y-2 text-sm">
                <li>
                    <Link href="/catalogue" className="text-slate-400 hover:text-amber-500 transition-colors">
                    Catalogue
                    </Link>
                </li>
                <li>
                    <Link href="/documentation" className="text-slate-400 hover:text-amber-500 transition-colors">
                    Documentation
                    </Link>
                </li>
                <li>
                    <Link href="/guides" className="text-slate-400 hover:text-amber-500 transition-colors">
                    Guides d utilisation
                    </Link>
                </li>
                <li>
                    <Link href="/faq" className="text-slate-400 hover:text-amber-500 transition-colors">
                    FAQ
                    </Link>
                </li>
                <li>
                    <Link href="/support" className="text-slate-400 hover:text-amber-500 transition-colors">
                    Support technique
                    </Link>
                </li>
                </ul>
            </div>

            {/* Colonne 4: Informations legales */}
            <div>
                <h3 className="text-white font-semibold mb-4">Informations</h3>
                <ul className="space-y-2 text-sm">
                <li>
                    <Link href="/privacy" className="text-slate-400 hover:text-amber-500 transition-colors">
                    Politique de confidentialite
                    </Link>
                </li>
                <li>
                    <Link href="/terms" className="text-slate-400 hover:text-amber-500 transition-colors">
                    Conditions d utilisation
                    </Link>
                </li>
                <li>
                    <Link href="/security" className="text-slate-400 hover:text-amber-500 transition-colors">
                    Securite
                    </Link>
                </li>
                <li>
                    <Link href="/accessibility" className="text-slate-400 hover:text-amber-500 transition-colors">
                    Accessibilite
                    </Link>
                </li>
                </ul>
            </div>
            </div>

            {/* Ligne de copyright */}
            <div className="border-t border-slate-800 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-400 text-center md:text-left">
                Copyright © {new Date().getFullYear()} Biblius. Tous droits reserves.
            </p>
            <p className="text-xs text-slate-500">
                Version 1.0.0
            </p>
            </div>
        </div>
        </footer>
    )
    }