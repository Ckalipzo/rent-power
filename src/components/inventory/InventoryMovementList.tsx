import React, { useState } from 'react';
import { format } from 'date-fns';
import { ArrowDownCircle, ArrowUpCircle, Package, Calendar } from 'lucide-react';
import type { InventoryMovement, InventoryItem } from '../../types/types';
import { DataTable } from '../DataTable';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

interface InventoryMovementListProps {
  movements: InventoryMovement[];
  items: InventoryItem[];
}

export const InventoryMovementList: React.FC<InventoryMovementListProps> = ({
  movements,
  items
}) => {
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [selectedItem, setSelectedItem] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');

  const filteredMovements = movements.filter(movement => {
    const dateMatch = (!dateRange[0] || new Date(movement.created_at) >= dateRange[0]) &&
                     (!dateRange[1] || new Date(movement.created_at) <= dateRange[1]);
    const itemMatch = !selectedItem || movement.item_id === selectedItem;
    const typeMatch = !selectedType || movement.type === selectedType;
    return dateMatch && itemMatch && typeMatch;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Package className="h-6 w-6 text-blue-600" />
          Movimientos de Inventario
        </h2>
      </div>

      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Rango de Fechas */}
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar className="h-4 w-4 inline mr-1" />
                Fecha Inicial
              </label>
              <DatePicker
                selected={dateRange[0]}
                onChange={(date) => setDateRange([date, dateRange[1]])}
                selectsStart
                startDate={dateRange[0]}
                endDate={dateRange[1]}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholderText="Fecha inicial"
                dateFormat="dd/MM/yyyy"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar className="h-4 w-4 inline mr-1" />
                Fecha Final
              </label>
              <DatePicker
                selected={dateRange[1]}
                onChange={(date) => setDateRange([dateRange[0], date])}
                selectsEnd
                startDate={dateRange[0]}
                endDate={dateRange[1]}
                minDate={dateRange[0]}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholderText="Fecha final"
                dateFormat="dd/MM/yyyy"
              />
            </div>
          </div>

          {/* Filtro por Item */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Item</label>
            <select
              value={selectedItem}
              onChange={(e) => setSelectedItem(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option key="all-items" value="">Todos los items</option>
              {items.map(item => (
                <option key={item.id} value={item.id}>{item.name} - {item.model}</option>
              ))}
            </select>
          </div>

          {/* Filtro por Tipo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Todos los tipos</option>
              <option value="entrada">Entradas</option>
              <option value="salida">Salidas</option>
            </select>
          </div>
        </div>
      </div>

      <DataTable
        data={filteredMovements}
        columns={[
          {
            key: 'created_at',
            label: 'Fecha',
            render: (value) => value ? format(new Date(value), 'dd/MM/yyyy HH:mm') : '-'
          },
          {
            key: 'type',
            label: 'Tipo',
            render: (value) => (
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                value === 'entrada' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {value === 'entrada' ? (
                  <ArrowDownCircle className="h-4 w-4" />
                ) : (
                  <ArrowUpCircle className="h-4 w-4" />
                )}
                {value.charAt(0).toUpperCase() + value.slice(1)}
              </span>
            )
          },
          {
            key: 'item_id',
            label: 'Item',
            render: (value) => {
              const item = items.find(i => i.id === value);
              return item ? `${item.name} - ${item.model}` : value;
            }
          },
          {
            key: 'quantity',
            label: 'Cantidad',
            render: (value, row) => (
              <span className={row.type === 'entrada' ? 'text-green-600' : 'text-red-600'}>
                {row.type === 'entrada' ? '+' : '-'}{value}
              </span>
            )
          },
          {
            key: 'reference_type',
            label: 'Referencia',
            render: (value) => value.charAt(0).toUpperCase() + value.slice(1)
          },
          {
            key: 'notes',
            label: 'Notas'
          }
        ]}
        type="movements"
      />
    </div>
  );
};