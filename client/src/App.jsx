import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar.jsx';
import BottomNav from './components/BottomNav.jsx';
import KPICards from './components/KPICards.jsx';
import UpcomingReminders from './components/UpcomingReminders.jsx';
import ViewToggle from './components/ViewToggle.jsx';
import KanbanBoard from './components/KanbanBoard.jsx';
import ApplicationTable from './components/ApplicationTable.jsx';
import QuickAddModal from './components/QuickAddModal.jsx';
import ApplicationDetailModal from './components/ApplicationDetailModal.jsx';
import ReportModal from './components/ReportModal.jsx';
import {
  getApplications,
  createApplication,
  updateApplicationStatus,
  addInteraction,
  deleteApplication,
  getAnalyticsSummary,
} from './services/api.js';

export function App() {
  const [applications, setApplications] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estados de navegación y filtros
  const [currentView, setCurrentView] = useState('kanban'); // 'kanban' | 'table'
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modales
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);

  // Notificación toast
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Carga de datos desde la API
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [appsData, analyticsData] = await Promise.all([
        getApplications(),
        getAnalyticsSummary().catch(() => null),
      ]);
      setApplications(appsData);
      setAnalytics(analyticsData);
    } catch (err) {
      console.error('Error al cargar datos:', err);
      setError('No se pudo conectar con el servidor backend. Verifica que esté en ejecución en el puerto 5000.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Manejador: Crear Postulación
  const handleSaveApplication = async (newAppData) => {
    const created = await createApplication(newAppData);
    setApplications((prev) => [created, ...prev]);
    showToast(`Postulación en "${created.company?.name || 'la empresa'}" registrada con éxito.`);
    // Refrescar analíticas en segundo plano
    getAnalyticsSummary().then((res) => setAnalytics(res)).catch(() => {});
  };

  // Manejador: Cambiar Estado
  const handleStatusChange = async (id, newStatus) => {
    try {
      const updated = await updateApplicationStatus(id, newStatus);
      setApplications((prev) =>
        prev.map((app) => (app._id === id ? { ...app, ...updated } : app))
      );
      if (selectedApp && selectedApp._id === id) {
        setSelectedApp((prev) => ({ ...prev, ...updated }));
      }
      showToast(`Estado actualizado a ${newStatus}`);
      getAnalyticsSummary().then((res) => setAnalytics(res)).catch(() => {});
    } catch (err) {
      console.error('Error al actualizar estado:', err);
      alert(err.message || 'Error al actualizar estado');
    }
  };

  // Manejador: Agregar Interacción
  const handleAddInteraction = async (id, interactionData) => {
    const updated = await addInteraction(id, interactionData);
    setApplications((prev) =>
      prev.map((app) => (app._id === id ? { ...app, ...updated } : app))
    );
    if (selectedApp && selectedApp._id === id) {
      setSelectedApp((prev) => ({ ...prev, ...updated }));
    }
    showToast('Evento registrado en el historial');
    getAnalyticsSummary().then((res) => setAnalytics(res)).catch(() => {});
  };

  // Manejador: Eliminar Postulación
  const handleDeleteApplication = async (id) => {
    try {
      await deleteApplication(id);
      setApplications((prev) => prev.filter((app) => app._id !== id));
      showToast('Postulación eliminada');
      getAnalyticsSummary().then((res) => setAnalytics(res)).catch(() => {});
    } catch (err) {
      console.error('Error al eliminar:', err);
      alert(err.message || 'Error al eliminar');
    }
  };

  // Filtrado de postulaciones en memoria
  const filteredApplications = applications.filter((app) => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      app.company?.name?.toLowerCase().includes(query) ||
      app.role?.toLowerCase().includes(query) ||
      app.company?.industry?.toLowerCase().includes(query) ||
      app.requirementsRaw?.toLowerCase().includes(query);

    const matchesStatus = !statusFilter || app.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-navy-base text-slate-100 flex flex-col selection:bg-gold-primary selection:text-navy-base">
      {/* Toast Notificación */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 px-4 py-2.5 rounded-2xl bg-navy-highlight text-white text-xs font-bold border border-gold-primary/40 shadow-xl shadow-black/40 flex items-center gap-2 animate-bounce">
          <span className="w-2 h-2 rounded-full bg-gold-primary" />
          {toastMessage}
        </div>
      )}

      {/* Navbar Superior */}
      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenReportModal={() => setIsReportModalOpen(true)}
      />

      {/* Contenido Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6">
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={fetchData}
              className="px-3 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-bold transition-colors"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Tarjetas de Métricas y KPIs */}
        <KPICards analytics={analytics} loading={loading} />

        {/* Alertas y Recordatorios Clave */}
        <UpcomingReminders
          applications={applications}
          onSelectApplication={(app) => setSelectedApp(app)}
        />

        {/* Barra de Filtros y Selector de Vista */}
        <ViewToggle
          currentView={currentView}
          setCurrentView={setCurrentView}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          totalCount={filteredApplications.length}
        />

        {/* Vista Alternada: Kanban o Tabla */}
        {currentView === 'kanban' ? (
          <KanbanBoard
            applications={filteredApplications}
            onSelectApplication={(app) => setSelectedApp(app)}
            onQuickStatusChange={handleStatusChange}
            onOpenAddModal={() => setIsAddModalOpen(true)}
          />
        ) : (
          <ApplicationTable
            applications={filteredApplications}
            onSelectApplication={(app) => setSelectedApp(app)}
            onDeleteApplication={handleDeleteApplication}
            onOpenAddModal={() => setIsAddModalOpen(true)}
          />
        )}
      </main>

      {/* Navegación Móvil Fija */}
      <BottomNav
        currentView={currentView}
        setCurrentView={setCurrentView}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenReportModal={() => setIsReportModalOpen(true)}
        onRefresh={fetchData}
      />

      {/* Modal: + Nueva Postulación */}
      <QuickAddModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleSaveApplication}
      />

      {/* Modal: Detalle de Postulación */}
      <ApplicationDetailModal
        application={selectedApp}
        isOpen={Boolean(selectedApp)}
        onClose={() => setSelectedApp(null)}
        onStatusChange={handleStatusChange}
        onAddInteraction={handleAddInteraction}
        onDelete={handleDeleteApplication}
      />

      {/* Modal: Descargar Reporte PDF */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      />
    </div>
  );
}

export default App;
