import { useMemo } from 'react';
import { motion } from 'motion/react';
import { useStore } from '../StoreContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, Package, Activity } from 'lucide-react';

const COLORS = ['#4f46e5', '#818cf8', '#c7d2fe', '#e0e7ff', '#312e81'];

export function Analysis() {
  const { withdrawals } = useStore();

  const stats = useMemo(() => {
    let totalItems = 0;
    const personCount: Record<string, number> = {};
    const modelCount: Record<string, number> = {};
    const dateCount: Record<string, number> = {};

    withdrawals.forEach((w) => {
      // Count by person
      personCount[w.personName] = (personCount[w.personName] || 0) + 1;
      
      // Count by date
      const date = new Date(w.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      dateCount[date] = (dateCount[date] || 0) + 1;

      // Count items and models
      w.items.forEach((item) => {
        totalItems += item.quantity;
        modelCount[item.model] = (modelCount[item.model] || 0) + item.quantity;
      });
    });

    const topPerson = Object.entries(personCount).sort((a, b) => b[1] - a[1])[0];
    const topModel = Object.entries(modelCount).sort((a, b) => b[1] - a[1])[0];

    const chartDataModels = Object.entries(modelCount)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    const chartDataDates = Object.entries(dateCount)
      .map(([date, count]) => ({ date, count }))
      .reverse() // Reverse to show chronological order if withdrawals are sorted newest first
      .slice(-7); // Last 7 days

    return {
      totalWithdrawals: withdrawals.length,
      totalItems,
      topPerson: topPerson ? topPerson[0] : '-',
      topModel: topModel ? topModel[0] : '-',
      chartDataModels,
      chartDataDates
    };
  }, [withdrawals]);

  if (withdrawals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 text-gray-400">
        <Activity size={48} className="mb-4 opacity-50" />
        <p className="text-[15px]">Dados insuficientes para análise.</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-md mx-auto space-y-4 pb-24"
    >
      {/* Cards de Resumo */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white p-4 rounded-[24px] shadow-sm">
          <div className="flex items-center gap-2 text-indigo-600 mb-2">
            <TrendingUp size={18} />
            <span className="text-[13px] font-semibold">Retiradas</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.totalWithdrawals}</p>
        </div>
        
        <div className="bg-white p-4 rounded-[24px] shadow-sm">
          <div className="flex items-center gap-2 text-emerald-600 mb-2">
            <Package size={18} />
            <span className="text-[13px] font-semibold">Itens</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.totalItems}</p>
        </div>

        <div className="bg-white p-4 rounded-[24px] shadow-sm col-span-2">
          <div className="flex items-center gap-2 text-amber-600 mb-2">
            <Users size={18} />
            <span className="text-[13px] font-semibold">Pessoa mais ativa</span>
          </div>
          <p className="text-lg font-bold text-gray-900 truncate">{stats.topPerson}</p>
        </div>
      </div>

      {/* Gráfico de Modelos */}
      <div className="bg-white p-5 rounded-[28px] shadow-sm">
        <h3 className="text-[15px] font-semibold text-gray-900 mb-4">Top 5 Modelos Retirados</h3>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={stats.chartDataModels}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {stats.chartDataModels.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                itemStyle={{ color: '#111827', fontSize: '14px', fontWeight: 600 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-wrap gap-2 mt-4 justify-center">
          {stats.chartDataModels.map((entry, index) => (
            <div key={index} className="flex items-center gap-1.5 text-[12px] font-medium text-gray-600">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
              {entry.name}
            </div>
          ))}
        </div>
      </div>

      {/* Gráfico de Atividade */}
      <div className="bg-white p-5 rounded-[28px] shadow-sm">
        <h3 className="text-[15px] font-semibold text-gray-900 mb-4">Atividade Recente (Últimos 7 dias)</h3>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.chartDataDates}>
              <XAxis 
                dataKey="date" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#6B7280' }}
                dy={10}
              />
              <Tooltip
                cursor={{ fill: '#F3F4F6', radius: 8 }}
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Bar 
                dataKey="count" 
                fill="#4f46e5" 
                radius={[6, 6, 6, 6]} 
                barSize={32}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  );
}
