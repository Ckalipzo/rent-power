import React, { useState } from 'react';
import { Package, FileText, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import type { InventoryMovement, InventoryItem } from '../../types/types';

interface InventoryMovementFormProps {
  onSubmit: (movement: Omit<InventoryMovement, 'id' | 'created_at' | 'created_by'>) => void;
  items: InventoryItem[];
}

export const InventoryMovementForm: React.FC<InventoryMovementFormProps> = ({
  onSubmit,
  items
}) => {
  const [formData, setFormData] = useState<Omit<InventoryMovement, 'id' | 'created_at' | 'created_by'>>({
    item_id: '',
    type: 'entrada',
    quantity: 1,
    reference_type: 'compra',
    notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({
      item_id: '',
      type: 'entrada',
      quantity: 1,
      reference_type: 'compra',
      notes: ''
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow-md">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tipo de Movimiento */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Tipo de Movimiento</label>
          <div className="mt-2 flex gap-4">
            <label className="inline-flex items-center">
              <input
                type="radio"
                value="entrada"
                checked={formData.type === 'entrada'}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as 'entrada' | 'salida' })}
                className="form-radio h-4 w-4 text-blue-600"
              />
              <span className="ml-2 flex items-center gap-1 text-green-600">
                <ArrowDownCircle className="h-4 w-4" />
                Entrada
              </span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                value="salida"
                checked={formData.type === 'salida'}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as 'entrada' | 'salida' })}
                className="form-radio h-4 w-4 text-blue-600"
              />
              <span className="ml-2 flex items-center gap-1 text-red-600">
                <ArrowUpCircle className="h-4 w-4" />
                Salida
              </span>
            </label>
          </div>
        </div>

        {/* Item */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            <div className="flex items-center gap-2 mb-1">
              <Package className="h-4 w-4" />
              Item
            </div>
          </label>
          <select
            required
            value={formData.item_id}
            onChange={(e) => setFormData({ ...formData, item_id: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option key="default-option" value="">Seleccionar Item</option>
            {items.map(item => (
              <option key={item.id} value={item.id}>
                {item.name} - {item.model} (Stock: {item.current_stock})
              </option>
            ))}
          </select>
        </div>

        {/* Cantidad */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Cantidad</label>
          <input
            type="number"
            required
            min="1"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        {/* Tipo de Referencia */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Tipo de Referencia</label>
          <select
            required
            value={formData.reference_type}
            onChange={(e) => setFormData({ ...formData, reference_type: e.target.value as 'compra' | 'renta' | 'ajuste' })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="compra">Compra</option>
            <option value="renta">Renta</option>
            <option value="ajuste">Ajuste de Inventario</option>
          </select>
        </div>

        {/* Notas */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="h-4 w-4" />
              Notas
            </div>
          </label>
          <textarea
            rows={3}
            value={formData.notes || ''}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="Detalles adicionales del movimiento..."
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Registrar Movimiento
        </button>
      </div>
    </form>
  );
};