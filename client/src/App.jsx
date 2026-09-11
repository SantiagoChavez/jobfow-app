import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Navbar from './components/Navbar.jsx';
import BottomNav from './components/BottomNav.jsx';
import KPICards from './components/KPICards.jsx';
import UpcomingReminders from './components/UpcomingReminders.jsx';
import RemindersDrawer from './components/RemindersDrawer.jsx';
import ViewToggle from './components/ViewToggle.jsx';
import KanbanBoard from './components/KanbanBoard.jsx';
import ApplicationTable from './components/ApplicationTable.jsx';
import QuickAddModal from './components/QuickAddModal.jsx';
import ApplicationDetailModal from './components/ApplicationDetailModal.jsx';
import ReportModal from './components/ReportModal.jsx';
import { useToast } from './context/ToastContext.jsx';
import {
  getApplications,
  createApplication,
  updateApplicationStatus,
  addInteraction,
  deleteApplication,
  getAnalyticsSummary,
} from './services/api.js';

export function App() {
  // Colección completa para Kanban, Alertas y Estadísticas
  const [allApplications, setAllApplications] = useState([]);
  // Colección paginada del servidor para la vista de Tabla
  const [tableApplications, setTableApplications] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Hook centralizado de notificaciones toast
  const { showToast } = useToast();

  // Estados de navegación y filtros
  const [currentView, setCurrentView] = useState('kanban'); // 'kanban' | 'table'
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modales y Drawers
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isRemindersDrawerOpen, setIsRemindersDrawerOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);

  // Carga de la colección completa desde la API (con all=true)
  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [appsRes, analyticsData] = await Promise.all([
        getApplications({ all: true }),
        getAnalyticsSummary().catch(() => null),
      ]);
      setAllApplications(appsRes.data || []);
      setAnalytics(analyticsData);
    } catch (err) {
      console.error('Error al cargar datos generales:', err);
      setError('No se pudo conectar con el servidor backend. Verifica que esté en ejecución en el puerto 5000.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Carga de la tabla paginada en servidor (GET /api/applications?page=X)
  const fetchTableData = useCallback(async (page = 1, search = searchQuery, status = statusFilter) => {
    try {
      const res = await getApplications({
        page,
        limit: 10,
        search: search ? search.trim() : undefined,
        status: status || undefined,
      });
      setTableApplications(res.data || []);
      setPagination(res.pagination || null);
    } catch (err) {
      console.error('Error al cargar página de tabla:', err);
      showToast('Error al cargar datos de la página', 'error');
    }
  }, [searchQuery, statusFilter, showToast]);

  // Carga inicial
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Manejadores sincronizados de vista y filtros para evitar renders en cascada
  const handleViewChange = (view) => {
    setCurrentView(view);
    if (view === 'table') {
      setCurrentPage(1);
      fetchTableData(1, searchQuery, statusFilter);
    }
  };

  const handleSearchChange = (query) => {
    setSearchQuery(query);
    if (currentView === 'table') {
      setCurrentPage(1);
      fetchTableData(1, query, statusFilter);
    }
  };

  const handleStatusFilterChange = (status) => {
    setStatusFilter(status);
    if (currentView === 'table') {
      setCurrentPage(1);
      fetchTableData(1, searchQuery, status);
    }
  };

  // Manejador: Cambio interactivo de página numérica en la tabla
  const handlePageChange = async (newPage) => {
    if (newPage < 1 || (pagination?.totalPages && newPage > pagination.totalPages)) return;
    setCurrentPage(newPage);
    await fetchTableData(newPage, searchQuery, statusFilter);
  };

  // Manejador: Crear Postulación
  const handleSaveApplication = async (newAppData) => {
    const created = await createApplication(newAppData);
    setAllApplications((prev) => [created, ...prev]);
    if (currentView === 'table') {
      fetchTableData(currentPage, searchQuery, statusFilter);
    }
    showToast(`Postulación en "${created.company?.name || 'la empresa'}" registrada con éxito.`);
    getAnalyticsSummary().then((res) => setAnalytics(res)).catch(() => {});
  };

  // Manejador: Cambiar Estado con protección de degradación confirmable (409)
  const handleStatusChange = async (id, newStatus, options = {}) => {
    try {
      const updated = await updateApplicationStatus(id, newStatus, options);
      setAllApplications((prev) =>
        prev.map((app) => (app._id === id ? { ...app, ...updated } : app))
      );
      setTableApplications((prev) =>
        prev.map((app) => (app._id === id ? { ...app, ...updated } : app))
      );
      if (selectedApp && selectedApp._id === id) {
        setSelectedApp((prev) => ({ ...prev, ...updated }));
      }
      showToast(`Estado actualizado a ${newStatus}`);
      getAnalyticsSummary().then((res) => setAnalytics(res)).catch(() => {});
    } catch (err) {
      console.error('Error al actualizar estado:', err);
      // Si la API retorna 409 por degradación de OFERTA, solicitar confirmación explícita
      if (err.message && err.message.includes('OFERTA') && err.message.includes('force')) {
        const confirmForce = window.confirm(
          'Esta postulación ya se encuentra en estado OFERTA. ¿Estás seguro de que deseas forzar el cambio a un estado anterior?'
        );
        if (confirmForce) {
          handleStatusChange(id, newStatus, { ...options, force: true });
          return;
        }
      }
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
    const previousApplications = [...allApplications];

    // 1. Actualización Optimista inmediata en UI
    setAllApplications((prev) =>
      prev.map((app) =>
        app._id === draggableId ? { ...app, status: newStatus } : app
      )
    );

    try {
      // 2. Persistencia en backend
      const updated = await updateApplicationStatus(draggableId, newStatus);

      // 3. Sincronizar datos devueltos por backend
      setAllApplications((prev) =>
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
      // Si fue rechazo por degradación de OFERTA, consultar si desea forzar
      if (err.message && err.message.includes('OFERTA') && err.message.includes('force')) {
        const confirmForce = window.confirm(
          'Esta postulación ya se encuentra en estado OFERTA. ¿Deseas forzar la degradación a un estado anterior?'
        );
        if (confirmForce) {
          try {
            const forcedUpdated = await updateApplicationStatus(draggableId, newStatus, { force: true });
            setAllApplications((prev) =>
              prev.map((app) =>
                app._id === draggableId ? { ...app, ...forcedUpdated } : app
              )
            );
            if (selectedApp && selectedApp._id === draggableId) {
              setSelectedApp((prev) => ({ ...prev, ...forcedUpdated }));
            }
            showToast(`Estado actualizado a ${newStatus} (confirmado)`, 'success');
            getAnalyticsSummary().then((res) => setAnalytics(res)).catch(() => {});
            return;
          } catch (forceErr) {
            setAllApplications(previousApplications);
            showToast(`Error al forzar cambio: ${forceErr.message}`, 'error');
            return;
          }
        }
      }
      // 4. Rollback al snapshot previo
      setAllApplications(previousApplications);
      showToast(`Error al mover: ${err.message || 'Falló la conexión con el servidor'}`, 'error');
    }
  };

  // Manejador: Agregar Interacción
  const handleAddInteraction = async (id, interactionData) => {
    const updated = await addInteraction(id, interactionData);
    setAllApplications((prev) =>
      prev.map((app) => (app._id === id ? { ...app, ...updated } : app))
    );
    setTableApplications((prev) =>
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
      setAllApplications((prev) => prev.filter((app) => app._id !== id));
      if (currentView === 'table') {
        const nextTargetPage =
          tableApplications.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage;
        setCurrentPage(nextTargetPage);
        fetchTableData(nextTargetPage, searchQuery, statusFilter);
      }
      showToast('Postulación eliminada');
      getAnalyticsSummary().then((res) => setAnalytics(res)).catch(() => {});
    } catch (err) {
      console.error('Error al eliminar:', err);
      showToast(err.message || 'Error al eliminar', 'error');
    }
  };

  // Filtrado de postulaciones en memoria para el Tablero Kanban
  const filteredKanbanApplications = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return allApplications.filter((app) => {
      const matchesSearch =
        !query ||
        app.company?.name?.toLowerCase().includes(query) ||
        app.role?.toLowerCase().includes(query) ||
        app.company?.industry?.toLowerCase().includes(query) ||
        app.requirementsRaw?.toLowerCase().includes(query);

      const matchesStatus = !statusFilter || app.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [allApplications, searchQuery, statusFilter]);

  // Cantidad de seguimientos prioritarios o con atención requerida
  const remindersCount = useMemo(() => {
    return allApplications.filter((app) => {
      if (!['ENVIADA', 'CONTACTO', 'ENTREVISTA', 'OFERTA'].includes(app.status)) return false;
      if (app.status === 'ENTREVISTA' || app.status === 'OFERTA') return true;
      if (app.status === 'CONTACTO') return true;
      if (app.appliedAt) {
        const days = Math.floor((new Date() - new Date(app.appliedAt)) / (1000 * 60 * 60 * 24));
        if (days >= 5) return true;
      }
      return false;
    }).length;
  }, [allApplications]);

  return (
    <div className="min-h-screen bg-navy-base text-slate-100 flex flex-col selection:bg-gold-primary selection:text-navy-base">
      {/* Navbar Superior con Campana y Contador Reactivo */}
      <Navbar
        currentView={currentView}
        setCurrentView={handleViewChange}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenReportModal={() => setIsReportModalOpen(true)}
        remindersCount={remindersCount}
        onOpenReminders={() => setIsRemindersDrawerOpen(true)}
      />

      {/* Contenido Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6">
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={fetchAllData}
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
          applications={allApplications}
          onSelectApplication={(app) => setSelectedApp(app)}
          onOpenReminders={() => setIsRemindersDrawerOpen(true)}
        />

        {/* Barra de Filtros y Selector de Vista */}
        <ViewToggle
          currentView={currentView}
          setCurrentView={handleViewChange}
          searchQuery={searchQuery}
          setSearchQuery={handleSearchChange}
          statusFilter={statusFilter}
          setStatusFilter={handleStatusFilterChange}
          totalCount={
            currentView === 'table'
              ? pagination?.totalDocs ?? tableApplications.length
              : filteredKanbanApplications.length
          }
        />

        {/* Vista Alternada: Kanban o Tabla */}
        {currentView === 'kanban' ? (
          <KanbanBoard
            applications={filteredKanbanApplications}
            onSelectApplication={(app) => setSelectedApp(app)}
            onQuickStatusChange={handleStatusChange}
            onOpenAddModal={() => setIsAddModalOpen(true)}
            onDragEnd={handleDragEnd}
          />
        ) : (
          <ApplicationTable
            applications={tableApplications}
            pagination={pagination}
            currentPage={currentPage}
            onPageChange={handlePageChange}
            onSelectApplication={(app) => setSelectedApp(app)}
            onDeleteApplication={handleDeleteApplication}
            onOpenAddModal={() => setIsAddModalOpen(true)}
          />
        )}
      </main>

      {/* Navegación Móvil Fija */}
      <BottomNav
        currentView={currentView}
        setCurrentView={handleViewChange}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenReportModal={() => setIsReportModalOpen(true)}
        onRefresh={() => {
          fetchAllData();
          if (currentView === 'table') {
            fetchTableData(currentPage, searchQuery, statusFilter);
          }
        }}
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

      {/* Drawer Lateral: Alertas y Seguimientos */}
      <RemindersDrawer
        isOpen={isRemindersDrawerOpen}
        onClose={() => setIsRemindersDrawerOpen(false)}
        applications={allApplications}
        onSelectApplication={(app) => {
          setIsRemindersDrawerOpen(false);
          setSelectedApp(app);
        }}
      />
    </div>
  );
}

export default App;
