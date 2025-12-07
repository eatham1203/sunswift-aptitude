import React, { useState, useEffect } from "react";
import rawData from "../../telemetry_sample.json"
import { LineChart } from "@mui/x-charts";
import { cleanData } from "../utils/cleanData";

/*
  I cleaned the telemetry data by converting corrupted strings using parseFloat
  and turning invalid numeric values into null. Speed readings were clamped to
  a realistic range (0–150 km/h) to avoid chart spikes caused by outliers and I 
  interpolate speed drops by taking the previous and after speeds of that speed 
  data set. Missing
  GPS coordinates become null, ensuring the UI doesn't break when values are absent.
  The cleaned data is then displayed using simple React hooks and a MUI
  chart component to visualise speed over time.
*/

// edge case of if the first and last data is < MINSPEED still exist 

const TelemetryChart = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    const cleaned = cleanData(rawData);
    setData(cleaned);
  }, []);

  if (data.length === 0) return <p className="text-gray-600">Loading telemetry...</p>;

  const latest = data[data.length - 1];
  
  // Filter out null speed values 
  const chartData = data.filter(entry => entry.speed !== null);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Telemetry Dashboard</h2>

      <div className="bg-gray-200 rounded-lg p-6 mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="text-center">
          <p className="text-sm text-gray-500">CURRENT SPEED</p>
          <p className="text-2xl font-semibold text-blue-600">
            {latest.speed ?? "N/A"} <span className="text-sm text-gray-400">km/h</span>
          </p>
        </div>
        
        <div className="text-center">
          <p className="text-sm text-gray-500">BATTERY</p>
          <p className="text-2xl font-semibold text-green-600">
            {latest.battery ?? "N/A"}<span className="text-sm text-gray-400">%</span>
          </p>
        </div>
        
        <div className="text-center">
          <p className="text-sm text-gray-500">MOTOR TEMPERATURE</p>
          <p className={`text-2xl font-semibold ${
            (latest.motorTemp !== null && latest.motorTemp > 90) 
              ? "text-red-600 font-bold animate-pulse" 
              : "text-gray-800"
          }`}>
            {latest.motorTemp ?? "N/A"}<span className="text-sm text-gray-400">°C</span>
            {(latest.motorTemp !== null && latest.motorTemp > 90) && 
              <span className="ml-2 text-red-600">⚠️ HIGH TEMP!</span>
            }
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Speed Over Time</h3>
        <LineChart
          width={800}
          height={300}
          dataset={chartData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          xAxis={[{
            dataKey: 'timestamp',
            scaleType: 'time',
            valueFormatter: (value) => new Date(value).toLocaleTimeString("en-US", { hour12: false })
          }]}
          series={[{
            dataKey: 'speed',
            label: 'Speed (km/h)',
            color: '#1976d2',
            connectNulls: false  // This creates gaps for missing data
          }]}
        />
      </div>
    </div>
  );
};

export default TelemetryChart;
