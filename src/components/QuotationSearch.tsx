import React, { useState, useEffect } from 'react';
import { Search, FileText, Calendar, DollarSign, User } from 'lucide-react';
import { format } from 'date-fns';
import type { Cotizacion, Cliente } from '../types/types';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

interface QuotationSearchProps {
  clientes: Cliente[];
  onSelect: (cotizacion: Cotizacion, cliente: Cliente) => void;
}

export const QuotationSearch: React.FC<QuotationSearchProps> = ({ clientes, onSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [minAmount, setMinAmount] = useState<string>('');
  const [maxAmount, setMaxAmount] = useState<string>('');
  const [sortField, setSortField] = useState<'fecha' | 'monto' | 'cliente'>('fecha');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  // Obtener todas las cotizaciones activas
  const todasLasCotizaciones = React.useMemo(() => clientes.flatMap(cliente => 
    (cliente.cotizaciones || [])
      .filter(cot => cot.estado === 'pendiente' || cot.estado === 'aprobada')
      .map(cotizacion => ({
        cotizacion,
        cliente
      }))
  ), [clientes]);

  // Aplicar filtros
  const cotizacionesFiltradas = React.useMemo(() => {
    return todasLasCotizaciones.filter(({ cotizacion, cliente }) => {
      // Filtro por término de búsqueda
      const searchMatch = searchTerm === '' || 
        cotizacion.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cliente.nombreEmpresa.toLowerCase().includes(searchTerm.toLowerCase());

      // Filtro por cliente
      const clientMatch = selectedClient === '' || cliente.id === selectedClient;

      // Filtro por rango de fechas
      const dateMatch = (!dateRange[0] || new Date(cotizacion.fecha) >= dateRange[0]) &&
                       (!dateRange[1] || new Date(cotizacion.fecha) <= dateRange[1]);

      // Filtro por monto
      const minAmountMatch = minAmount === '' || cotizacion.total >= parseFloat(minAmount);
      const maxAmountMatch = maxAmount === '' || cotizacion.total <= parseFloat(maxAmount);

      return searchMatch && clientMatch && dateMatch && minAmountMatch && maxAmountMatch;
    }).sort((a, b) => {
      const direction = sortDirection === 'asc' ? 1 : -1;
      
      switch (sortField) {
        case 'fecha':
          return direction * (new Date(a.cotizacion.fecha).getTime() - new Date(b.cotizacion.fecha).getTime());
        case 'monto':
          return direction * (a.cotizacion.total - b.cotizacion.total);
        case 'cliente':
          return direction * a.cliente.nombreEmpresa.localeCompare(b.cliente.nombreEmpresa);
        default:
          return 0;
      }
    });
  }, [todasLasCotizaciones, searchTerm, selectedClient, dateRange, minAmount, maxAmount, sortField, sortDirection]);

  // Paginación
  const totalPages = Math.ceil(cotizacionesFiltradas.length / itemsPerPage);
  const paginatedCotizaciones = cotizacionesFiltradas.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSort = (field: 'fecha' | 'monto' | 'cliente') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Búsqueda general */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Buscar por folio o cliente..."
            />
          </div>

          {/* Selector de cliente */}
          <div>
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">Todos los clientes</option>
              {clientes.map(cliente => (
                <option key={cliente.id} value={cliente.id}>
                  {cliente.nombreEmpresa}
                </option>
              ))}
            </select>
          </div>

          {/* Rango de fechas */}
          <div className="flex gap-2">
            <DatePicker
              selected={dateRange[0]}
              onChange={(date) => setDateRange([date, dateRange[1]])}
              selectsStart
              startDate={dateRange[0]}
              endDate={dateRange[1]}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholderText="Fecha inicial"
              dateFormat="dd/MM/yyyy"
            />
            <DatePicker
              selected={dateRange[1]}
              onChange={(date) => setDateRange([dateRange[0], date])}
              selectsEnd
              startDate={dateRange[0]}
              endDate={dateRange[1]}
              minDate={dateRange[0]}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholderText="Fecha final"
              dateFormat="dd/MM/yyyy"
            />
          </div>

          {/* Rango de montos */}
          <div className="flex gap-2">
            <input
              type="number"
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Monto mínimo"
            />
            <input
              type="number"
              value={maxAmount}
              onChange={(e) => setMaxAmount(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Monto máximo"
            />
          </div>
        </div>
      </div>

      {/* Resultados */}
      <div className="bg-white shadow overflow-hidden rounded-md">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Folio
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('fecha')}
                >
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Fecha
                    {sortField === 'fecha' && (
                      <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('cliente')}
                >
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    Cliente
                    {sortField === 'cliente' && (
                      <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('monto')}
                >
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    Monto
                    {sortField === 'monto' && (
                      <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vigencia
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedCotizaciones.map(({ cotizacion, cliente }) => (
                <tr 
                  key={cotizacion.id} 
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => onSelect(cotizacion, cliente)}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    #{cotizacion.id.slice(0, 8)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {format(new Date(cotizacion.fecha), 'dd/MM/yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>
                      <p className="font-medium">{cliente.nombreEmpresa}</p>
                      <p className="text-gray-500">{cliente.rfc}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ${cotizacion.total.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      cotizacion.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {cotizacion.estado.charAt(0).toUpperCase() + cotizacion.estado.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {cotizacion.vigencia}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Mostrando <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> a{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * itemsPerPage, cotizacionesFiltradas.length)}
                  </span>{' '}
                  de <span className="font-medium">{cotizacionesFiltradas.length}</span> resultados
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium ${
                        page === currentPage
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Siguiente
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};