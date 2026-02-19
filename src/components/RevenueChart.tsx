"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

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
        tension: 0.4, // smooth curve
      },
    ],
  };

  return (
    <div className="bg-gray-900 p-6 rounded-xl mt-8">
      <h2 className="text-xl font-bold mb-4">
        Revenue Growth Trend
      </h2>
      <Line data={data} />
    </div>
  );
}
