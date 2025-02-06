import React, { useState } from 'react';
import { FileText, DollarSign, User, Calendar } from 'lucide-react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { es } from 'date-fns/locale';
import type { Cliente, Proveedor, Pago, NotaCredito } from '../types/types';

interface NotaCreditoFormProps {
  onSubmit: (notaCredito: Omit<NotaCredito, 'id' | 'estado' | 'aplicada'>) => void;
  pagos: Pago[];
  clientes: Cliente[];
  proveedores: Proveedor[];
}

export const NotaCreditoForm: React.FC<NotaCreditoFormProps> = ({
  onSubmit,
  pagos,
  clientes,
  proveedores
}) => {
  const [formData, setFormData] = useState({
    clienteId: '',
    pagoId: '',
    monto: '',
    fecha: new Date(),
    motivo: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clienteId || !formData.pagoId || !formData.monto || !formData.motivo) {
      alert('Por favor complete todos los campos requeridos');
      return;
    }

    const pago = pagos.find(p => p.id === formData.pagoId);
    if (!pago) {
      alert('Pago no encontrado');
      return;
    }

    if (Number(formData.monto) > pago.monto) {
      alert('El monto de la nota de crédito no puede ser mayor al monto del pago');
      return;
    }

    onSubmit({
      clienteId: formData.clienteId,
      pagoId: formData.pagoId,
      monto: Number(formData.monto),
      fecha: formData.fecha.toISOString(),
      motivo: formData.motivo
    });

    // Limpiar formulario
    setFormData({
      clienteId: '',
      pagoId: '',
      monto: '',
      fecha: new Date(),
      motivo: ''
    });
  };

  const getPagoLabel = (pago: Pago) => {
    const cliente = pago.cliente ? clientes.find(c => c.id === pago.cliente) : null;
    const proveedor = pago.proveedor ? proveedores.find(p => p.id === pago.proveedor) : null;
    const entidad = cliente ? cliente.nombreEmpresa : proveedor ? proveedor.nombreEmpresa : 'N/A';
    return `${pago.concepto} - ${entidad} - $${pago.monto}`;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow-md">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Cliente */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">
            <div className="flex items-center gap-2 mb-1">
              <User className="h-4 w-4" />
              Cliente
            </div>
          </label>
          <select
            required
            value={formData.clienteId}
            onChange={(e) => {
              setFormData({ 
                ...formData, 
                clienteId: e.target.value,
                pagoId: '' // Resetear el pago seleccionado cuando cambia el cliente
              });
            }}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">Seleccionar Cliente</option>
            {clientes.map((cliente) => (
              <option key={cliente.id} value={cliente.id}>
                {cliente.nombreEmpresa} - {cliente.rfc}
              </option>
            ))}
          </select>
        </div>

        {/* Pago Relacionado */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="h-4 w-4" />
              Pago Relacionado
            </div>
          </label>
          <select
            required
            value={formData.pagoId}
            onChange={(e) => setFormData({ ...formData, pagoId: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">Seleccionar Pago</option>
            {pagos
              .filter(pago => pago.cliente === formData.clienteId)
              .map((pago) => (
              <option key={pago.id} value={pago.id}>
                {getPagoLabel(pago)}
              </option>
            ))}
          </select>
        </div>

        {/* Monto */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4" />
              Monto
            </div>
          </label>
          <input
            type="number"
            required
            step="0.01"
            min="0"
            value={formData.monto}
            onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        {/* Fecha */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="h-4 w-4" />
              Fecha
            </div>
          </label>
          <DatePicker
            selected={formData.fecha}
            onChange={(date: Date) => setFormData({ ...formData, fecha: date })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            dateFormat="dd/MM/yyyy"
            locale={es}
          />
        </div>

        {/* Motivo */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="h-4 w-4" />
              Motivo
            </div>
          </label>
          <textarea
            required
            value={formData.motivo}
            onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Crear Nota de Crédito
        </button>
      </div>
    </form>
  );
};