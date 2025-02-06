import React, { useState, useEffect } from 'react';
import { Package, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { InventoryItem, Category } from '../../types/types';
import InventoryForm from './InventoryForm';
import { DataTable } from '../DataTable';
import * as XLSX from 'xlsx';
import { useLocalStorage } from '../../hooks/useLocalStorage';

interface InventoryListProps {
  items: InventoryItem[];
  categories: Category[];
  onEdit: (item: InventoryItem) => void;
  onDelete: (id: string) => void;
  onAdd: (item: InventoryItem) => void;
}

export const InventoryList: React.FC<InventoryListProps> = ({
  items,
  categories,
  onEdit,
  onDelete,
  onAdd
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [showForm, setShowForm] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [localItems, setLocalItems] = useState<InventoryItem[]>(items);
  const [localCategories, setLocalCategories] = useLocalStorage<Category[]>('categories', []);

  // Inicializar categorías predefinidas
  useEffect(() => {
    if (localCategories.length === 0) {
      const defaultCategories: Category[] = [
        { id: crypto.randomUUID(), name: 'Generadores eléctricos', description: 'Equipos de generación eléctrica', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: crypto.randomUUID(), name: 'Audio', description: 'Equipos de sonido', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: crypto.randomUUID(), name: 'Iluminación', description: 'Equipos de iluminación', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: crypto.randomUUID(), name: 'Video', description: 'Equipos de video', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: crypto.randomUUID(), name: 'Estructural', description: 'Equipos estructurales', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: crypto.randomUUID(), name: 'Oficina', description: 'Equipos de oficina', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: crypto.randomUUID(), name: 'Otros', description: 'Otros equipos', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
      ];
      setLocalCategories(defaultCategories);
    }
  }, []);

  useEffect(() => {
    setLocalItems(items);
  }, [items]);

  const handleAddItem = (newItem: Omit<InventoryItem, 'id' | 'created_at' | 'updated_at'>) => {
    const item: InventoryItem = {
      ...newItem,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    setLocalItems([...localItems, item]);
    if (typeof window !== 'undefined') {
      localStorage.setItem('inventory_items', JSON.stringify([...localItems, item]));
    }
    setShowForm(false);
  };

  const filteredItems = localItems.filter((item) => {
    const categoryMatch = !filterCategory || item.category_id === filterCategory;
    const statusMatch = !filterStatus || item.status === filterStatus;
    const searchMatch =
      !searchTerm ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.serial_number?.toLowerCase().includes(searchTerm.toLowerCase());
    return categoryMatch && statusMatch && searchMatch;
  });

  const handleExportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      filteredItems.map((item) => ({
        Nombre: item.name,
        Categoría: categories.find((c) => c.id === item.category_id)?.name || '-',
        'Número de Serie': item.serial_number || 'N/A',
        Estado: item.status || 'Desconocido',
        Condición: item.condition || 'Desconocida',
        Stock: item.current_stock ?? 0,
        'Precio de Renta': item.daily_rental_price ? `$${item.daily_rental_price.toFixed(2)}` : 'N/A',
        'Última Actualización': item.updated_at ? format(new Date(item.updated_at), 'dd/MM/yyyy HH:mm') : 'N/A',
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventario');
    XLSX.writeFile(workbook, 'Inventario.xlsx');
  };

  return (
    <div className="space-y-6">
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <InventoryForm
              categories={categories}
              itemInicial={selectedItem}
              key={selectedItem?.id || 'new'}
              onSubmit={(item) => {
                if (selectedItem) {
                  onEdit({ ...item, id: selectedItem.id });
                } else {
                  onAdd(item);
                }
                setShowForm(false);
                setSelectedItem(null);
              }}
            />
            <div className="p-4 bg-gray-50 flex justify-end">
              <button
                onClick={() => {
                  setShowForm(false);
                  setSelectedItem(null);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Package className="h-6 w-6 text-blue-600" /> Inventario
        </h2>
        <div className="flex gap-4">
          <button
            onClick={handleExportToExcel}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Exportar a Excel
          </button>
          <button
            onClick={() => {
              setSelectedItem(null);
              setShowForm(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="h-5 w-5" /> Agregar Item
          </button>
        </div>
      </div>

      <DataTable
        data={filteredItems}
        columns={[
          { key: 'name', label: 'Nombre' },
          { key: 'category_id', label: 'Categoría', render: (value) => categories.find((c) => c.id === value)?.name || '-' },
          { key: 'serial_number', label: 'No. Serie' },
          { key: 'status', label: 'Estado' },
          { key: 'condition', label: 'Condición' },
          { key: 'current_stock', label: 'Stock' },
          { key: 'daily_rental_price', label: 'Precio Renta', render: (value) => `$${value.toFixed(2)}` },
          { key: 'updated_at', label: 'Última Actualización', render: (value) => value ? format(new Date(value), 'dd/MM/yyyy HH:mm') : '-' }
        ]}
        type="inventory"
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </div>
  );
};