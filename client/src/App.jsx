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

  // Notificación toast { message: string, type: 'success' | 'error' }
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
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
      showToast(err.message || 'Error al actualizar estado', 'error');
    }
  };

  // Manejador: Drag and Drop en Tablero Kanban con UI Optimista y Rollback
  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const newStatus = destination.droppableId;
    const previousStatus = source.droppableId;

    if (newStatus === previousStatus) {
      return;
    }

    // Snapshot para rollback en caso de fallo
    const previousApplications = [...applications];

    // 1. Actualización Optimista inmediata en UI
    setApplications((prev) =>
      prev.map((app) =>
        app._id === draggableId ? { ...app, status: newStatus } : app
      )
    );

    try {
      // 2. Persistencia en backend
      const updated = await updateApplicationStatus(draggableId, newStatus);

      // 3. Sincronizar datos devueltos por backend (recalculo de responseTimeDays, etc.)
      setApplications((prev) =>
        prev.map((app) =>
          app._id === draggableId ? { ...app, ...updated } : app
        )
      );

      if (selectedApp && selectedApp._id === draggableId) {
        setSelectedApp((prev) => ({ ...prev, ...updated }));
      }

      showToast(`Estado actualizado a ${newStatus}`, 'success');
      getAnalyticsSummary().then((res) => setAnalytics(res)).catch(() => {});
    } catch (err) {
      console.error('Error al mover tarjeta:', err);
      // 4. Rollback al snapshot previo
      setApplications(previousApplications);
      showToast(`Error al mover: ${err.message || 'Falló la conexión con el servidor'}`, 'error');
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
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-2xl text-xs font-bold shadow-xl shadow-black/40 flex items-center gap-2 animate-bounce transition-all ${
            toast.type === 'error'
              ? 'bg-rose-950/95 text-rose-200 border border-rose-500/50'
              : 'bg-navy-highlight text-white border border-gold-primary/40'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              toast.type === 'error' ? 'bg-rose-400' : 'bg-gold-primary'
            }`}
          />
          {toast.message}
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
            onDragEnd={handleDragEnd}
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
