import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, RefreshCw, CheckCircle } from 'lucide-react';
import { useGroupStore, useExpenseStore } from '../store';
import { BalanceCard, LoadingSpinner, SettlementModal } from '../components';
import { formatPaise } from '../utils';
import toast from 'react-hot-toast';

const BalancesPage = () => {
  const { id: groupId } = useParams();
  const { currentGroup, fetchGroupById, fetchMembers } = useGroupStore();
  const {
    balances,
    settlementSuggestions,
    settlements,
    fetchBalances,
    fetchSettlementSuggestions,
    fetchSettlements,
    createSettlement,
  } = useExpenseStore();
  const [selectedSettlement, setSelectedSettlement] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (groupId) {
      fetchGroupById(groupId);
      fetchMembers(groupId);
      fetchBalances(groupId);
      fetchSettlementSuggestions(groupId);
      fetchSettlements(groupId);
    }
  }, [groupId]);

  const handleSettlementConfirm = async (settlementData) => {
    const result = await createSettlement(groupId, settlementData);
    if (result.success) {
      toast.success('Settlement recorded');
      setIsModalOpen(false);
      fetchBalances(groupId);
      fetchSettlementSuggestions(groupId);
    } else {
      toast.error(result.error || 'Failed to record settlement');
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Balances & Settlements</h1>
        <p className="text-gray-600 mt-1">
          See who owes what and record settlements
        </p>
      </div>

      {/* Member Balances */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Current Balances
        </h2>
        {balances.length === 0 ? (
          <div className="text-center py-12 card">
            <p className="text-gray-500">No balances to show</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {balances.map((balance) => (
              <BalanceCard key={balance.userId} balance={balance} />
            ))}
          </div>
        )}
      </div>

      {/* Settlement Suggestions */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Suggested Settlements
        </h2>
        {settlementSuggestions.length === 0 ? (
          <div className="text-center py-12 card">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <p className="text-gray-900 font-medium">All settled!</p>
            <p className="text-gray-500">No pending settlements</p>
          </div>
        ) : (
          <div className="space-y-3">
            {settlementSuggestions.map((settlement, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="card p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => {
                  setSelectedSettlement(settlement);
                  setIsModalOpen(true);
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 bg-accent-100 text-accent-700 rounded-full flex items-center justify-center font-medium">
                        {settlement.from_user_name?.[0] || '?'}
                      </div>
                      <span className="font-medium">{settlement.from_user_name}</span>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400" />
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 bg-green-100 text-green-700 rounded-full flex items-center justify-center font-medium">
                        {settlement.to_user_name?.[0] || '?'}
                      </div>
                      <span className="font-medium">{settlement.to_user_name}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">
                      {settlement.amount_formatted || formatPaise(settlement.amount)}
                    </p>
                    <p className="text-sm text-gray-500">Click to settle</p>
                  </div>
                </div>
                {settlement.expense_refs?.length > 0 && (
                  <p className="text-xs text-gray-500 mt-2 ml-12">
                    Covers {settlement.expense_refs.length} expense(s)
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Settlement History */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Settlement History
        </h2>
        {settlements.length === 0 ? (
          <div className="text-center py-12 card">
            <p className="text-gray-500">No settlements recorded yet</p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">From</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">To</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Amount</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {settlements.map((s) => (
                  <tr key={s.id}>
                    <td className="py-3 px-4">{s.payer?.name || 'Unknown'}</td>
                    <td className="py-3 px-4">{s.payee?.name || 'Unknown'}</td>
                    <td className="py-3 px-4 font-medium">{formatPaise(s.amount)}</td>
                    <td className="py-3 px-4 text-gray-500">{s.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Settlement Modal */}
      <SettlementModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        settlement={selectedSettlement}
        onConfirm={handleSettlementConfirm}
      />
    </div>
  );
};

export default BalancesPage;
