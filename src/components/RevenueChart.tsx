"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface Lead {
  dealValue?: number;
  status?: string;
  createdAt: string;
}

export default function RevenueChart({ leads }: { leads: Lead[] }) {
  const monthlyRevenue: Record<string, number> = {};

  leads.forEach((lead) => {
    if (lead.status === "Won") {
      const date = new Date(lead.createdAt);
      const month = date.toLocaleString("default", { month: "short" });

      monthlyRevenue[month] =
        (monthlyRevenue[month] || 0) + (lead.dealValue || 0);
    }
  });

  const labels = Object.keys(monthlyRevenue);
  const dataValues = Object.values(monthlyRevenue);

  const data = {
    labels,
    datasets: [
      {
        label: "Monthly Won Revenue (₹)",
        data: dataValues,
      },
    ],
  };

  return (
    <div className="bg-gray-900 p-6 rounded-xl mt-8">
      <h2 className="text-xl font-bold mb-4">
        Monthly Revenue Performance
      </h2>
      <Bar data={data} />
    </div>
  );
}
