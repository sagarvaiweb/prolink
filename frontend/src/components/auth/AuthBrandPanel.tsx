// A purely visual component i.e  no logic, no Redux, no state.
// It just renders the left-side branding panel from the design.

export default function AuthBrandPanel() {
  return (
    <div className="hidden lg:flex lg:w-1/2 relative bg-linear-to-br from-blue-950 via-blue-900 to-blue-800 text-white p-12 flex-col justify-between overflow-hidden">
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_30%, white_1px,_transparent_1px)] bg-size-[40px_40px]" />

      <div className="relative z-10 flex items-center gap-2">
        <div className="w-9 h-9 rounded bg-white text-blue-900 flex items-center justify-center font-bold">
          P
        </div>
        <span className="text-xl font-semibold">ProLink</span>
      </div>

      <div className="relative z-10 max-w-md">
        <span className="inline-block text-xs bg-white/10 border border-white/20 rounded-full px-3 py-1 mb-6">
          Trusted by growing professionals
        </span>
        <h1 className="text-5xl font-bold leading-tight mb-4">
          Where careers <br />
          <span className="italic text-yellow-400">connect</span> and grow.
        </h1>
        <p className="text-blue-100 mb-8">
          Build your professional presence, discover meaningful
          opportunities, and stay in touch with people who move your
          career forward.
        </p>
        <ul className="space-y-3 text-sm text-blue-100">
          <li className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-yellow-400 inline-block" />
            Curated jobs matched to your skills
          </li>
          <li className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-yellow-400 inline-block" />
            Direct messages with recruiters
          </li>
          <li className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-yellow-400 inline-block" />
            Insights from your industry, weekly
          </li>
        </ul>
      </div>

      <div className="relative z-10 text-sm text-blue-200">
        Joined this week — thousands of new professionals
      </div>
    </div>
  );
}