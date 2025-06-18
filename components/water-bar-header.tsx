export function WaterBarHeader() {
  return (
    <div className="relative flex flex-col items-center justify-center py-10 bg-gradient-to-b from-cream-50 to-beige-100">
      <div className="absolute inset-0 opacity-20">
        <img src="/abstract-light-pattern.png" alt="Background pattern" className="w-full h-full object-cover" />
      </div>
      <h1
        className="relative z-10 text-6xl font-serif text-amber-900 tracking-wide"
        style={{ fontFamily: "Playfair Display, serif" }}
      >
        The Water Bar
      </h1>
      <p className="relative z-10 text-lg text-amber-800 mt-2">Hydration & Holistic Wellness</p>
    </div>
  )
}
