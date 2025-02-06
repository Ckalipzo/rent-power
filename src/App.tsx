import React, { useState } from 'react';
import { Calendar, DollarSign, Refrigerator as Generator, Users, CreditCard, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { DataTable } from './components/DataTable';
import { FinanceForm } from './components/FinanceForm';
import { ProjectCalendar } from './components/calendar/ProjectCalendar';
import { InventoryList } from './components/inventory/InventoryList';
import { InventoryForm } from './components/inventory/InventoryForm';
import { InventoryMovementForm } from './components/inventory/InventoryMovementForm';
import { InventoryMovementList } from './components/inventory/InventoryMovementList';
import { FinanceStats } from './components/FinanceStats';
import { ClienteForm } from './components/ClienteForm';
import { ProveedorForm } from './components/ProveedorForm';
import { CotizacionesViewer } from './components/CotizacionesViewer';
import { NotaCreditoForm } from './components/NotaCreditoForm';
import { useLocalStorage } from './hooks/useLocalStorage';
import { Cliente, Category, InventoryItem, InventoryMovement, Renta, Pago, NotaCredito, Movimiento, Proveedor, PeriodoFiltro } from './types/types';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

function App() {
  const [activeTab, setActiveTab] = useState('calendario');
  const [clientes, setClientes] = useLocalStorage<Cliente[]>('clientes', []);
  const [proveedores, setProveedores] = useLocalStorage<Proveedor[]>('proveedores', []);
  const [categories] = useLocalStorage<Category[]>('categories', []);
  const [inventoryItems, setInventoryItems] = useLocalStorage<InventoryItem[]>('inventory_items', []);
  const [inventoryMovements, setInventoryMovements] = useLocalStorage<InventoryMovement[]>('inventory_movements', []);
  const [rentas, setRentas] = useLocalStorage<Renta[]>('rentas', []);
  const [pagos, setPagos] = useLocalStorage<Pago[]>('pagos', []);
  const [notasCredito, setNotasCredito] = useLocalStorage<NotaCredito[]>('notasCredito', []);
  const [movimientos, setMovimientos] = useLocalStorage<Movimiento[]>('movimientos', []);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [periodoPrincipal, setPeriodoPrincipal] = useState<PeriodoFiltro>('mes');

  const handleAddPago = (nuevoPago: {
    tipo: 'ingreso' | 'egreso';
    categoria: string;
    concepto: string;
    monto: number;
    fecha: Date;
    metodoPago: 'efectivo' | 'transferencia' | 'tarjeta' | 'cheque';
    referencia: string;
    comprobante?: string;
    clienteId?: string;
    proveedorId?: string;
  }) => {
    const pago: Pago = {
      id: crypto.randomUUID(),
      tipo: nuevoPago.tipo,
      categoria: nuevoPago.categoria,
      concepto: nuevoPago.concepto,
      monto: nuevoPago.monto,
      fecha: nuevoPago.fecha.toISOString(),
      metodoPago: nuevoPago.metodoPago,
      referencia: nuevoPago.referencia,
      comprobante: nuevoPago.comprobante,
      cliente: nuevoPago.clienteId,
      proveedor: nuevoPago.proveedorId,
      estado: 'completado',
    };
    setPagos([...pagos, pago]);

    const movimiento: Movimiento = {
      id: crypto.randomUUID(),
      tipo: nuevoPago.tipo,
      categoria: nuevoPago.categoria,
      concepto: nuevoPago.concepto,
      monto: nuevoPago.monto,
      fecha: nuevoPago.fecha.toISOString(),
      metodoPago: nuevoPago.metodoPago,
      estado: 'completado',
      referencia: nuevoPago.referencia,
      pagoId: pago.id,
      clienteId: nuevoPago.clienteId || '',
      proveedorId: nuevoPago.proveedorId || '',
      comprobante: nuevoPago.comprobante
    };
    setMovimientos([...movimientos, movimiento].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()));
  };

  const handleDeletePago = (id: string) => {
    if (window.confirm("¿Seguro que deseas eliminar este pago?")) {
      setPagos(pagos.filter((p) => p.id !== id));
      setMovimientos(movimientos.filter((m) => m.pagoId !== id));
    }
  };

  const handleAddNotaCredito = (notaCredito: Omit<NotaCredito, 'id'>) => {
    const nuevaNotaCredito: NotaCredito = {
      ...notaCredito,
      id: crypto.randomUUID(),
      estado: 'activa',
      aplicada: false
    };
    setNotasCredito([...notasCredito, nuevaNotaCredito]);

    // Crear movimiento correspondiente
    const movimiento: Movimiento = {
      id: crypto.randomUUID(),
      tipo: 'egreso',
      categoria: 'Notas de Crédito',
      concepto: `Nota de Crédito - ${notaCredito.motivo}`,
      monto: notaCredito.monto,
      fecha: new Date().toISOString(),
      metodoPago: 'transferencia',
      estado: 'completado',
      referencia: nuevaNotaCredito.id,
      notaCreditoId: nuevaNotaCredito.id,
      clienteId: '',
      proveedorId: ''
    };
    setMovimientos([...movimientos, movimiento]);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-blue-600 text-white p-4">
        <div className="container mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold">PowerRent</h1>
          <button className="hover:bg-blue-700 px-3 py-2 rounded">Iniciar Sesión</button>
        </div>
      </nav>

      <div className="container mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg">
          <div className="flex border-b">
            {[
              { id: 'calendario', label: 'Calendario', icon: <Calendar className="h-5 w-5" /> },
              { id: 'inventory', label: 'Inventario', icon: <Generator className="h-5 w-5" /> },
              { id: 'clientes', label: 'Clientes', icon: <Users className="h-5 w-5" /> },
              { id: 'proveedores', label: 'Proveedores', icon: <Users className="h-5 w-5" /> },
              { id: 'pagos', label: 'Pagos', icon: <CreditCard className="h-5 w-5" /> },
              { id: 'finanzas', label: 'Finanzas', icon: <DollarSign className="h-5 w-5" /> },
              { id: 'notasCredito', label: 'Notas de Crédito', icon: <FileText className="h-5 w-5" /> }
            ].map(({ id, label, icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`px-6 py-4 flex items-center space-x-2 ${
                  activeTab === id ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'
                }`}
              >
                {icon}
                <span>{label}</span>
              </button>
            ))}
            <button
              onClick={() => setActiveTab('cotizaciones')}
              className={`px-6 py-4 flex items-center space-x-2 ${
                activeTab === 'cotizaciones' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'
              }`}
            >
              <FileText className="h-5 w-5" />
              <span>Cotizaciones</span>
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'calendario' && <ProjectCalendar />}
            {activeTab === 'inventory' && (
              <div className="space-y-8">
                <InventoryList
                  items={inventoryItems}
                  categories={categories}
                  onEdit={(updatedItem) => {
                    setInventoryItems(items => 
                      items.map(item => item.id === updatedItem.id ? updatedItem : item)
                    );
                  }}
                  onDelete={(id) => {
                    if (window.confirm('¿Está seguro de eliminar este item?')) {
                      setInventoryItems(items => items.filter(item => item.id !== id));
                    }
                  }}
                  onAdd={(newItem) => {
                    setInventoryItems(items => [...items, newItem]);
                  }}
                />
                <InventoryMovementForm
                  items={inventoryItems}
                  onSubmit={(movement) => {
                    const newMovement = {
                      ...movement,
                      id: crypto.randomUUID(),
                      created_at: new Date().toISOString(),
                      created_by: 'system' // Reemplazar con ID del usuario actual
                    };
                    setInventoryMovements(prev => [...prev, newMovement]);

                    // Actualizar stock
                    setInventoryItems(items =>
                      items.map(item => {
                        if (item.id === movement.item_id) {
                          const stockChange = movement.type === 'entrada' ? movement.quantity : -movement.quantity;
                          return {
                            ...item,
                            current_stock: item.current_stock + stockChange
                          };
                        }
                        return item;
                      })
                    );
                  }}
                />
                <InventoryMovementList
                  movements={inventoryMovements}
                  items={inventoryItems}
                />
              </div>
            )}
            {activeTab === 'clientes' && <ClienteForm clientes={clientes} setClientes={setClientes} />} 
            {activeTab === 'proveedores' && (
              <ProveedorForm 
                onSubmit={(proveedor) => {
                  const nuevoProveedor = {
                    ...proveedor,
                    id: crypto.randomUUID(),
                    fechaRegistro: new Date().toISOString()
                  };
                  setProveedores([...proveedores, nuevoProveedor]);
                }}
                proveedores={proveedores}
                setProveedores={setProveedores}
              />
            )} 
            {activeTab === 'pagos' && (
              <div>
                <FinanceForm 
                  onSubmit={handleAddPago}
                  clientes={clientes}
                  proveedores={proveedores}
                  notasCredito={notasCredito}
                  pagos={pagos}
                />
                <DataTable 
                  data={pagos} 
                  columns={[
                    { 
                      key: 'fecha', 
                      label: 'Fecha', 
                      render: (value) => format(new Date(value), 'dd/MM/yyyy') 
                    },
                    { key: 'tipo', label: 'Tipo' },
                    { 
                      key: 'categoria', 
                      label: 'Categoría',
                      render: (value) => value.charAt(0).toUpperCase() + value.slice(1)
                    },
                    {
                      key: 'cliente',
                      label: 'Cliente',
                      render: (value, row) => {
                        const cliente = clientes.find(c => c.id === value);
                        const notaCredito = notasCredito.find(n => n.id === row.notaCreditoId);
                        return cliente ? `${cliente.nombreEmpresa}${notaCredito ? ' (NC)' : ''}` : '-';
                      }
                    },
                    {
                      key: 'proveedor',
                      label: 'Proveedor',
                      render: (value, row) => {
                        const proveedor = proveedores.find(p => p.id === value);
                        const notaCredito = notasCredito.find(n => n.id === row.notaCreditoId);
                        return proveedor ? `${proveedor.nombreEmpresa}${notaCredito ? ' (NC)' : ''}` : '-';
                      }
                    },
                    { key: 'concepto', label: 'Concepto' },
                    { 
                      key: 'monto', 
                      label: 'Monto', 
                      render: (value) => `$${value.toFixed(2)}` 
                    },
                    { 
                      key: 'metodoPago', 
                      label: 'Método de Pago',
                      render: (value) => value.charAt(0).toUpperCase() + value.slice(1)
                    },
                    { 
                      key: 'estado', 
                      label: 'Estado',
                      render: (value, row) => {
                        const notaCredito = notasCredito.find(n => n.id === row.notaCreditoId);
                        return notaCredito ? 'Saldado con NC' : value.charAt(0).toUpperCase() + value.slice(1);
                      }
                    }
                  ]} 
                  type="pagos" 
                  onDelete={handleDeletePago} 
                />
              </div>
            )} 
            {activeTab === 'finanzas' && (
              <FinanceStats 
                movimientos={movimientos} 
                periodo={periodoPrincipal} 
                onPeriodChange={setPeriodoPrincipal}
              />
            )} 
            {activeTab === 'notasCredito' && (
              <div className="space-y-6">
                <NotaCreditoForm
                  onSubmit={handleAddNotaCredito}
                  pagos={pagos}
                  clientes={clientes}
                  proveedores={proveedores}
                />
                <DataTable
                  data={notasCredito}
                  columns={[
                    {
                      key: 'fecha',
                      label: 'Fecha',
                      render: (value) => format(new Date(value), 'dd/MM/yyyy')
                    },
                    {
                      key: 'pagoId',
                      label: 'Pago',
                      render: (value) => {
                        const pago = pagos.find(p => p.id === value);
                        return pago ? pago.concepto : '-';
                      }
                    },
                    {
                      key: 'monto',
                      label: 'Monto',
                      render: (value) => `$${value.toFixed(2)}`
                    },
                    { key: 'motivo', label: 'Motivo' },
                    {
                      key: 'estado',
                      label: 'Estado',
                      render: (value) => value.charAt(0).toUpperCase() + value.slice(1)
                    },
                    {
                      key: 'aplicada',
                      label: 'Aplicada',
                      render: (value) => value ? 'Sí' : 'No'
                    }
                  ]}
                  type="notasCredito"
                  onDelete={(id) => {
                    if (window.confirm('¿Estás seguro de eliminar esta nota de crédito?')) {
                      setNotasCredito(notasCredito.filter(n => n.id !== id));
                      setMovimientos(movimientos.filter(m => m.notaCreditoId !== id));
                    }
                  }}
                />
              </div>
            )}
            {activeTab === 'cotizaciones' && (
              <CotizacionesViewer
                clientes={clientes}
                onStatusChange={(clienteId, cotizacionId, newStatus) => {
                  const clientesActualizados = clientes.map(cliente => {
                    if (cliente.id === clienteId) {
                      const cotizacionesActualizadas = cliente.cotizaciones?.map(cot =>
                        cot.id === cotizacionId ? { ...cot, estado: newStatus } : cot
                      ) || [];
                      return { ...cliente, cotizaciones: cotizacionesActualizadas };
                    }
                    return cliente;
                  });
                  setClientes(clientesActualizados);
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;