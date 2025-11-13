import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  return (
    <div className="relative w-full h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10 pointer-events-none" />

      <div className="relative z-10 text-center space-y-12">
        <h1 className="text-7xl md:text-8xl font-black text-white [letter-spacing:-0.045em] mb-8">
          <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
            Three Sim
          </span>
        </h1>

        <p className="text-xl text-gray-400 mb-12">
          Explore 3D scenes and simulations
        </p>

        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
          <Link
            to="/shapes"
            className="group relative px-8 py-4 bg-cyan-500/10 border-2 border-cyan-400/50 rounded-lg hover:bg-cyan-500/20 hover:border-cyan-400 transition-all duration-300 shadow-lg hover:shadow-cyan-500/50"
          >
            <span className="text-2xl font-bold text-cyan-400 group-hover:text-cyan-300 transition-colors">
              Shapes
            </span>
          </Link>

          <Link
            to="/robots"
            className="group relative px-8 py-4 bg-purple-500/10 border-2 border-purple-400/50 rounded-lg hover:bg-purple-500/20 hover:border-purple-400 transition-all duration-300 shadow-lg hover:shadow-purple-500/50"
          >
            <span className="text-2xl font-bold text-purple-400 group-hover:text-purple-300 transition-colors">
              Robots
            </span>
          </Link>
        </div>
      </div>
    </div>
  )
}
