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
}

export default function AdminDashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

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

      <table className="min-w-full bg-gray-900 rounded-lg">
        <thead className="bg-gray-800">
          <tr>
            <th className="p-3">Name</th>
            <th className="p-3">Company</th>
            <th className="p-3">Phone</th>
            <th className="p-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <tr key={lead._id} className="border-t border-gray-700">
              <td className="p-3">{lead.contactPerson}</td>
              <td className="p-3">{lead.companyName}</td>
              <td className="p-3">{lead.phone}</td>
              <td className="p-3">{lead.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
