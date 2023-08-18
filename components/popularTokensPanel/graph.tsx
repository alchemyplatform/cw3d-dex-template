"use client";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ChartData } from "./index"; // Import ChartData interface

interface TokenGraphProps {
  chartData: ChartData[];
}

const TokenGraph: React.FC<TokenGraphProps> = ({ chartData }) => {
  return (
    <div>
      <ResponsiveContainer  width="100%" height={100}>
        <LineChart  data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis fontSize={"10px"} dataKey="date" />
          <YAxis fontSize={"10px"} />
          <Tooltip />
          <Line type="monotone" dataKey="price" fontSize={"10px"} stroke="#8884d8" />{" "}
          {/* Display token prices */}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TokenGraph;
