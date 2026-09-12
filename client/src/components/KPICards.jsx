import React from 'react';
import { BriefcaseIcon, MessageIcon, CheckCircleIcon, SparklesIcon } from './Icons.jsx';

export const KPICards = ({ analytics, loading }) => {
  const kpis = analytics?.kpis || {
    totalApplications: 0,
    totalInterviews: 0,
    totalOffers: 0,
    responseRate: 0,
  };

  const avgResponseDays = analytics?.responseMetrics?.avgResponseDays ?? null;

  const cards = [
    {
      title: 'Postulaciones',
      value: kpis.totalApplications,
      subtitle: 'Enviadas en total',
      icon: <BriefcaseIcon className="w-5 h-5 text-sky-600 dark:text-sky-tech" />,
      borderColor: 'border-slate-200 dark:border-sky-500/20',
      bgColor: 'bg-sky-50 dark:bg-sky-500/10',
      valueColor: 'text-slate-900 dark:text-white',
    },
    {
      title: 'Entrevistas',
      value: kpis.totalInterviews,
      subtitle: 'En curso / Realizadas',
      icon: <MessageIcon className="w-5 h-5 text-amber-600 dark:text-gold-primary" />,
      borderColor: 'border-slate-200 dark:border-gold-primary/20',
      bgColor: 'bg-amber-50 dark:bg-gold-primary/10',
      valueColor: 'text-amber-600 dark:text-gold-primary',
    },
    {
      title: 'Ofertas Recibidas',
      value: kpis.totalOffers,
      subtitle: 'Propuestas formales',
      icon: <CheckCircleIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
      borderColor: 'border-slate-200 dark:border-emerald-500/20',
      bgColor: 'bg-emerald-50 dark:bg-emerald-500/10',
      valueColor: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      title: 'Tasa de Respuesta',
      value: `${kpis.responseRate}%`,
      subtitle: avgResponseDays != null ? `Avg: ~${avgResponseDays} días` : 'Feedback de empresas',
      icon: <SparklesIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />,
      borderColor: 'border-slate-200 dark:border-purple-500/20',
      bgColor: 'bg-purple-50 dark:bg-purple-500/10',
      valueColor: 'text-purple-600 dark:text-purple-300',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
      {cards.map((card, idx) => (
        <div
          key={idx}
          className={`p-4 rounded-2xl bg-white dark:bg-navy-surface/90 border ${card.borderColor} backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-600/60 hover:-translate-y-0.5`}
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {card.title}
            </span>
            <div className={`p-2 rounded-xl ${card.bgColor}`}>
              {card.icon}
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className={`text-2xl sm:text-3xl font-black tracking-tight ${card.valueColor}`}>
              {loading ? '...' : card.value}
            </h3>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1 font-semibold">
            {card.subtitle}
          </p>
        </div>
      ))}
    </div>
  );
};

export default KPICards;
