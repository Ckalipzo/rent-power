import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Lock, Unlock, Plus, X, Save, Trash2, Download, Calendar } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import type { Cotizacion, Cliente } from '../../types/types';

interface Project {
  id: string;
  title: string;
  activities: Activity[];
  isBlocked: boolean;
  cotizacionId?: string;
}

interface Activity {
  id: string;
  title: string;
  description: string;
  time: string;
  completed: boolean;
}

interface ProjectsByDate {
  [key: string]: Project;
}

export const ProjectCalendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [clientes] = useLocalStorage<Cliente[]>('clientes', []);
  const [projects, setProjects] = useLocalStorage<ProjectsByDate>('calendar_projects', {});
  const [showProjectSheet, setShowProjectSheet] = useState(false);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [newActivity, setNewActivity] = useState({ title: '', description: '', time: '' });
  const [viewType, setViewType] = useState<'month' | 'week' | 'year'>('month');
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);

  // Verificar cotizaciones pagadas y bloquear fechas
  useEffect(() => {
    const cotizacionesPagadas = clientes.flatMap(cliente => 
      (cliente.cotizaciones || [])
        .filter(cot => cot.estado === 'pagada' && cot.fechaReserva)
    );

    cotizacionesPagadas.forEach(cotizacion => {
      const dateKey = format(new Date(cotizacion.fechaReserva), 'yyyy-MM-dd');
      if (!projects[dateKey] || !projects[dateKey].isBlocked) {
        setProjects(prev => ({
          ...prev,
          [dateKey]: {
            id: crypto.randomUUID(),
            title: `Reserva - ${cotizacion.id.slice(0, 8)}`,
            activities: [],
            isBlocked: true,
            cotizacionId: cotizacion.id
          }
        }));
      }
    });
  }, [clientes]);
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const handleDateClick = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    setSelectedDate(date);
    
    if (projects[dateKey]) {
      setCurrentProject(projects[dateKey]);
    } else {
      setCurrentProject({
        id: crypto.randomUUID(),
        title: format(date, 'PPPP', { locale: es }),
        activities: [],
        isBlocked: false
      });
    }
    
    setShowProjectSheet(true);
  };

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const toggleBlockDate = () => {
    if (!selectedDate || !currentProject) return;
    
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    const updatedProject = { ...currentProject, isBlocked: !currentProject.isBlocked };
    setCurrentProject(updatedProject);
    setProjects({ ...projects, [dateKey]: updatedProject });
  };

  const addActivity = () => {
    if (!currentProject || !newActivity.title) return;

    const activity = {
      id: crypto.randomUUID(),
      ...newActivity,
      completed: false
    };

    const updatedProject = {
      ...currentProject,
      activities: [...currentProject.activities, activity]
    };

    setCurrentProject(updatedProject);
    if (selectedDate) {
      const dateKey = format(selectedDate, 'yyyy-MM-dd');
      setProjects({ ...projects, [dateKey]: updatedProject });
    }

    setNewActivity({ title: '', description: '', time: '' });
  };

  const toggleActivityCompletion = (activityId: string) => {
    if (!currentProject) return;

    const updatedActivities = currentProject.activities.map(activity =>
      activity.id === activityId ? { ...activity, completed: !activity.completed } : activity
    );

    const updatedProject = { ...currentProject, activities: updatedActivities };
    setCurrentProject(updatedProject);

    if (selectedDate) {
      const dateKey = format(selectedDate, 'yyyy-MM-dd');
      setProjects({ ...projects, [dateKey]: updatedProject });
    }
  };

  const deleteActivity = (activityId: string) => {
    if (!currentProject) return;

    const updatedActivities = currentProject.activities.filter(
      activity => activity.id !== activityId
    );

    const updatedProject = { ...currentProject, activities: updatedActivities };
    setCurrentProject(updatedProject);

    if (selectedDate) {
      const dateKey = format(selectedDate, 'yyyy-MM-dd');
      setProjects({ ...projects, [dateKey]: updatedProject });
    }
  };

  const exportToExcel = () => {
    try {
      const projectsData = Object.entries(projects).map(([date, project]) => ({
        Fecha: format(new Date(date), 'dd/MM/yyyy'),
        Título: project.title,
        Actividades: project.activities.map(a => `${a.title}${a.completed ? ' (Completada)' : ''}`).join(', '),
        Estado: project.isBlocked ? 'Bloqueado' : 'Disponible',
        'Cotización ID': project.cotizacionId || 'N/A',
        'Fecha Exportación': format(new Date(), 'dd/MM/yyyy HH:mm:ss')
      }));

      const ws = XLSX.utils.json_to_sheet(projectsData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Calendario");
      
      // Ajustar ancho de columnas
      const wscols = [
        { wch: 12 }, // Fecha
        { wch: 30 }, // Título
        { wch: 50 }, // Actividades
        { wch: 15 }, // Estado
        { wch: 20 }, // Cotización ID
        { wch: 20 }  // Fecha Exportación
      ];
      ws['!cols'] = wscols;
      
      XLSX.writeFile(wb, `calendario_actividades_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    } catch (error) {
      console.error("Error al exportar a Excel:", error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4">
      {/* Vista Selector */}
      <div className="flex justify-end mb-4">
        <select
          value={viewType}
          onChange={(e) => setViewType(e.target.value as 'month' | 'week' | 'year')}
          className="px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="month">Vista Mensual</option>
          <option value="week">Vista Semanal</option>
          <option value="year">Vista Anual</option>
        </select>
        <button
          onClick={exportToExcel}
          className="ml-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
        >
          <Download className="h-5 w-5" />
          Exportar a Excel
        </button>
      </div>
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-gray-800">
          {format(currentDate, 'MMMM yyyy', { locale: es })}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={handlePrevMonth}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
          <div
            key={day}
            className="text-center font-semibold text-gray-600 p-2"
          >
            {day}
          </div>
        ))}
        {monthDays.map(day => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const hasProject = projects[dateKey];
          const isBlocked = hasProject?.isBlocked;
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          
          return (
            <button
              key={day.toString()}
              onClick={() => !isBlocked && handleDateClick(day)}
              disabled={isBlocked}
              className={`
                min-h-[100px] p-2 border rounded-lg relative transition-all
                ${!isSameMonth(day, currentDate) ? 'bg-gray-50 text-gray-400' : 'bg-white'}
                ${isSelected ? 'ring-2 ring-blue-500' : 'hover:bg-gray-50'}
                ${isBlocked ? 'cursor-not-allowed bg-gray-100' : 'cursor-pointer'}
              `}
            >
              <span className="absolute top-2 left-2 text-sm">
                {format(day, 'd')}
              </span>
              {hasProject && (
                <div className="mt-6">
                  {isBlocked ? (
                    <div className="flex flex-col items-center">
                      <Lock className="h-4 w-4 text-red-400" />
                      <span className="text-xs text-red-400 mt-1">Reservado</span>
                      {hasProject.cotizacionId && (
                        <span className="text-xs text-gray-500 mt-1">
                          #{hasProject.cotizacionId.slice(0, 8)}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {hasProject.activities.slice(0, 2).map((activity, index) => (
                        <div
                          key={activity.id}
                          className="text-xs truncate text-left text-gray-600"
                        >
                          • {activity.title}
                        </div>
                      ))}
                      {hasProject.activities.length > 2 && (
                        <div className="text-xs text-gray-500 text-center">
                          +{hasProject.activities.length - 2} más
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Project Sheet Modal */}
      {showProjectSheet && currentProject && selectedDate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-800">
                  {currentProject.title}
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={toggleBlockDate}
                    className={`p-2 rounded-full transition-colors ${
                      currentProject.isBlocked
                        ? 'bg-red-100 text-red-600 hover:bg-red-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    title={currentProject.isBlocked ? 'Desbloquear fecha' : 'Bloquear fecha'}
                  >
                    {currentProject.isBlocked ? (
                      <Lock className="h-5 w-5" />
                    ) : (
                      <Unlock className="h-5 w-5" />
                    )}
                  </button>
                  <button
                    onClick={() => setShowProjectSheet(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Add New Activity Form */}
              {!currentProject.isBlocked && (
                <div className="mb-6 bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">
                    Agregar Nueva Actividad
                  </h4>
                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="Título de la actividad"
                      value={newActivity.title}
                      onChange={(e) => setNewActivity({ ...newActivity, title: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                    <textarea
                      placeholder="Descripción"
                      value={newActivity.description}
                      onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md"
                      rows={3}
                    />
                    <input
                      type="time"
                      value={newActivity.time}
                      onChange={(e) => setNewActivity({ ...newActivity, time: e.target.value })}
                      className="px-3 py-2 border rounded-md"
                    />
                    <button
                      onClick={addActivity}
                      disabled={!newActivity.title}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Agregar Actividad
                    </button>
                  </div>
                </div>
              )}

              {/* Activities List */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-700">
                  Actividades ({currentProject.activities.length})
                </h4>
                {currentProject.activities.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">
                    No hay actividades programadas para este día
                  </p>
                ) : (
                  currentProject.activities.map(activity => (
                    <div
                      key={activity.id}
                      className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={activity.completed}
                            onChange={() => toggleActivityCompletion(activity.id)}
                            disabled={currentProject.isBlocked}
                            className="mt-1"
                          />
                          <div>
                            <h5 className={`font-medium ${
                              activity.completed ? 'line-through text-gray-400' : 'text-gray-800'
                            }`}>
                              {activity.title}
                            </h5>
                            <p className={`text-sm mt-1 ${
                              activity.completed ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                              {activity.description}
                            </p>
                            {activity.time && (
                              <p className="text-sm text-gray-500 mt-2">
                                Hora: {activity.time}
                              </p>
                            )}
                          </div>
                        </div>
                        {!currentProject.isBlocked && (
                          <button
                            onClick={() => deleteActivity(activity.id)}
                            className="text-red-600 hover:text-red-700 p-1"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};