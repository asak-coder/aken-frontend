"use client";
import { useEffect, useState } from "react";

interface Lead {
  owner: string;
  _id: string;
  contactPerson: string;
  email: string;
  companyName: string;
  phone: string;
  message: string;
  status: string;
  createdAt: string;
  dealValue?: number;
}

export default function AdminDashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const statusCounts = {
    New: leads.filter((l) => l.status === "New").length,
    Contacted: leads.filter((l) => l.status === "Contacted").length,
    Quoted: leads.filter((l) => l.status === "Quoted").length,
    Won: leads.filter((l) => l.status === "Won").length,
    Lost: leads.filter((l) => l.status === "Lost").length,
  };
  const totalRevenue = leads
    .filter((l) => l.status === "Won")
    .reduce((sum, l) => sum + (l.dealValue || 0), 0);

  const totalPipelineValue = leads.reduce(
    (sum, l) => sum + (l.dealValue || 0),
    0
  );

  function getStatusColor(status: string) {
    switch (status) {
      case "New":
        return "bg-yellow-500";
      case "Contacted":
        return "bg-blue-500";
      case "Quoted":
        return "bg-purple-500";
      case "Won":
        return "bg-green-600";
      case "Lost":
        return "bg-red-600";
      default:
        return "bg-gray-500";
    }
  }

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/leads`)
      .then((res) => res.json())
      .then((data) => {
        setLeads(data);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="text-white p-10">Loading...</div>;
const exportToCSV = () => {
  const headers = [
    "Name",
    "Email",
    "Company",
    "Phone",
    "Status",
    "Deal Value",
  ];

  const rows = leads.map((lead) => [
    lead.contactPerson,
    lead.email,
    lead.companyName,
    lead.phone,
    lead.status,
    lead.dealValue,
  ]);

  const csvContent =
    "data:text/csv;charset=utf-8," +
    [headers, ...rows].map((e) => e.join(",")).join("\n");

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "leads.csv");
  document.body.appendChild(link);
  link.click();
};
  const filteredLeads = leads.filter(
    (lead) =>
      lead.contactPerson.toLowerCase().includes(search.toLowerCase()) ||
      lead.companyName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-black text-white p-10">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard – Leads</h1>

{/* Charts Section */}
<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10"></div>

<div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
  {/* status cards… */}
</div>

<div className="mb-10">
  <input
    type="text"
    placeholder="Search by contact person..."
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    className="w-full p-2 rounded bg-gray-800 text-white mb-4"
  />
  <input
  type="text"
  placeholder="Search by name..."
  value={search}
  onChange={(e) => setSearch(e.target.value)}
  className="mb-4 p-2 text-black rounded"
/>
<button
  onClick={exportToCSV}
  className="bg-green-600 px-4 py-2 rounded mb-4"
>
  Export to Excel
</button>
  <table className="min-w-full bg-gray-900 rounded-lg">
  <tbody>
    {filteredLeads.map((lead) => (
      <tr key={lead._id}>
        <td className="p-3">
          <select
            value={lead.owner || "Unassigned"}
            onChange={async (e) => {
              const newOwner = e.target.value;

              await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/leads/${lead._id}`,
                {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ owner: newOwner }),
                }
              );

              setLeads((prev) =>
                prev.map((l) =>
                  l._id === lead._id ? { ...l, owner: newOwner } : l
                )
              );
            }}
            className="text-black p-1 rounded"
          >
            <option value="Unassigned">Unassigned</option>
            <option value="Ashis">Ashis</option>
            <option value="Sales-1">Sales-1</option>
            <option value="Sales-2">Sales-2</option>
          </select>
        </td>
      </tr>
    ))}
  </tbody>
  </table>
</div>

<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
        <div className="bg-green-700 p-6 rounded-lg text-white text-center">
          <p className="text-sm">Total Won Revenue</p>
          <p className="text-3xl font-bold">
            ₹ {totalRevenue.toLocaleString()}
          </p>
        </div>

        <div className="bg-indigo-700 p-6 rounded-lg text-white text-center">
          <p className="text-sm">Pipeline Value</p>
          <p className="text-3xl font-bold">
            ₹ {totalPipelineValue.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}
