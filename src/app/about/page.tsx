export const metadata = {
  title: "About A K ENGINEERING | Industrial EPC & PEB Contractor",
  description:
    "A K ENGINEERING is an Industrial EPC contractor specializing in Pre-Engineered Buildings, Structural Steel Fabrication and Industrial Erection services across India.",
};

export default function AboutPage() {
  return (
    <main className="bg-white text-gray-900">

      {/* HERO */}
      <section className="bg-black text-white py-20 text-center px-6">
        <h1 className="text-4xl md:text-5xl font-bold mb-6">
          About A K ENGINEERING
        </h1>
        <p className="max-w-3xl mx-auto text-lg text-gray-300">
          Industrial Engineering. Structural Precision. Reliable Execution.
        </p>
      </section>

      {/* COMPANY OVERVIEW */}
      <section className="py-20 px-6 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold mb-6">
          Company Overview
        </h2>

        <p className="text-lg text-gray-700 leading-relaxed mb-6">
          A K ENGINEERING is a professional Industrial EPC contractor
          specializing in Pre-Engineered Buildings (PEB), Structural Steel
          Fabrication, Industrial Shed Construction, Equipment Erection and
          Maintenance Services. We serve industrial clients across India
          including Power Plants, Cement Industries, Mining Operations and
          Manufacturing Units.
        </p>

        <p className="text-lg text-gray-700 leading-relaxed">
          Our approach combines engineering accuracy, skilled manpower,
          strict safety standards and disciplined project management to
          deliver high-quality steel infrastructure solutions.
        </p>
      </section>

      {/* OUR EXPERTISE */}
      <section className="bg-gray-100 py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center">
            Our Core Expertise
          </h2>

          <div className="grid md:grid-cols-3 gap-10">

            <div className="bg-white p-8 rounded-xl shadow-md">
              <h3 className="text-xl font-semibold mb-4">
                Pre-Engineered Buildings (PEB)
              </h3>
              <p className="text-gray-600">
                Design, fabrication and erection of industrial warehouses,
                factory sheds, multi-span buildings and customized steel
                structures.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-md">
              <h3 className="text-xl font-semibold mb-4">
                Structural Steel Fabrication
              </h3>
              <p className="text-gray-600">
                Heavy structural fabrication including beams, columns, trusses,
                industrial platforms and support structures using quality-controlled processes.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-md">
              <h3 className="text-xl font-semibold mb-4">
                Industrial Erection & Execution
              </h3>
              <p className="text-gray-600">
                On-site structure erection, cladding works, equipment
                installation and shutdown maintenance projects.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* OUR VALUES */}
      <section className="py-20 px-6 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold mb-12 text-center">
          Our Values
        </h2>

        <div className="grid md:grid-cols-3 gap-10 text-center">

          <div>
            <h4 className="font-semibold text-xl mb-3">
              Safety First
            </h4>
            <p className="text-gray-600">
              Strict adherence to industrial safety standards and compliance
              requirements.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-xl mb-3">
              Engineering Precision
            </h4>
            <p className="text-gray-600">
              Accurate fabrication, structural detailing and quality checks at
              every stage of execution.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-xl mb-3">
              Timely Delivery
            </h4>
            <p className="text-gray-600">
              Strong project coordination ensuring delivery within committed
              timelines and budgets.
            </p>
          </div>

        </div>
      </section>

      {/* INDUSTRIES WE SERVE */}
      <section className="bg-black text-white py-20 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-10">
            Industries We Serve
          </h2>

          <div className="grid md:grid-cols-4 gap-6">

            <div className="border border-gray-700 py-6 rounded-lg">
              Power Plants
            </div>

            <div className="border border-gray-700 py-6 rounded-lg">
              Cement Industries
            </div>

            <div className="border border-gray-700 py-6 rounded-lg">
              Mining Sector
            </div>

            <div className="border border-gray-700 py-6 rounded-lg">
              Manufacturing Units
            </div>

          </div>
        </div>
      </section>

      {/* CALL TO ACTION */}
      <section className="py-20 px-6 text-center bg-yellow-500 text-black">
        <h2 className="text-3xl font-bold mb-6">
          Looking for a Reliable Industrial EPC Partner?
        </h2>
        <p className="mb-6 text-lg">
          Contact A K ENGINEERING for technical consultation and
          competitive project execution.
        </p>

        <a
          href="/contact"
          className="bg-black text-white px-8 py-3 rounded-lg font-semibold hover:bg-gray-800 transition"
        >
          Contact Us
        </a>
      </section>

      {/* FOOTER */}
      <footer className="bg-black text-white py-10 text-center text-sm">
        <p>
          © {new Date().getFullYear()} A K ENGINEERING. All Rights Reserved.
        </p>
      </footer>

    </main>
  );
}