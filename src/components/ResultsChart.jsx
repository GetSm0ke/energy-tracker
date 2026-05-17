import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function ResultsChart({ data }) {
  const chartData = data.map(test => ({
    time: new Date(test.timestamp).getHours() + ':00',
    score: test.score
  }));

  return (
    <div style={{ width: '100%', height: 300, marginTop: 30 }}>
      <h3 style={{ textAlign: 'center', color: 'white' }}>Динамика результатов</h3>
      <ResponsiveContainer>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.2)" />
          <XAxis dataKey="time" stroke="white" />
          <YAxis domain={[0, 5]} stroke="white" />
          <Tooltip />
          <Line type="monotone" dataKey="score" stroke="#ffd700" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}