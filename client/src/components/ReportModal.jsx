import React, { useState } from 'react';
import { CloseIcon, FileTextIcon, DownloadIcon, SparklesIcon } from './Icons.jsx';
import { downloadPdfReport } from '../services/api.js';
import { useModalA11y } from '../hooks/useModalA11y.js';
import { useToast } from '../context/ToastContext.jsx';

export const ReportModal = ({ isOpen, onClose }) => {
  const { showToast } = useToast();
  const getDefaultDates = () => {
    const to = new Date().toISOString().split('T')[0];
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - 30);
    const from = fromDate.toISOString().split('T')[0];
    return { from, to };
  };

  const [dateRange, setDateRange] = useState(getDefaultDates());
  const [downloading, setDownloading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  useModalA11y(isOpen, onClose);

  if (!isOpen) return null;

  const handleQuickRange = (days) => {
    const to = new Date().toISOString().split('T')[0];
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);
    const from = fromDate.toISOString().split('T')[0];
    setDateRange({ from, to });
  };

  const handleDownload = async (e) => {
    e.preventDefault();
    try {
      setDownloading(true);
      setStatusMessage('Generando reporte PDF vectorial...');
      await downloadPdfReport(dateRange.from, dateRange.to);
      setStatusMessage('¡Descarga completada con éxito!');
      showToast('Reporte PDF descargado con éxito', 'success');
      setTimeout(() => {
        setStatusMessage('');
        onClose();
      }, 1200);
    } catch (err) {
      const errorMsg = err.message || 'Error al generar el reporte';
      setStatusMessage(`Error: ${errorMsg}`);
      showToast(errorMsg, 'error');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 dark:bg-navy-base/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-white dark:bg-navy-surface rounded-3xl border border-slate-200 dark:border-slate-700/80 shadow-2xl shadow-slate-900/20 dark:shadow-black/60 overflow-hidden transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-navy-base/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-700 dark:text-sky-tech">
              <FileTextIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Informe para Career Coach</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Descarga tu reporte oficial en formato PDF</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido */}
        <form onSubmit={handleDownload} className="p-5 space-y-4">
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-navy-base/80 border border-slate-200 dark:border-slate-800 space-y-2">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-300 flex items-center gap-1.5">
              <SparklesIcon className="w-3.5 h-3.5 text-amber-600 dark:text-gold-primary" />
              Contenido del Reporte:
            </span>
            <ul className="text-[11px] text-slate-600 dark:text-slate-400 space-y-1 list-disc list-inside">
              <li>Métricas consolidadas (Total, Entrevistas, Ofertas, Tasa de respuesta).</li>
              <li>Tiempos de respuesta y empresas ágiles.</li>
              <li>Tabla detallada de postulaciones en el período.</li>
              <li>Diseño ejecutivo listo para entregar al mentor o coach.</li>
            </ul>
          </div>

          {/* Rango Rápido */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
              Período Rápido
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleQuickRange(7)}
                className="flex-1 py-1.5 px-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-navy-base hover:bg-slate-200 dark:hover:bg-navy-highlight text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-300 dark:border-slate-700 transition-all"
              >
                Últimos 7 días
              </button>
              <button
                type="button"
                onClick={() => handleQuickRange(30)}
                className="flex-1 py-1.5 px-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-navy-base hover:bg-slate-200 dark:hover:bg-navy-highlight text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-300 dark:border-slate-700 transition-all"
              >
                Últimos 30 días
              </button>
              <button
                type="button"
                onClick={() => handleQuickRange(90)}
                className="flex-1 py-1.5 px-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-navy-base hover:bg-slate-200 dark:hover:bg-navy-highlight text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-300 dark:border-slate-700 transition-all"
              >
                Trimestre
              </button>
            </div>
          </div>

          {/* Fechas Desde / Hasta */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                Desde
              </label>
              <input
                type="date"
                required
                value={dateRange.from}
                onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                className="w-full bg-slate-50 dark:bg-navy-base border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 dark:focus:border-gold-primary"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                Hasta
              </label>
              <input
                type="date"
                required
                value={dateRange.to}
                onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                className="w-full bg-slate-50 dark:bg-navy-base border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 dark:focus:border-gold-primary"
              />
            </div>
          </div>

          {statusMessage && (
            <p className="text-xs text-center text-amber-700 dark:text-gold-light font-medium py-1 animate-pulse">
              {statusMessage}
            </p>
          )}

          {/* Botones */}
          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-2.5 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={downloading}
              className="w-2/3 py-2.5 rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-400 dark:bg-gold-primary dark:hover:bg-gold-light text-slate-950 dark:text-navy-base transition-all shadow-md shadow-amber-500/20 dark:shadow-gold-primary/20 flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <DownloadIcon className="w-4 h-4 stroke-[2.5]" />
              {downloading ? 'Generando...' : 'Descargar Reporte PDF'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportModal;
