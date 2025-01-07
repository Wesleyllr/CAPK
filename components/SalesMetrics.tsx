import React from "react";

interface MetricCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon }) => (
  <div className="bg-secundaria-50 p-4 rounded-lg flex items-center space-x-4">
    <div className="p-3 bg-terceira-100 rounded-full">{icon}</div>
    <div>
      <p className="text-quinta text-sm">{title}</p>
      <p className="text-secundaria-900 text-lg font-bold">
        {new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL",
        }).format(value)}
      </p>
    </div>
  </div>
);
