export function WaterBarHeader() {
  return (
    <div className="relative flex items-center py-3 bg-gradient-to-b from-cream-50 to-beige-100">
      <div className="container mx-auto px-4 flex items-center">
        <div className="flex items-center">
          <div className="w-8 h-8 mr-2">
            <svg viewBox="0 0 100 100" className="w-full h-full text-cyan-400">
              <polygon 
                points="50,10 90,90 10,90" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="4"
                className="glow"
              />
            </svg>
          </div>
          <h1
            className="text-2xl font-serif text-amber-900 tracking-wide"
            style={{ fontFamily: "Playfair Display, serif" }}
          >
            The Water Bar
          </h1>
        </div>
      </div>
    </div>
  )
}
