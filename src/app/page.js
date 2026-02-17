export default function Home() {
  return (
    <div className="min-h-screen bg-white text-black">

      {/* NAVBAR */}
      <header className="w-full p-6 border-b">
        <h1 className="text-2xl font-bold">
          A K ENGINEERING
        </h1>
      </header>

      {/* HERO SECTION */}
      <section className="flex flex-col items-center justify-center text-center py-20 px-6">
        <h2 className="text-4xl font-bold mb-6">
          Industrial EPC & PEB Solutions
        </h2>
        <p className="max-w-xl text-lg text-gray-600">
          Delivering Steel Structures, Fabrication, Erection &
          Industrial Engineering Services across India.
        </p>
      </section>

      {/* SERVICES */}
      <section className="py-16 px-6 bg-gray-50">
        <h3 className="text-3xl font-semibold text-center mb-12">
          Our Services
        </h3>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="p-6 bg-white shadow rounded-lg">
            <h4 className="text-xl font-bold mb-3">PEB Structures</h4>
            <p>Design, fabrication and erection of Pre-Engineered Buildings.</p>
          </div>

          <div className="p-6 bg-white shadow rounded-lg">
            <h4 className="text-xl font-bold mb-3">Steel Fabrication</h4>
            <p>Heavy structural fabrication and industrial steel works.</p>
          </div>

          <div className="p-6 bg-white shadow rounded-lg">
            <h4 cl
