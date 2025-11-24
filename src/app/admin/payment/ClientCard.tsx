"use client";

interface ClientCardProps {
  client: {
    membership_number: string;
    client_name: string;
    CNIC: string;
    apartment_count: number;
    amount_payable: number;
    total_received: number;
    progress: number;
  };
  onClick: () => void;
}

export default function ClientCard({ client, onClick }: ClientCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg transition-shadow border border-gray-200 hover:border-[#98786d]"
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-lg text-gray-800">
            {client.client_name}
          </h3>
          <p className="text-sm text-[#98786d] font-medium">
            {client.membership_number}
          </p>
        </div>
        <span className="bg-[#98786d] text-white text-xs px-2 py-1 rounded-full">
          {client.apartment_count} {client.apartment_count === 1 ? "Apt" : "Apts"}
        </span>
      </div>

      {/* CNIC */}
      <p className="text-sm text-gray-600 mb-3">
        <span className="font-medium">CNIC:</span> {client.CNIC}
      </p>

      {/* Payment Info */}
      <div className="text-sm text-gray-600 mb-3 space-y-1">
        <div className="flex justify-between">
          <span>Total Payable:</span>
          <span className="font-medium">{formatCurrency(client.amount_payable || 0)}</span>
        </div>
        <div className="flex justify-between">
          <span>Received:</span>
          <span className="font-medium text-green-600">
            {formatCurrency(client.total_received || 0)}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-3">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Payment Progress</span>
          <span>{Math.round(client.progress || 0)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-green-500 h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(client.progress || 0, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
