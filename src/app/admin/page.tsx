"use client";

import { useEffect, useState } from "react";

interface Lead {
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
      .then(res => res.json())
      .then(data => {
        setLeads(data);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="text-white p-10">Loading...</div>;

  return (
    <div className="min-h-screen bg-black text-white p-10">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard – Leads</h1>
<div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
  <div className="bg-yellow-500 p-4 rounded-lg text-black text-center">
    <p className="text-sm">New</p>
    <p className="text-2xl font-bold">{statusCounts.New}</p>
  </div>

  <div className="bg-blue-500 p-4 rounded-lg text-white text-center">
    <p className="text-sm">Contacted</p>
    <p className="text-2xl font-bold">{statusCounts.Contacted}</p>
  </div>

  <div className="bg-purple-600 p-4 rounded-lg text-white text-center">
    <p className="text-sm">Quoted</p>
    <p className="text-2xl font-bold">{statusCounts.Quoted}</p>
  </div>

  <div className="bg-green-600 p-4 rounded-lg text-white text-center">
    <p className="text-sm">Won</p>
    <p className="text-2xl font-bold">{statusCounts.Won}</p>
  </div>

  <div className="bg-red-600 p-4 rounded-lg text-white text-center">
    <p className="text-sm">Lost</p>
    <p className="text-2xl font-bold">{statusCounts.Lost}</p>
  </div>
</div>

      <table className="min-w-full bg-gray-900 rounded-lg">
        <thead className="bg-gray-800">
          <tr>
            <th className="p-3">Name</th>
            <th className="p-3">Company</th>
            <th className="p-3">Phone</th>
            <th className="p-3">Status</th>
            <th className="p-3">Deal Value (₹)</th>

          </tr>
        </thead>
       <tbody>
  {leads.map((lead) => (
    <tr key={lead._id} className="border-t border-gray-700">
      <td className="p-3">{lead.contactPerson}</td>
      <td className="p-3">{lead.companyName}</td>
      <td className="p-3">{lead.phone}</td>
      <td className="p-3">
  ₹ {lead.dealValue?.toLocaleString() || 0}
</td>
<td className="p-3">
  <input
    type="number"
    value={lead.dealValue || 0}
    onChange={async (e) => {
      const newValue = Number(e.target.value);

      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/leads/${lead._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dealValue: newValue }),
        }
      );

      setLeads((prev) =>
        prev.map((l) =>
          l._id === lead._id ? { ...l, dealValue: newValue } : l
        )
      );
    }}
    className="text-black p-1 rounded w-24"
  />
</td>
<td className="p-3">
  <select
    value={lead.status}
    onChange={async (e) => {
      const newStatus = e.target.value;

      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/leads/${lead._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      setLeads((prev) =>
        prev.map((l) =>
          l._id === lead._id ? { ...l, status: newStatus } : l
        )
      );
    }}
    className="text-black p-1 rounded"
  >
    <option value="New">New</option>
    <option value="Contacted">Contacted</option>
    <option value="Quoted">Quoted</option>
    <option value="Won">Won</option>
    <option value="Lost">Lost</option>
  </select>
</td>


<td className="p-3">
  <div className="flex items-center gap-3">
    <span
      className={`px-3 py-1 rounded-full text-sm text-white ${getStatusColor(
        lead.status
      )}`}
    >
      {lead.status}
    </span>

    <select
      value={lead.status}
      onChange={async (e) => {
        const newStatus = e.target.value;

        await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/leads/${lead._id}/status`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ status: newStatus }),
          }
        );

        setLeads((prev) =>
          prev.map((l) =>
            l._id === lead._id ? { ...l, status: newStatus } : l
          )
        );
      }}
      className="bg-gray-800 p-2 rounded text-white"
    >
      <option value="New">New</option>
      <option value="Contacted">Contacted</option>
      <option value="Quoted">Quoted</option>
      <option value="Won">Won</option>
      <option value="Lost">Lost</option>
    </select>
  </div>
</td>

    </tr>
  ))}
</tbody>

      </table>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
        <div className="bg-green-700 p-6 rounded-lg text-white text-center">
          <p className="text-sm">Total Won Revenue</p>
          <p className="text-3xl font-bold">
            ₹ {totalRevenue.toLocaleString()}
          </p>
        </div>

        <div className="bg-indigo-700 p-6 rounded-lg text-white text-center">
          <p className="text-sm">Total Pipeline Value</p>
          <p className="text-3xl font-bold">
            ₹ {totalPipelineValue.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}
