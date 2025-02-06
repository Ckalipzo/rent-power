import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, subMonths, startOfQuarter, endOfQuarter } from 'date-fns';
import { es } from 'date-fns/locale';
import { Movimiento, PeriodoFiltro, Balance } from '../types/types';
import { CATEGORIAS_INGRESO, CATEGORIAS_EGRESO, METODOS_PAGO } from '../constants/financeCategories';
import { DollarSign, TrendingUp, TrendingDown, Calendar, Filter } from 'lucide-react';

const COLORS = ['#10B981', '#EF4444', '#F59E0B', '#3B82F6', '#8B5CF6', '#EC4899'];

interface FinanceStatsProps {
  movimientos: Movimiento[];
  periodo: PeriodoFiltro;
  currency?: string;
  onPeriodChange?: (periodo: PeriodoFiltro) => void;
}

export const FinanceStats: React.FC<FinanceStatsProps> = ({ 
  movimientos = [], 
  periodo = 'mes',
  currency = '$',
  onPeriodChange
}) => {
  const [balance, setBalance] = useState<Balance | null>(null);
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todas');
  const [filtroMetodoPago, setFiltroMetodoPago] = useState<string>('todos');
  const [totalesPorMetodo, setTotalesPorMetodo] = useState<Record<string, number>>({});
  const [movimientosFiltrados, setMovimientosFiltrados] = useState<Movimiento[]>([]);

  // Función para ajustar el monto considerando notas de crédito
  const getMontoAjustado = (movimiento: Movimiento) => {
    if (movimiento.tipo === 'ingreso') {
      const notasCreditoRelacionadas = movimientos.filter(m => 
        m.tipo === 'egreso' && 
        m.categoria === 'Notas de Crédito' && 
        m.pagoId === movimiento.pagoId
      );
      
      const totalNotasCredito = notasCreditoRelacionadas.reduce((sum, nota) => sum + nota.monto, 0);
      return movimiento.monto - totalNotasCredito;
    }
    return movimiento.monto;
  };

  // Obtener el rango de fechas según el período
  const getFechaRango = () => {
    const hoy = new Date();
    switch (periodo) {
      case 'dia':
        return {
          inicio: new Date(hoy.setHours(0, 0, 0, 0)),
          fin: new Date(hoy.setHours(23, 59, 59, 999))
        };
      case 'semana':
        const inicioSemana = new Date(hoy);
        inicioSemana.setDate(hoy.getDate() - hoy.getDay());
        const finSemana = new Date(hoy);
        finSemana.setDate(inicioSemana.getDate() + 6);
        return { inicio: inicioSemana, fin: finSemana };
      case 'mes':
        return {
          inicio: startOfMonth(hoy),
          fin: endOfMonth(hoy)
        };
      case 'trimestre':
        return {
          inicio: startOfQuarter(hoy),
          fin: endOfQuarter(hoy)
        };
      case 'año':
        return {
          inicio: new Date(hoy.getFullYear(), 0, 1),
          fin: new Date(hoy.getFullYear(), 11, 31)
        };
      default:
        return null;
    }
  };

  // Función para filtrar movimientos
  const filtrarMovimientos = (fechaRango: { inicio: Date; fin: Date }) => {
    return movimientos.filter(m => {
      const fecha = new Date(m.fecha);
      const cumpleFecha = fecha >= fechaRango.inicio && fecha <= fechaRango.fin;
      const cumpleCategoria = filtroCategoria === 'todas' || m.categoria === filtroCategoria;
      const cumpleMetodoPago = filtroMetodoPago === 'todos' || m.metodoPago === filtroMetodoPago;
      return cumpleFecha && cumpleCategoria && cumpleMetodoPago;
    }).sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  };

  useEffect(() => {
    const fechaRango = getFechaRango();
    if (!fechaRango) return;

    const movimientosFiltrados = filtrarMovimientos(fechaRango);
    setMovimientosFiltrados(movimientosFiltrados);

    const detalleIngresos: Record<string, number> = {};
    const detalleEgresos: Record<string, number> = {};
    let totalIngresos = 0;
    let totalEgresos = 0;
    const totalesPorMetodoPago: Record<string, number> = {};

    movimientosFiltrados.forEach(m => {
      const montoAjustado = getMontoAjustado(m);
      // Actualizar totales por método de pago
      totalesPorMetodoPago[m.metodoPago] = (totalesPorMetodoPago[m.metodoPago] || 0) + 
        (m.tipo === 'ingreso' ? montoAjustado : -montoAjustado);

      if (m.tipo === 'ingreso') {
        detalleIngresos[m.categoria] = (detalleIngresos[m.categoria] || 0) + montoAjustado;
        totalIngresos += montoAjustado;
      } else {
        detalleEgresos[m.categoria] = (detalleEgresos[m.categoria] || 0) + montoAjustado;
        totalEgresos += montoAjustado;
      }
    });

    setTotalesPorMetodo(totalesPorMetodoPago);
    setBalance({
      ingresos: totalIngresos,
      egresos: totalEgresos,
      total: totalIngresos - totalEgresos,
      periodo,
      fechaInicio: fechaRango.inicio.toISOString(),
      fechaFin: fechaRango.fin.toISOString(),
      detalleIngresos,
      detalleEgresos
    });
  }, [movimientos, periodo, filtroCategoria, filtroMetodoPago]);

  const getDatosGrafico = () => {
    if (!balance) return [];

    const fechaRango = getFechaRango();
    if (!fechaRango) return [];

    const dias = eachDayOfInterval({
      start: fechaRango.inicio,
      end: fechaRango.fin
    });

    return dias.map(dia => {
      const movimientosDia = movimientos.filter(m => 
        format(new Date(m.fecha), 'yyyy-MM-dd') === format(dia, 'yyyy-MM-dd')
      );

      const ingresos = movimientosDia
        .filter(m => m.tipo === 'ingreso')
        .reduce((acc, curr) => acc + curr.monto, 0);

      const egresos = movimientosDia
        .filter(m => m.tipo === 'egreso')
        .reduce((acc, curr) => acc + curr.monto, 0);

      return {
        fecha: format(dia, 'dd MMM', { locale: es }),
        ingresos,
        egresos,
        balance: ingresos - egresos
      };
    });
  };

  if (!balance) return <div>Cargando estadísticas...</div>;

  const datosGraficoTorta = Object.entries(balance.detalleIngresos).map(([categoria, monto]) => ({
    name: categoria,
    value: monto
  }));

  return (
    <div className="space-y-6">
      {/* Selector de Período */}
      <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-md flex-wrap gap-4">
        <div className="flex items-center space-x-4">
          <Calendar className="h-5 w-5 text-gray-500" />
          <span className="font-medium">Período:</span>
          <select
            value={periodo}
            onChange={(e) => onPeriodChange?.(e.target.value as PeriodoFiltro)}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="dia">Hoy</option>
            <option value="semana">Esta Semana</option>
            <option value="mes">Este Mes</option>
            <option value="trimestre">Este Trimestre</option>
            <option value="año">Este Año</option>
            <option value="total">Total</option>
          </select>

          <span className="font-medium ml-4">Categoría:</span>
          <select
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="todas">Todas</option>
            {[...CATEGORIAS_INGRESO, ...CATEGORIAS_EGRESO]
              .filter((cat, index, self) => self.indexOf(cat) === index)
              .map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))
            }
          </select>

          <span className="font-medium ml-4">Método de Pago:</span>
          <select
            value={filtroMetodoPago}
            onChange={(e) => setFiltroMetodoPago(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="todos">Todos</option>
            {METODOS_PAGO.map((metodo) => (
              <option key={metodo} value={metodo}>
                {metodo.charAt(0).toUpperCase() + metodo.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-md transform hover:scale-105 transition-transform duration-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-green-600">Ingresos</h3>
            <TrendingUp className="h-6 w-6 text-green-500" />
          </div>
          <p className="text-3xl font-bold text-green-700">{currency}{balance.ingresos.toFixed(2)}</p>
          <p className="text-sm text-gray-500 mt-2">
            {Object.keys(balance.detalleIngresos).length} categorías
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md transform hover:scale-105 transition-transform duration-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-red-600">Egresos</h3>
            <TrendingDown className="h-6 w-6 text-red-500" />
          </div>
          <p className="text-3xl font-bold text-red-700">{currency}{balance.egresos.toFixed(2)}</p>
          <p className="text-sm text-gray-500 mt-2">
            {Object.keys(balance.detalleEgresos).length} categorías
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md transform hover:scale-105 transition-transform duration-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-blue-600">Balance</h3>
            <DollarSign className="h-6 w-6 text-blue-500" />
          </div>
          <p className={`text-3xl font-bold ${balance.total >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
            {currency}{balance.total.toFixed(2)}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            {format(new Date(balance.fechaInicio), 'dd/MM/yyyy')} - {format(new Date(balance.fechaFin), 'dd/MM/yyyy')}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md transform hover:scale-105 transition-transform duration-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-purple-600">Rentabilidad</h3>
            <div className="h-6 w-6 flex items-center justify-center text-purple-500">%</div>
          </div>
          <p className="text-3xl font-bold text-purple-700">
            {balance.ingresos > 0 ? ((balance.total / balance.ingresos) * 100).toFixed(1) : '0'}%
          </p>
          <p className="text-sm text-gray-500 mt-2">Margen de beneficio</p>
        </div>
      </div>

      {/* Totales en Caja por Método de Pago */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">Total en Caja por Método de Pago</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {METODOS_PAGO.map((metodo) => (
            <div key={metodo} className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-700">
                  {metodo.charAt(0).toUpperCase() + metodo.slice(1)}
                </span>
                <DollarSign className="h-5 w-5 text-gray-500" />
              </div>
              <p className={`text-2xl font-bold ${
                (totalesPorMetodo[metodo] || 0) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {currency}{(totalesPorMetodo[metodo] || 0).toFixed(2)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Distribución de Ingresos</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={datosGraficoTorta}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {datosGraficoTorta.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => `${currency}${value.toFixed(2)}`}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Evolución Temporal</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={getDatosGrafico()} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="fecha" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => `${currency}${value.toFixed(2)}`}
                  labelFormatter={(label) => `Fecha: ${label}`}
                />
                <Legend />
                <Bar dataKey="ingresos" name="Ingresos" fill="#10B981" />
                <Bar dataKey="egresos" name="Egresos" fill="#EF4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detalles por Categoría */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Ingresos por Categoría */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4 text-green-600">Ingresos por Categoría</h3>
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monto
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    %
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Object.entries(balance.detalleIngresos)
                  .sort(([, a], [, b]) => b - a)
                  .map(([categoria, monto]) => (
                    <tr key={categoria} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {categoria}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600 font-medium">
                        {currency}{monto.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                        {((monto / balance.ingresos) * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Egresos por Categoría */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4 text-red-600">Egresos por Categoría</h3>
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monto
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    %
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Object.entries(balance.detalleEgresos)
                  .sort(([, a], [, b]) => b - a)
                  .map(([categoria, monto]) => (
                    <tr key={categoria} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {categoria}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600 font-medium">
                        {currency}{monto.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                        {((monto / balance.egresos) * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Lista Detallada de Movimientos */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">Lista Detallada de Movimientos</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Concepto</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Método</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {movimientosFiltrados.map((movimiento) => (
                <tr key={movimiento.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {format(new Date(movimiento.fecha), 'dd/MM/yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      movimiento.tipo === 'ingreso' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {movimiento.tipo.charAt(0).toUpperCase() + movimiento.tipo.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {movimiento.categoria}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {movimiento.concepto}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                    <span className={movimiento.tipo === 'ingreso' ? 'text-green-600' : 'text-red-600'}>
                      ${movimiento.monto.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {movimiento.metodoPago.charAt(0).toUpperCase() + movimiento.metodoPago.slice(1)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      movimiento.estado === 'completado' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {movimiento.estado.charAt(0).toUpperCase() + movimiento.estado.slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};