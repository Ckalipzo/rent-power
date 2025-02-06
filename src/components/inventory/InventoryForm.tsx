import React, { useState, useEffect } from 'react';
import { Package, Barcode, DollarSign, MapPin, FileText, Calendar } from 'lucide-react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { es } from 'date-fns/locale';
import type { InventoryItem, Category } from '../../types/types';

interface InventoryFormProps {
  onSubmit: (item: Omit<InventoryItem, 'id' | 'created_at' | 'updated_at'>) => void;
  categories: Category[];
  itemInicial?: InventoryItem;
}

const InventoryForm: React.FC<InventoryFormProps> = ({
  onSubmit,
  categories,
  itemInicial
}) => {
  const [formData, setFormData] = useState<Omit<InventoryItem, 'id' | 'created_at' | 'updated_at'>>({
    category_id: itemInicial?.category_id || '',
    name: itemInicial?.name || '',
    model: itemInicial?.model || '',
    serial_number: itemInicial?.serial_number || '',
    status: itemInicial?.status || 'available',
    condition: itemInicial?.condition || 'new',
    purchase_date: itemInicial?.purchase_date || undefined,
    purchase_price: itemInicial?.purchase_price || undefined,
    daily_rental_price: itemInicial?.daily_rental_price || 0,
    location: itemInicial?.location || '',
    notes: itemInicial?.notes || '',
    minimum_stock: itemInicial?.minimum_stock || 1,
    current_stock: itemInicial?.current_stock || 0
  });


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.category_id || !formData.name || formData.daily_rental_price <= 0) {
      const missingFields = [];
      if (!formData.category_id) missingFields.push('Categoría');
      if (!formData.name) missingFields.push('Nombre');
      if (formData.daily_rental_price <= 0) missingFields.push('Precio de Renta Diario');
      
      alert(`Por favor complete los siguientes campos obligatorios:\n${missingFields.join('\n')}`);
      return;
    }
    
    if (formData.current_stock < formData.minimum_stock) {
      if (!confirm('El stock actual es menor que el stock mínimo. ¿Desea continuar?')) {
        return;
      }
    }

    onSubmit(formData);
    
    // Limpiar formulario después de enviar
    setFormData({
      category_id: '',
      name: '',
      model: '',
      serial_number: '',
      status: 'available',
      condition: 'new',
      purchase_date: undefined,
      purchase_price: undefined,
      daily_rental_price: 0,
      location: '',
      notes: '',
      minimum_stock: 1,
      current_stock: 0
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold text-gray-800 mb-6">
        {itemInicial ? 'Editar Item' : 'Nuevo Item de Inventario'}
      </h2>
      <p className="text-sm text-gray-500 mb-6">Los campos marcados con * son obligatorios</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Categoría */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            <div className="flex items-center gap-2 mb-1">
              <Package className="h-4 w-4" />
              Categoría
            </div>
          </label>
          <select
            required
            value={formData.category_id}
            onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">Seleccionar Categoría</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
        </div>

        {/* Nombre */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            <div className="flex items-center gap-2 mb-1">
              <Package className="h-4 w-4" />
              Nombre
            </div>
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        {/* Modelo */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            <div className="flex items-center gap-2 mb-1">
              <Package className="h-4 w-4" />
              Modelo
            </div>
          </label>
          <input
            type="text"
            value={formData.model || ''}
            onChange={(e) => setFormData({ ...formData, model: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        {/* Número de Serie */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            <div className="flex items-center gap-2 mb-1">
              <Barcode className="h-4 w-4" />
              Número de Serie
            </div>
          </label>
          <input
            type="text"
            value={formData.serial_number || ''}
            onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        {/* Estado */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Estado</label>
          <select
            required
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as InventoryItem['status'] })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="available">Disponible</option>
            <option value="rented">Rentado</option>
            <option value="maintenance">Mantenimiento</option>
            <option value="retired">Retirado</option>
          </select>
        </div>

        {/* Condición */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Condición</label>
          <select
            required
            value={formData.condition}
            onChange={(e) => setFormData({ ...formData, condition: e.target.value as InventoryItem['condition'] })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="new">Nuevo</option>
            <option value="good">Bueno</option>
            <option value="fair">Regular</option>
            <option value="poor">Malo</option>
          </select>
        </div>

        {/* Fecha de Compra */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="h-4 w-4" />
              Fecha de Compra
            </div>
          </label>
          <DatePicker
            selected={formData.purchase_date ? new Date(formData.purchase_date) : null}
            onChange={(date: Date) => setFormData({ ...formData, purchase_date: date.toISOString() })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            dateFormat="dd/MM/yyyy"
            locale={es}
          />
        </div>

        {/* Precio de Compra */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4" />
              Precio de Compra
            </div>
          </label>
          <input
            type="number"
            step="0.01"
            value={formData.purchase_price || ''}
            onChange={(e) => setFormData({ ...formData, purchase_price: parseFloat(e.target.value) })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        {/* Precio de Renta Diario */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4" />
              Precio de Renta Diario
            </div>
          </label>
          <input
            type="number"
            step="0.01"
            required
            value={formData.daily_rental_price}
            onChange={(e) => setFormData({ ...formData, daily_rental_price: parseFloat(e.target.value) })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        {/* Ubicación */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="h-4 w-4" />
              Ubicación
            </div>
          </label>
          <input
            type="text"
            value={formData.location || ''}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        {/* Stock Mínimo */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Stock Mínimo</label>
          <input
            type="number"
            required
            min="0"
            value={formData.minimum_stock}
            onChange={(e) => setFormData({ ...formData, minimum_stock: parseInt(e.target.value) })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        {/* Stock Actual */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Stock Actual</label>
          <input
            type="number"
            required
            min="0"
            value={formData.current_stock}
            onChange={(e) => setFormData({ ...formData, current_stock: parseInt(e.target.value) })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
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
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {itemInicial ? 'Actualizar Item' : 'Registrar Item'}
        </button>
      </div>
    </form>
  );
};

export default React.memo(InventoryForm);

export { InventoryForm }