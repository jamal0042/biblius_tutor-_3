    /* eslint-disable react-hooks/refs */
    "use client"

    import * as React from "react"
    import Image from "next/image"
    import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
    } from "@/components/ui/carousel"
    import Autoplay from "embla-carousel-autoplay"

    const slides = [
    { id: 1, image: "/images/slide1.jpg", title: "Des milliers d ouvrages a portee de main", description: "Explorez notre catalogue physique et numerique enrichi chaque semaine." },
    { id: 2, image: "/images/slide2.jpg", title: "Un espace de lecture moderne et connecte", description: "Reservez vos salles d etude et empruntez vos livres en quelques clics." },
    { id: 3, image: "/images/slide3.jpg", title: "Acces numerique 24h/24 et 7j/7", description: "Consultez vos e-books, theses et articles scientifiques depuis chez vous." },
    { id: 4, image: "/images/slide4.jpg", title: "Un personnel dedie a votre service", description: "Notre equipe de bibliothecaires est la pour vous accompagner dans vos recherches." },
    { id: 5, image: "/images/slide5.jpg", title: "Evenements et animations culturelles", description: "Participez a nos conferences, clubs de lecture et ateliers tout au long de l annee." }
    ]

    export function HeroCarousel() {
    //ICI : delay est passé à 30000 millisecondes (30 secondes)
    const plugin = React.useRef(
        Autoplay({ delay: 30000, stopOnInteraction: true })
    )

    return (
        <Carousel 
        plugins={[plugin.current]} 
        className="w-full relative group"
        onMouseEnter={() => plugin.current.stop()}
        onMouseLeave={() => plugin.current.reset()}
        >
        <CarouselContent>
            {slides.map((slide) => (
            <CarouselItem key={slide.id}>
                <div className="relative w-full h-[400px] md:h-[500px] overflow-hidden bg-slate-200 dark:bg-slate-800">
                <Image
                    src={slide.image}
                    alt={slide.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    priority={slide.id === 1}
                    sizes="100vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent dark:from-slate-950/95 dark:via-slate-950/60" />
                <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16 text-white">
                    <h2 className="text-3xl md:text-5xl font-bold mb-4 drop-shadow-lg">{slide.title}</h2>
                    <p className="text-lg md:text-xl text-slate-200 max-w-2xl drop-shadow-md">{slide.description}</p>
                </div>
                </div>
            </CarouselItem>
            ))}
        </CarouselContent>
        
        {/* Flèches de navigation (visibles au survol) */}
        <CarouselPrevious className="left-4 bg-white/20 hover:bg-white/40 text-white border-0 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity" />
        <CarouselNext className="right-4 bg-white/20 hover:bg-white/40 text-white border-0 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity" />
        </Carousel>
    )
    }