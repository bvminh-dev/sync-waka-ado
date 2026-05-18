"use client";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatHours, secondsToHours } from "@/lib/format";

interface Item {
  name: string;
  totalSeconds: number;
}

export function HoursBarChart({
  data,
  color = "#337AB7",
  height = 280,
}: {
  data: Item[];
  color?: string;
  height?: number;
}) {
  if (!data.length) {
    return (
      <div className="text-ink-400 text-sm py-12 text-center">
        Chưa có dữ liệu trong khoảng này.
      </div>
    );
  }
  const chartData = data.map((d) => ({
    name: d.name,
    hours: secondsToHours(d.totalSeconds),
    sec: d.totalSeconds,
  }));
  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 8, right: 16, bottom: 8, left: 8 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E5EAF0" />
          <XAxis type="number" tick={{ fontSize: 12, fill: "#5E6B78" }} />
          <YAxis
            type="category"
            dataKey="name"
            width={120}
            tick={{ fontSize: 12, fill: "#333333" }}
          />
          <Tooltip
            formatter={(_v, _n, ctx) => [
              formatHours((ctx.payload as { sec: number }).sec),
              "Thời gian",
            ]}
            contentStyle={{
              borderRadius: 8,
              border: "1px solid #D9E5EF",
              fontSize: 12,
            }}
          />
          <Bar dataKey="hours" fill={color} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
