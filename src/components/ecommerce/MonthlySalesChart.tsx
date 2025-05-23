import { useEffect, useRef, useState } from "react";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ChartOptions, ChartData, Plugin } from "chart.js";
import { API_BASE_URL } from "../../config";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface MonthlySalesChartProps {
  startDate?: Date | null;
  endDate?: Date | null;
  locationId?: string;
}

export default function MonthlySalesChart({ startDate, endDate, locationId }: MonthlySalesChartProps) {
  const [chartData, setChartData] = useState<ChartData<"bar"> | null>(null);
  const chartRef = useRef<any>(null);

  const formatDate = (date: Date) => {
    const adjusted = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    return adjusted.toISOString().split("T")[0];
  };

  useEffect(() => {
    if (!startDate || !endDate) {
      setChartData(null);
      return;
    }

    const fetchMonthlyRevenue = async () => {
      const token = localStorage.getItem("authToken");
      if (!token) {
        setChartData(null);
        return;
      }

      try {
        const params = new URLSearchParams({
          groupType: "month",
          fromDate: formatDate(startDate!),
          toDate: formatDate(endDate!),
        });

        if (locationId) {
          params.append("locationId", locationId);
        }

        const response = await fetch(`${API_BASE_URL}/app-data-service/api/invoices/revenue/grouped?${params.toString()}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (!response.ok) {
          setChartData(null);
          return;
        }
        const rawData = await response.json();

        const startMonth = formatDate(startDate!).slice(0, 7);
        const endMonth = formatDate(endDate!).slice(0, 7);

        const filteredData = rawData.filter((item: any) => {
          if (!item.period) return false;
          return item.period >= startMonth && item.period <= endMonth;
        });

        const revenueMap: Record<string, number> = {};
        for (const item of filteredData) {
          revenueMap[item.period] = (revenueMap[item.period] || 0) + (item.totalRevenue || 0);
        }

        const labels = Object.keys(revenueMap).sort();
        const revenues = labels.map((label) => revenueMap[label]);

        const gradient = (context: any) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;

          if (!chartArea) return "#3b82f6";

          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, "#60a5fa");
          gradient.addColorStop(1, "#3b82f6");
          return gradient;
        };

        setChartData({
          labels,
          datasets: [
            {
              label: "Monthly Revenue",
              data: revenues,
              backgroundColor: gradient,
              borderRadius: 6,
              hoverBackgroundColor: "#2563eb",
              barThickness: 20,
            },
          ],
        });
      } catch (error) {
        console.error("Error fetching chart data", error);
        setChartData(null);
      }
    };

    fetchMonthlyRevenue();
  }, [startDate, endDate, locationId]);

  const dataLabelPlugin: Plugin<"bar"> = {
    id: "dataLabelPlugin",
    afterDatasetsDraw(chart) {
      const { ctx } = chart;
      chart.data.datasets.forEach((dataset, i) => {
        const meta = chart.getDatasetMeta(i);
        meta.data.forEach((bar, index) => {
          const value = dataset.data[index] as number;
          ctx.fillStyle = "#111827";
          ctx.font = "bold 12px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(`$${value.toLocaleString()}`, bar.x, bar.y - 6);
        });
      });
    },
  };

  const options: ChartOptions<"bar"> = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        color: "#1f2937",
        font: { size: 18, weight: "bold" },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: "#6b7280",
          callback: (value) => `$${value}`,
        },
        grid: {
          color: "#e5e7eb",
        },
      },
      x: {
        ticks: {
          color: "#6b7280",
        },
        grid: {
          display: false,
        },
      },
    },
  };

  if (!chartData) return <div className="text-gray-500 dark:text-gray-300">Loading chart...</div>;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-md border border-gray-200 dark:border-gray-700">
      <Bar ref={chartRef} data={chartData} options={options} plugins={[dataLabelPlugin]} />
    </div>
  );
}
