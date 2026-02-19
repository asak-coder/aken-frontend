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
}

export default function RevenueChart({ leads }: { leads: Lead[] }) {
  const wonRevenue = leads
    .filter((l) => l.status === "Won")
    .reduce((sum, l) => sum + (l.dealValue || 0), 0);

  const pipelineRevenue = leads
    .filter((l) => l.status !== "Won" && l.status !== "Lost")
    .reduce((sum, l) => sum + (l.dealValue || 0), 0);

  const data = {
    labels: ["Won Revenue", "Pipeline Revenue"],
    datasets: [
      {
        label: "Revenue (₹)",
        data: [wonRevenue, pipelineRevenue],
      },
    ],
  };

  return (
    <div className="bg-gray-900 p-6 rounded-xl mt-8">
      <h2 className="text-xl font-bold mb-4">Revenue Overview</h2>
      <Bar data={data} />
    </div>
  );
}
