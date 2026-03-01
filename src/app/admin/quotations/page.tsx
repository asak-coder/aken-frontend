"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type LeadSummary = {
  contactPerson?: string;
  companyName?: string;
  email?: string;
};

type Quotation = {
  _id: string;
  quotationNumber?: string;
  leadId?: LeadSummary | string | null;
  totalAmount?: number;
  status?: string;
  validTill?: string;
  createdAt?: string;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

function formatCurrency(amount?: number) {
  if (typeof amount !== "number") {
    return "-";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(value?: string) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getStatusClass(status?: string) {
  if (status === "Approved") {
    return "bg-green-100 text-green-700";
  }

  if (status === "Rejected") {
    return "bg-red-100 text-red-700";
  }

  if (status === "Sent") {
    return "bg-blue-100 text-blue-700";
  }

  return "bg-gray-200 text-gray-700";
}

function getLeadData(leadId?: LeadSummary | string | null) {
  if (!leadId || typeof leadId === "string") {
    return null;
  }

  return leadId;
}

export default function AdminQuotationsPage() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadQuotations = useCallback(async () => {
    if (!API_BASE_URL) {
      setError(
        "NEXT_PUBLIC_API_URL is missing. Set it in your frontend environment file.",
      );
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/quotations`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch quotations");
      }

      const data = (await response.json()) as Quotation[];
      setQuotations(Array.isArray(data) ? data : []);
    } catch {
      setError("Could not load quotations. Please try again.");
      setQuotations([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadQuotations();
  }, [loadQuotations]);

  const dashboardStats = useMemo(() => {
    const approvedCount = quotations.filter(
      (quotation) => quotation.status === "Approved",
    ).length;
    const sentCount = quotations.filter(
      (quotation) => quotation.status === "Sent",
    ).length;
    const totalValue = quotations.reduce((sum, quotation) => {
      return sum + (quotation.totalAmount ?? 0);
    }, 0);

    return {
      totalCount: quotations.length,
      approvedCount,
      sentCount,
      totalValue,
    };
  }, [quotations]);

  return (
    <main className="min-h-screen bg-black p-6 text-white md:p-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold md:text-4xl">Quotation Dashboard</h1>
            <p className="mt-2 text-gray-300">
              Monitor generated quotations and follow up with clients.
            </p>
          </div>

          <button
            onClick={() => void loadQuotations()}
            className="rounded-lg border border-white px-5 py-2 text-sm font-semibold hover:bg-white hover:text-black"
          >
            Refresh
          </button>
        </div>

        <section className="mb-8 grid gap-4 md:grid-cols-4">
          <div className="rounded-xl bg-gray-900 p-5">
            <p className="text-sm text-gray-400">Total Quotations</p>
            <p className="mt-2 text-2xl font-bold">{dashboardStats.totalCount}</p>
          </div>

          <div className="rounded-xl bg-gray-900 p-5">
            <p className="text-sm text-gray-400">Sent</p>
            <p className="mt-2 text-2xl font-bold">{dashboardStats.sentCount}</p>
          </div>

          <div className="rounded-xl bg-gray-900 p-5">
            <p className="text-sm text-gray-400">Approved</p>
            <p className="mt-2 text-2xl font-bold">{dashboardStats.approvedCount}</p>
          </div>

          <div className="rounded-xl bg-gray-900 p-5">
            <p className="text-sm text-gray-400">Pipeline Value</p>
            <p className="mt-2 text-2xl font-bold">
              {formatCurrency(dashboardStats.totalValue)}
            </p>
          </div>
        </section>

        {isLoading ? (
          <div className="rounded-xl bg-gray-900 p-8 text-center text-gray-300">
            Loading quotations...
          </div>
        ) : null}

        {error ? (
          <div className="mb-6 rounded-xl border border-red-500 bg-red-950 p-4 text-red-300">
            {error}
          </div>
        ) : null}

        {!isLoading && !error ? (
          <section className="overflow-hidden rounded-xl border border-gray-800">
            <div className="overflow-x-auto">
              <table className="min-w-full bg-gray-950 text-left text-sm">
                <thead className="bg-gray-900 text-gray-300">
                  <tr>
                    <th className="px-4 py-3">Quotation No.</th>
                    <th className="px-4 py-3">Client</th>
                    <th className="px-4 py-3">Company</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Valid Till</th>
                    <th className="px-4 py-3">Created</th>
                  </tr>
                </thead>

                <tbody>
                  {quotations.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                        No quotations found.
                      </td>
                    </tr>
                  ) : (
                    quotations.map((quotation) => {
                      const lead = getLeadData(quotation.leadId);
                      return (
                        <tr key={quotation._id} className="border-t border-gray-800">
                          <td className="px-4 py-3 font-semibold text-white">
                            {quotation.quotationNumber || "Not assigned"}
                          </td>

                          <td className="px-4 py-3 text-gray-200">
                            {lead?.contactPerson || "-"}
                          </td>

                          <td className="px-4 py-3 text-gray-300">
                            {lead?.companyName || "-"}
                          </td>

                          <td className="px-4 py-3 text-gray-200">
                            {formatCurrency(quotation.totalAmount)}
                          </td>

                          <td className="px-4 py-3">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                                quotation.status,
                              )}`}
                            >
                              {quotation.status || "Draft"}
                            </span>
                          </td>

                          <td className="px-4 py-3 text-gray-300">
                            {formatDate(quotation.validTill)}
                          </td>

                          <td className="px-4 py-3 text-gray-300">
                            {formatDate(quotation.createdAt)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
