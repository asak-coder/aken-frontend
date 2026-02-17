export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">

      {/* NAVBAR */}
      <header className="w-full p-6 border-b border-zinc-800 flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-wide">
          A K ENGINEERING
        </h1>

        <button className="px-4 py-2 bg-white text-black rounded-md font-semibold hover:bg-gray-200 transition">
          Get Quote
        </button>
      </header>

      {/* HERO SECTION */}
      <section className="flex flex-col items-center justify-center text-center py-28 px-6">

        <h2 className="text-5xl font-extrabold mb-8 leading-tight">
          Industrial EPC & <br />
          Pre-Engineered Building Solutions
        </h2>

        <p className="max-w-2xl text-lg text-zinc-400 mb-10">
          Delivering high-performance steel structures, heavy fabrication,
          and turnkey erection services across India with safety,
          precision, and reliability.
        </p>

        <div className="flex gap-6">
          <button className="px-8 py-4 bg-white text-black font-semibold rounded-md hover:bg-gray-300 transition">
            Request Proposal
          </button>

          <button className="px-8 py-4 border border-white font-semibold rounded-md hover:bg-white hover:text-black transition">
            View Projects
          </button>
        </div>

      </section>

      {/* SERVICES */}
      <section className="py-20 px-6 bg-zinc-900">
        <h3 className="text-3xl font-bold text-center mb-16">
          Our Core Services
        </h3>

        <div className="grid md:grid-cols-3 gap-10 max-w-6xl mx-auto">

          <div className="p-8 bg-zinc-800 rounded-xl hover:bg-zinc-700 transition">
            <h4 className="text-xl font-bold mb-4">
              PEB Structures
            </h4>
            <p className="text-zinc-400">
              Complete design, fabrication and erection of industrial PEB
              buildings for manufacturing, warehousing and power sectors.
            </p>
          </div>

          <div className="p-8 bg-zinc-800 rounded-xl hover:bg-zinc-700 transition">
            <h4 className="text-xl font-bold mb-4">
              Structural Fabrication
            </h4>
            <p className="text-zinc-400">
              Heavy MS fabrication, trusses, platforms, gantries,
              pipe racks and industrial steel components.
            </p>
          </div>

          <div className="p-8 bg-zinc-800 rounded-xl hover:bg-zinc-700 transition">
            <h4 className="text-xl font-bold mb-4">
              Erection & Installation
            </h4>
            <p className="text-zinc-400">
              Safe and compliant on-site execution for PSU,
              cement, mining and power plant industries.
            </p>
          </div>

        </div>
      </section>

      {/* FOOTER */}
      <footer className="text-center py-8 border-t border-zinc-800 text-zinc-500">
        © {new Date().getFullYear()} A K ENGINEERING | Sambalpur, Odisha | Industrial EPC Experts
      </footer>

    </div>
  );
}
