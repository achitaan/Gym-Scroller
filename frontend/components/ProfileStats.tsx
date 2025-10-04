"use client";

import { VolumeDataPoint } from "@/lib/hevy-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface ProfileStatsProps {
  data: VolumeDataPoint[];
  title?: string;
}

/**
 * ProfileStats displays a chart of training volume over time
 * Hevy UX pattern: Visual progress tracking with clean line charts
 * Helps users understand their training trends and consistency
 */
export function ProfileStats({ data, title = "Total Volume (30 Days)" }: ProfileStatsProps) {
  return (
    <Card className="rounded-2xl border-neutral-200 dark:border-neutral-800">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-neutral-200 dark:stroke-neutral-800" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => {
                const date = new Date(value);
                return `${date.getMonth() + 1}/${date.getDate()}`;
              }}
              className="text-neutral-500 dark:text-neutral-400"
            />
            <YAxis
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              className="text-neutral-500 dark:text-neutral-400"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                border: "1px solid #e5e5e5",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              formatter={(value: number) => [`${value.toLocaleString()} kg`, "Volume"]}
              labelFormatter={(label) => new Date(label).toLocaleDateString()}
            />
            <Line
              type="monotone"
              dataKey="volume"
              stroke="#2563eb"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
