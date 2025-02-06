import React, { useState, useEffect } from 'react';
import { DollarSign, Plus, FileText } from 'lucide-react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { es } from 'date-fns/locale';
import type { Cliente, Proveedor, NotaCredito, Pago, Cotizacion } from '../types/types';
import { CATEGORIAS_INGRESO, CATEGORIAS_EGRESO, METODOS_PAGO } from '../constants/financeCategories';
import { QuotationSearch } from './QuotationSearch';

interface FinanceFormProps {
  onSubmit: (movement: {
    tipo: 'ingreso' | 'egreso';
    categoria: string;
    concepto: string;
    monto: number;
    fecha: Date;
    metodoPago: typeof METODOS_PAGO[number];
    referencia: string;
    comprobante?: string;
    clienteId?: string;
    proveedorId?: string;
    notaCreditoId?: string;
  }) => void;
  clientes?: Cliente[];
  proveedores?: Proveedor[];
  notasCredito?: NotaCredito[];
  pagos?: Pago[];
}

export const FinanceForm: React.FC<FinanceFormProps> = ({ 
  onSubmit,
  clientes = [],
  proveedores = [],
  notasCredito = [],
  pagos = []
}) => {
  const [tipo, setTipo] = useState<'ingreso' | 'egreso'>('ingreso');
  const [categoria, setCategoria] = useState(CATEGORIAS_INGRESO[0]); // Primera opción por defecto
  const [concepto, setConcepto] = useState('');
  const [monto, setMonto] = useState<number | ''>('');
  const [fecha, setFecha] = useState(new Date());
  const [metodoPago, setMetodoPago] = useState<typeof METODOS_PAGO[number]>('efectivo');
  const [referencia, setReferencia] = useState('');
  const [comprobante, setComprobante] = useState('');
  const [clienteId, setClienteId] = useState('');
  const [proveedorId, setProveedorId] = useState('');
  const [notaCreditoId, setNotaCreditoId] = useState('');
  const [mostrarBuscadorCotizaciones, setMostrarBuscadorCotizaciones] = useState(false);
  const [cotizacionId, setCotizacionId] = useState('');
  const [cotizacionesDisponibles, setCotizacionesDisponibles] = useState<Cotizacion[]>([]);
  const [pagoId, setPagoId] = useState<string>('');
  
  // Filtrar notas de crédito no aplicadas
  const notasCreditoDisponibles = notasCredito.filter(nota => !nota.aplicada);
  
  // Obtener el total de notas de crédito disponibles para el cliente/proveedor seleccionado
  const totalNotasCredito = notasCreditoDisponibles
    .filter(nota => {
      const pago = pagos.find(p => p.id === nota.pagoId);
      return tipo === 'ingreso' 
        ? pago?.cliente === clienteId 
        : pago?.proveedor === proveedorId;
    })
    .reduce((sum, nota) => sum + nota.monto, 0);

  useEffect(() => {
    if (tipo === 'ingreso' && clienteId) {
      const cliente = clientes?.find(c => c.id === clienteId);
      const cotizacionesDisponibles = cliente?.cotizaciones?.filter(
        cot => (cot.estado === 'pendiente' || cot.estado === 'aprobada') && !cot.pagoId
      ) || [];
      setCotizacionesDisponibles(cotizacionesDisponibles);
    } else {
      setCotizacionesDisponibles([]);
    }
  }, [tipo, clienteId, clientes]);

  // Actualizar monto cuando se selecciona una cotización
  useEffect(() => {
    if (cotizacionId) {
      const cotizacion = cotizacionesDisponibles.find(c => c.id === cotizacionId);
      if (cotizacion) {
        setMonto(cotizacion.total);
        setConcepto(`Pago de cotización #${cotizacion.id.slice(0, 8)}`);
      }
    }
  }, [cotizacionId, cotizacionesDisponibles]);

  // Categorías específicas por tipo de entidad
  const getCategoriasPorEntidad = () => {
    if (tipo === 'ingreso') {
      const cliente = clientes?.find(c => c.id === clienteId);
      if (!cliente) return CATEGORIAS_INGRESO;
      
      // Personalizar categorías según el tipo de cliente
      if (cliente.sector === 'construccion') {
        return ['Renta de Generadores', 'Servicios Adicionales', 'Mantenimiento'];
      }
      return CATEGORIAS_INGRESO;
    } else {
      const proveedor = proveedores?.find(p => p.id === proveedorId);
      if (!proveedor) return CATEGORIAS_EGRESO;
      
      // Personalizar categorías según el tipo de proveedor
      switch (proveedor.categoria) {
        case 'Refacciones':
          return ['Mantenimiento', 'Materiales', 'Herramientas'];
        case 'Servicios de Mantenimiento':
          return ['Mantenimiento', 'Servicios'];
        case 'Combustible':
          return ['Combustible'];
        case 'Transporte':
          return ['Transporte'];
        default:
          return CATEGORIAS_EGRESO;
      }
    }
  };

  const getConceptoSugerido = () => {
    if (tipo === 'ingreso') {
      const cliente = clientes?.find(c => c.id === clienteId);
      if (!cliente) return '';
      return `Pago de ${cliente.nombreEmpresa} - ${categoria}`;
    } else {
      const proveedor = proveedores?.find(p => p.id === proveedorId);
      if (!proveedor) return '';
      return `Pago a ${proveedor.nombreEmpresa} - ${categoria} - ${proveedor.categoria}`;
    }
  };

  useEffect(() => {
    // Cuando cambia el tipo, actualizar la categoría con la primera opción disponible
    const categorias = getCategoriasPorEntidad();
    setCategoria(categorias[0]);
    
    // Limpiar la selección opuesta
    if (tipo === 'ingreso') {
      setProveedorId('');
    } else {
      setClienteId('');
    }
    
    setConcepto('');
  }, [tipo]);

  useEffect(() => {
    // Actualizar concepto cuando cambia la categoría
    const conceptoSugerido = getConceptoSugerido();
    if (conceptoSugerido) {
      setConcepto(conceptoSugerido);
    }
  }, [categoria]);

  useEffect(() => {
    // Actualizar concepto cuando cambia el cliente/proveedor
    const conceptoSugerido = getConceptoSugerido();
    if (conceptoSugerido) {
      setConcepto(conceptoSugerido);
    }
  }, [clienteId, proveedorId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!concepto.trim() || monto === '' || monto <= 0) {
      alert("Por favor, complete todos los campos obligatorios.");
      return;
    }
    
    // Si se seleccionó una nota de crédito, verificar que el monto no exceda
    if (notaCreditoId) {
      const notaCredito = notasCredito.find(n => n.id === notaCreditoId);
      if (notaCredito && Number(monto) > notaCredito.monto) {
        alert("El monto no puede exceder el valor de la nota de crédito");
        return;
      }
    }

    // Si se seleccionó una nota de crédito, marcarla como aplicada
    if (notaCreditoId) {
      const notaCredito = notasCredito.find(n => n.id === notaCreditoId);
      if (notaCredito) {
        const notasActualizadas = notasCredito.map(nota => 
          nota.id === notaCreditoId ? { ...nota, aplicada: true } : nota
        );
        // Actualizar el estado global de notas de crédito
        if (typeof window !== 'undefined') {
          localStorage.setItem('notasCredito', JSON.stringify(notasActualizadas));
        }
      }
    }
    
    // Si hay una cotización seleccionada, actualizar su estado
    if (cotizacionId) {
      const cliente = clientes?.find(c => c.id === clienteId);
      const nuevoPagoId = crypto.randomUUID();
      setPagoId(nuevoPagoId);
      if (cliente?.cotizaciones) {
        // Actualizar el estado de la cotización y agregar el ID del pago
        const cotizacionesActualizadas = cliente.cotizaciones.map(cot =>
          cot.id === cotizacionId
            ? { ...cot, estado: 'pagada', pagoId: nuevoPagoId }
            : cot
        );
        
        // Actualizar el cliente con las cotizaciones actualizadas
        const clienteActualizado = {
          ...cliente,
          cotizaciones: cotizacionesActualizadas
        };
        
        // Actualizar la lista de clientes
        const clientesActualizados = clientes.map(c =>
          c.id === clienteId ? clienteActualizado : c
        );
        
        // Actualizar el estado global de clientes
        if (typeof window !== 'undefined') {
          localStorage.setItem('clientes', JSON.stringify(clientesActualizados));
        }
      }
    }

    onSubmit({
      tipo,
      categoria,
      concepto,
      pagoId: cotizacionId ? pagoId : undefined,
      monto: Number(monto),
      fecha,
      metodoPago,
      referencia: cotizacionId ? `Cotización #${cotizacionId.slice(0, 8)}` : referencia,
      comprobante,
      clienteId: tipo === 'ingreso' ? clienteId : undefined,
      proveedorId: tipo === 'egreso' ? proveedorId : undefined,
      notaCreditoId: notaCreditoId || undefined
    });

    // Reiniciar formulario
    setConcepto('');
    setMonto('');
    setMetodoPago('efectivo');
    setReferencia('');
    setComprobante('');
    setClienteId('');
    setProveedorId('');
    setNotaCreditoId('');
    setCotizacionId('');
    setFecha(new Date());
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Buscador de Cotizaciones */}
        {tipo === 'ingreso' && (
          <div className="md:col-span-2">
            <button
              type="button"
              onClick={() => setMostrarBuscadorCotizaciones(true)}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <FileText className="h-5 w-5" />
              Buscar Cotización
            </button>
          </div>
        )}

        {/* Cotizaciones Disponibles */}
        {tipo === 'ingreso' && cotizacionesDisponibles.length > 0 && (
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">
              <div className="flex items-center gap-2 mb-1">
                <FileText className="h-4 w-4" />
                Cotización Relacionada
              </div>
            </label>
            <select
              value={cotizacionId}
              onChange={(e) => {
                setCotizacionId(e.target.value);
                const cotizacion = cotizacionesDisponibles.find(c => c.id === e.target.value);
                if (cotizacion) {
                  setMonto(cotizacion.total);
                  setConcepto(`Pago de cotización #${cotizacion.id.slice(0, 8)}`);
                }
              }}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">No relacionar con cotización</option>
              {cotizacionesDisponibles.map((cot) => (
                <option key={cot.id} value={cot.id}>
                  Cotización #{cot.id.slice(0, 8)} - ${cot.total.toFixed(2)}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Tipo de Movimiento */}
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">Tipo de Movimiento</label>
          <div className="flex space-x-4">
            {['ingreso', 'egreso'].map((option) => (
              <label key={option} className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="tipo"
                  value={option}
                  checked={tipo === option}
                  onChange={() => setTipo(option as 'ingreso' | 'egreso')}
                  className="text-blue-600"
                />
                <span className={option === 'ingreso' ? "text-green-600" : "text-red-600"}>
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Categoría */}
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">Categoría</label>
          <select
            required
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
          >
            <option value="">Seleccionar Categoría</option>
            {getCategoriasPorEntidad().map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Cliente/Proveedor */}
        {tipo === 'ingreso' && clientes.length > 0 && (
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Cliente <span className="text-red-500">*</span>
            </label>
            <select
              value={clienteId}
              onChange={(e) => setClienteId(e.target.value)}
              className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 ${
                !clienteId ? 'text-gray-400' : ''
              }`}
              required
            >
              <option value="" disabled>Seleccionar Cliente</option>
              {clientes.map((cliente) => (
                <option key={cliente.id} value={cliente.id}>
                  [{cliente.rfc}] 
                  {cliente.nombreEmpresa}
                </option>
              ))}
            </select>
          </div>
        )}

        {tipo === 'egreso' && proveedores.length > 0 && (
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Proveedor <span className="text-red-500">*</span>
            </label>
            <select
              value={proveedorId}
              onChange={(e) => setProveedorId(e.target.value)}
              className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 ${
                !proveedorId ? 'text-gray-400' : ''
              }`}
              required
            >
              <option value="" disabled>Seleccionar Proveedor</option>
              {proveedores.map((proveedor) => (
                <option key={proveedor.id} value={proveedor.id}>
                  [{proveedor.categoria}] 
                  {proveedor.nombreEmpresa}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Monto */}
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">Monto</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
              <DollarSign className="h-5 w-5" />
            </span>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              value={monto}
              onChange={(e) => setMonto(e.target.value === '' ? '' : parseFloat(e.target.value))}
              className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              placeholder="0.00"
            />
          </div>
        </div>

        {/* Fecha */}
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">Fecha</label>
          <DatePicker
            selected={fecha}
            onChange={(date: Date) => setFecha(date)}
            required
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            dateFormat="dd/MM/yyyy"
            locale={es}
          />
        </div>

        {/* Concepto */}
        <div className="md:col-span-2">
          <label className="block text-gray-700 text-sm font-bold mb-2">Concepto</label>
          <input
            type="text"
            value={concepto}
            required
            onChange={(e) => setConcepto(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            placeholder="Descripción del movimiento"
          />
        </div>

        {/* Notas de Crédito Disponibles */}
        {notasCreditoDisponibles.length > 0 && (
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">
              <div className="flex items-center gap-2 mb-1">
                <FileText className="h-4 w-4" />
                Notas de Crédito Disponibles
              </div>
            </label>
            <select
              value={notaCreditoId}
              onChange={(e) => setNotaCreditoId(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">No aplicar nota de crédito</option>
              {notasCreditoDisponibles.map((nota) => {
                const pago = pagos.find(p => p.id === nota.pagoId);
                const cliente = pago?.cliente ? clientes.find(c => c.id === pago.cliente) : null;
                const proveedor = pago?.proveedor ? proveedores.find(p => p.id === pago.proveedor) : null;
                const entidad = cliente?.nombreEmpresa || proveedor?.nombreEmpresa || 'N/A';
                return (
                  <option key={nota.id} value={nota.id}>
                    {`${entidad} - $${nota.monto.toFixed(2)} - ${nota.motivo}`}
                  </option>
                );
              })}
            </select>
            {totalNotasCredito > 0 && (
              <p className="mt-2 text-sm text-gray-600">
                Total en notas de crédito disponibles: ${totalNotasCredito.toFixed(2)}
              </p>
            )}
          </div>
        )}

        {/* Método de Pago */}
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">Método de Pago</label>
          <select
            value={metodoPago}
            onChange={(e) => setMetodoPago(e.target.value as typeof METODOS_PAGO[number])}
            required
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
          >
            {METODOS_PAGO.map((metodo) => (
              <option key={metodo} value={metodo}>
                {metodo.charAt(0).toUpperCase() + metodo.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Comprobante */}
        <div className="md:col-span-2">
          <label className="block text-gray-700 text-sm font-bold mb-2">Comprobante (Opcional)</label>
          <input
            type="text"
            value={comprobante}
            onChange={(e) => setComprobante(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            placeholder="Número de factura, folio, etc."
          />
        </div>

        {/* Referencia */}
        <div className="md:col-span-2">
          <label className="block text-gray-700 text-sm font-bold mb-2">Referencia (Opcional)</label>
          <input
            type="text"
            value={referencia}
            onChange={(e) => setReferencia(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            placeholder="Número de factura, recibo, etc."
          />
        </div>
      </div>

      {/* Botón de Envío */}
      <div className="mt-6 flex justify-end">
        <button
          type="submit"
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <Plus className="h-5 w-5 mr-2" />
          Agregar Movimiento
        </button>
      </div>

      {/* Modal de Búsqueda de Cotizaciones */}
      {mostrarBuscadorCotizaciones && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Buscar Cotización</h3>
              <QuotationSearch
                clientes={clientes || []}
                onSelect={(cotizacion, cliente) => {
                  setCotizacionId(cotizacion.id);
                  setClienteId(cliente.id);
                  setMonto(cotizacion.total);
                  setConcepto(`Pago de cotización #${cotizacion.id.slice(0, 8)}`);
                  setMostrarBuscadorCotizaciones(false);
                }}
              />
            </div>
            <div className="bg-gray-50 px-6 py-4 flex justify-end">
              <button
                type="button"
                onClick={() => setMostrarBuscadorCotizaciones(false)}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
};