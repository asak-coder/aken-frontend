import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title:
    "Industrial EPC & PEB Company in India | A K ENGINEERING",
  description:
    "Leading Industrial EPC Contractor specializing in Pre Engineered Buildings (PEB), Structural Steel Fabrication, Industrial Shed Construction and Erection Services across India.",
  keywords:
    "PEB Company India, Industrial EPC Contractor, Steel Fabrication Company, Industrial Shed Construction, Structural Steel Erection",
};

export default function Home() {
  return (
    <main className="bg-white text-gray-900">

      {/* HERO SECTION */}
      <section className="bg-black text-white py-24 px-6 text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-6">
          Industrial EPC & Pre-Engineered Building Experts
        </h1>
        <p className="max-w-3xl mx-auto text-lg md:text-xl mb-8 text-gray-300">
          A K ENGINEERING delivers high-performance Pre-Engineered Buildings,
          Structural Steel Fabrication, Industrial Erection & Turnkey EPC
          Solutions across India for Power Plants, Cement, Mining and
          Manufacturing Industries.
        </p>

        <div className="flex justify-center gap-4 flex-wrap">
          <Link
            href="/contact"
            className="bg-yellow-500 text-black px-6 py-3 rounded-lg font-semibold hover:bg-yellow-400 transition"
          >
            Request Industrial Quotation
          </Link>

          <a
            href="tel:+919999999999"
            className="border border-white px-6 py-3 rounded-lg hover:bg-white hover:text-black transition"
          >
            Call Now
          </a>
        </div>
      </section>

      {/* ABOUT SECTION */}
      <section className="py-20 px-6 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold mb-6 text-center">
          Trusted Industrial EPC Partner
        </h2>
        <p className="text-lg text-gray-700 leading-relaxed text-center">
          A K ENGINEERING is a professional Industrial EPC contractor
          specializing in Pre-Engineered Buildings (PEB), heavy structural steel
          fabrication, industrial shed construction, equipment erection, and
          maintenance services. We execute projects with strict safety
          compliance, precision engineering, and time-bound delivery standards.
        </p>
      </section>

      {/* SERVICES SECTION */}
      <section className="bg-gray-100 py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center">
            Our Core Services
          </h2>

          <div className="grid md:grid-cols-3 gap-10">

            <div className="bg-white p-8 rounded-xl shadow-md">
              <h3 className="text-xl font-semibold mb-4">
                Pre-Engineered Buildings (PEB)
              </h3>
              <p className="text-gray-600">
                Design and construction of industrial warehouses, factory
                sheds, multi-span structures, high-rise industrial buildings,
                and turnkey PEB solutions.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-md">
              <h3 className="text-xl font-semibold mb-4">
                Structural Steel Fabrication
              </h3>
              <p className="text-gray-600">
                Heavy structural fabrication including beams, columns, trusses,
                industrial platforms, conveyor structures and custom steel
                engineering works.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-md">
              <h3 className="text-xl font-semibold mb-4">
                Industrial Erection & Installation
              </h3>
              <p className="text-gray-600">
                Structure erection at height, equipment installation, cladding,
                sheeting, industrial maintenance and shutdown execution.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* INDUSTRIES WE SERVE */}
      <section className="py-20 px-6 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold mb-10 text-center">
          Industries We Serve
        </h2>

        <div className="grid md:grid-cols-4 gap-6 text-center">
          <div className="bg-black text-white py-6 rounded-lg">
            Power Plants
          </div>
          <div className="bg-black text-white py-6 rounded-lg">
            Cement Industries
          </div>
          <div className="bg-black text-white py-6 rounded-lg">
            Mining Sector
          </div>
          <div className="bg-black text-white py-6 rounded-lg">
            Manufacturing Units
          </div>
        </div>
      </section>

      {/* WHY CHOOSE US */}
      <section className="bg-gray-900 text-white py-20 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-8">
            Why Choose A K ENGINEERING?
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h4 className="font-semibold text-xl mb-2">
                Engineering Precision
              </h4>
              <p className="text-gray-400">
                Accurate structural detailing and quality-controlled
                fabrication processes.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-xl mb-2">
                Safety & Compliance
              </h4>
              <p className="text-gray-400">
                Strict adherence to industrial safety standards and regulatory
                guidelines.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-xl mb-2">
                Timely Execution
              </h4>
              <p className="text-gray-400">
                Strong project management ensuring on-time delivery with cost
                control.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="py-20 px-6 text-center bg-yellow-500 text-black">
        <h2 className="text-3xl font-bold mb-6">
          Planning an Industrial Project?
        </h2>
        <p className="mb-6 text-lg">
          Contact A K ENGINEERING today for a detailed technical consultation
          and competitive quotation.
        </p>
        <Link
          href="/contact"
          className="bg-black text-white px-8 py-3 rounded-lg font-semibold hover:bg-gray-800 transition"
        >
          Get Started Now
        </Link>
      </section>

      {/* FOOTER */}
      <footer className="bg-black text-white py-10 text-center text-sm">
        <p>
          © {new Date().getFullYear()} A K ENGINEERING. All Rights Reserved.
        </p>
        <p className="mt-2 text-gray-400">
          Industrial EPC | PEB Structures | Steel Fabrication | Industrial
          Erection Services
        </p>
      </footer>

    </main>
  );
}