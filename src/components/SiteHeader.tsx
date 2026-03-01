import Link from "next/link";
import {
  CONTACT_EMAIL,
  CONTACT_PHONE_DISPLAY,
  CONTACT_PHONE_E164,
} from "@/lib/contact";

export default function SiteHeader() {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="bg-black px-4 py-2 text-center text-xs text-white md:text-sm">
        Industrial EPC Contractor | Sambalpur, Odisha | Pan-India Project Execution
      </div>

      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4">
        <div>
          <Link href="/" className="text-lg font-bold text-black md:text-xl">
            A K ENGINEERING
          </Link>
          <p className="text-xs text-gray-600 md:text-sm">
            PEB | Steel Fabrication | Industrial Erection
          </p>
        </div>

        <nav className="flex flex-wrap items-center gap-3 text-sm font-medium md:gap-5">
          <Link href="/" className="text-gray-800 hover:text-black">
            Home
          </Link>
          <Link href="/services" className="text-gray-800 hover:text-black">
            Services
          </Link>
          <Link href="/about" className="text-gray-800 hover:text-black">
            About
          </Link>
          <Link href="/blog" className="text-gray-800 hover:text-black">
            Blog
          </Link>
          <Link href="/contact" className="text-gray-800 hover:text-black">
            Contact
          </Link>
          <Link href="/privacy-policy" className="text-gray-800 hover:text-black">
            Privacy
          </Link>
          <Link href="/terms-and-conditions" className="text-gray-800 hover:text-black">
            Terms
          </Link>
        </nav>

        <div className="flex flex-wrap items-center gap-2 text-sm">
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="rounded border border-gray-300 px-3 py-1 text-gray-700 hover:bg-gray-50"
          >
            {CONTACT_EMAIL}
          </a>
          <a
            href={`tel:${CONTACT_PHONE_E164}`}
            className="rounded bg-black px-3 py-1 font-semibold text-white hover:bg-gray-800"
          >
            {CONTACT_PHONE_DISPLAY}
          </a>
        </div>
      </div>
    </header>
  );
}
