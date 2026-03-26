"use client";

import { Chart, ChartData, ChartOptions } from "chart.js/auto";
import { Maximize2, Minimize2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface CategoryData {
  category_id: number;
  category_name: string;
  total_downloads: number;
  file_count: number;
}

const Page = () => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstanceRef = useRef<Chart | null>(null);
  const [isMaximized, setIsMaximized] = useState(false);

  const fetchCategoryData = async (): Promise<CategoryData[]> => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/stats/categories`
    );
    const result = await response.json();
    return result.data;
  };

  useEffect(() => {
    const initChart = async () => {
      const data = await fetchCategoryData();

      const chartData: ChartData = {
        labels: data.map((item) => item.category_name),
        datasets: [
          {
            label: "Total Downloads",
            data: data.map((item) => item.total_downloads),
            backgroundColor: "rgba(54, 162, 235, 0.6)",
          },
        ],
      };

      const chartOptions: ChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: "rgba(142, 142, 142, 0.1)",
            },
          },
          x: {
            grid: {
              color: "rgba(255, 255, 255, 0.1)",
            },
          },
        },
      };

      if (chartRef.current) {
        const ctx = chartRef.current.getContext("2d");
        if (ctx) {
          if (chartInstanceRef.current) {
            chartInstanceRef.current.destroy();
          }
          const newChartInstance = new Chart(ctx, {
            type: "bar",
            data: chartData,
            options: chartOptions,
          });
          chartInstanceRef.current = newChartInstance;
        }
      }
    };

    initChart();
  }, [isMaximized]);

  const handleMaximizeChart = () => {
    setIsMaximized((prev) => !prev);
  };

  return (
    <div
      className={`flex-1 mt-[12px] relative overflow-hidden ${
        isMaximized ? "fixed inset-0 z-50 bg-gray-900" : ""
      }`}
    >
      {!isMaximized && (
        <div className="bg-gray-900 rounded-lg shadow-lg p-4 m-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white text-lg font-medium">
              카테고리별 다운로드
            </h2>
            <div className="flex space-x-2">
              <button
                className="p-1 hover:bg-gray-700 rounded"
                onClick={handleMaximizeChart}
              >
                <Maximize2 className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>
          <div style={{ height: "700px" }}>
            <canvas ref={chartRef} />
          </div>
        </div>
      )}
      {isMaximized && (
        <div className="fixed inset-0 bg-gray-900 z-50 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white text-lg font-medium">
              카테고리별 다운로드
            </h2>
            <div className="flex space-x-2">
              <button
                className="p-1 hover:bg-gray-700 rounded"
                onClick={handleMaximizeChart}
              >
                <Minimize2 className="w-4 h-4 text-gray-400" />
              </button>
              <button
                className="p-1 hover:bg-gray-700 rounded"
                onClick={() => setIsMaximized(false)}
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>
          <div style={{ height: "calc(100vh - 100px)" }}>
            <canvas ref={chartRef} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Page;
