import React, { useState, useEffect } from 'react';
import { Building2, User, Phone, Mail, MapPin, FileText, Briefcase, Globe, CreditCard, File, Trash2, FileOutput, X, Plus, DollarSign, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { DataTable } from './DataTable';
import type { Cliente } from '../types/types';
import { Cotizacion, CotizacionItem } from '../types/types';

interface ClienteFormProps {
  onSubmit: (cliente: Cliente) => void;
  clientes: Cliente[];
  setClientes: React.Dispatch<React.SetStateAction<Cliente[]>>;
  clienteInicial?: Cliente;
}

export const ClienteForm: React.FC<ClienteFormProps> = ({ onSubmit, clientes, setClientes, clienteInicial }) => {
  const [formData, setFormData] = useState<Cliente>({
    id: clienteInicial?.id || Date.now().toString(),
    fechaRegistro: clienteInicial?.fechaRegistro || new Date().toISOString(),
    cotizaciones: clienteInicial?.cotizaciones || [],
    nombreEmpresa: clienteInicial?.nombreEmpresa || '',
    rfc: clienteInicial?.rfc || '',
    nombreContacto: clienteInicial?.nombreContacto || '',
    telefonoContacto: clienteInicial?.telefonoContacto || '',
    email: clienteInicial?.email || '',
    direccion: clienteInicial?.direccion || '',
    contacto: clienteInicial?.contacto || '',
    sector: clienteInicial?.sector || '',
    pais: clienteInicial?.pais || '',
    metodoPago: clienteInicial?.metodoPago || '',
    notas: clienteInicial?.notas || ''
  });

  const [mostrarCotizacion, setMostrarCotizacion] = useState(false);
  const [cotizacion, setCotizacion] = useState<Cotizacion>({
    id: crypto.randomUUID(),
    clienteId: '',
    fecha: new Date().toISOString(),
    items: [],
    subtotal: 0,
    iva: 0,
    total: 0,
    vigencia: '30 días',
    notas: '',
    estado: 'pendiente'
  });

  const [nuevoItem, setNuevoItem] = useState({
    descripcion: '',
    cantidad: 1,
    precioUnitario: 0
  });

  const [selectedClientId, setSelectedClientId] = useState('');
  const selectedClient = clientes.find(c => c.id === selectedClientId);

  // Actualizar cotización cuando se selecciona un cliente
  useEffect(() => {
    if (clienteInicial) {
      setFormData(clienteInicial);
    }
  }, [clienteInicial]);

  useEffect(() => {
    if (selectedClientId) {
      const client = clientes.find(c => c.id === selectedClientId);
      if (client) {
        setCotizacion(prev => ({
          ...prev,
          clienteId: client.id,
          estado: 'pendiente'
        }));
      }
    }
  }, [selectedClientId, clientes]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prevState => ({
      ...prevState,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newCliente: Cliente = {
      ...formData,
      id: clienteInicial?.id || crypto.randomUUID(),
      fechaRegistro: clienteInicial?.fechaRegistro || new Date().toISOString(),
    };

    console.log("Cliente registrado:", newCliente);

    setClientes(prevClientes =>
      clienteInicial
        ? prevClientes.map(cliente => (cliente.id === clienteInicial.id ? newCliente : cliente))
        : [...prevClientes, newCliente]
    );

    if (onSubmit) {
      onSubmit(newCliente);
    }

    if (!clienteInicial) {
      setFormData({
        id: crypto.randomUUID(),
        fechaRegistro: new Date().toISOString(),
        nombreEmpresa: '',
        rfc: '',
        nombreContacto: '',
        telefonoContacto: '',
        email: '',
        direccion: '',
        contacto: '',
        sector: '',
        pais: '',
        metodoPago: '',
        notas: ''
      });
    }
  };

  const exportToExcel = () => {
    try {
      const worksheet = XLSX.utils.json_to_sheet(clientes);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Clientes");
      XLSX.writeFile(workbook, "clientes.xlsx");
    } catch (error) {
      console.error("Error al exportar a Excel:", error);
    }
  };

  const handleDeleteTodayRecords = () => {
    const today = new Date().toLocaleDateString();
    const nuevosClientes = clientes.filter(cliente => new Date(cliente.fechaRegistro).toLocaleDateString() !== today);

    if (clientes.length !== nuevosClientes.length) {
      if (window.confirm("¿Estás seguro de borrar todos los registros de hoy?")) {
        setClientes(nuevosClientes);
      }
    } else {
      alert("No hay registros de hoy para borrar.");
    }
  };

  const agregarItemCotizacion = () => {
    if (nuevoItem.descripcion && nuevoItem.cantidad > 0 && nuevoItem.precioUnitario > 0) {
      const total = nuevoItem.cantidad * nuevoItem.precioUnitario;
      const nuevosItems = [...cotizacion.items, { ...nuevoItem, total }];
      
      const subtotal = nuevosItems.reduce((sum, item) => sum + item.total, 0);
      const iva = subtotal * 0.16;
      
      setCotizacion({
        ...cotizacion,
        items: nuevosItems,
        subtotal,
        iva,
        total: subtotal + iva
      });
      
      setNuevoItem({
        descripcion: '',
        cantidad: 1,
        precioUnitario: 0
      });
    }
  };

  const eliminarItemCotizacion = (index: number) => {
    const nuevosItems = cotizacion.items.filter((_, i) => i !== index);
    const subtotal = nuevosItems.reduce((sum, item) => sum + item.total, 0);
    const iva = subtotal * 0.16;
    
    setCotizacion({
      ...cotizacion,
      items: nuevosItems,
      subtotal,
      iva,
      total: subtotal + iva
    });
  };

  const exportarCotizacion = () => {
    if (!selectedClient) return;

    const previewContainer = document.createElement('div');
    previewContainer.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50';

    const logoUrl = "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=128&h=128&fit=crop";

    previewContainer.innerHTML = `
      <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div class="p-8">
          <div class="flex justify-between items-center border-b border-gray-200 pb-6 mb-6">
            <div class="flex items-center gap-4">
              <img src="${logoUrl}" alt="Logo" class="w-20 h-20 object-contain">
              <div>
                <h2 class="text-2xl font-bold text-gray-800">PowerRent</h2>
                <p class="text-sm text-gray-500">Soluciones en Energía</p>
              </div>
            </div>
            <div class="text-right">
              <p class="text-sm text-gray-500">Cotización #${cotizacion.id.slice(0, 8)}</p>
              <p class="text-sm text-gray-500">${new Date().toLocaleDateString()}</p>
            </div>
          </div>

          <div class="bg-gray-50 rounded-lg p-6 mb-6">
            <h3 class="text-lg font-semibold text-gray-800 mb-4">Información del Cliente</h3>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <p class="text-sm text-gray-600">Empresa</p>
                <p class="font-medium">${selectedClient?.nombreEmpresa || ''}</p>
              </div>
              <div>
                <p class="text-sm text-gray-600">RFC</p>
                <p class="font-medium">${selectedClient?.rfc || ''}</p>
              </div>
              <div>
                <p class="text-sm text-gray-600">Contacto</p>
                <p class="font-medium">${selectedClient?.nombreContacto || ''}</p>
              </div>
              <div>
                <p class="text-sm text-gray-600">Email</p>
                <p class="font-medium">${selectedClient?.email || ''}</p>
              </div>
            </div>
          </div>

          <table class="w-full mb-6">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio Unit.</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              ${cotizacion.items.map(item => `
                <tr>
                  <td class="px-6 py-4 text-sm text-gray-900">${item.descripcion}</td>
                  <td class="px-6 py-4 text-sm text-gray-900">${item.cantidad}</td>
                  <td class="px-6 py-4 text-sm text-gray-900">$${item.precioUnitario.toFixed(2)}</td>
                  <td class="px-6 py-4 text-sm font-medium text-gray-900">$${item.total.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="flex justify-end mb-6">
            <div class="w-64">
              <div class="flex justify-between py-2">
                <span class="text-gray-600">Subtotal:</span>
                <span class="font-medium">$${cotizacion.subtotal.toFixed(2)}</span>
              </div>
              <div class="flex justify-between py-2">
                <span class="text-gray-600">IVA (16%):</span>
                <span class="font-medium">$${cotizacion.iva.toFixed(2)}</span>
              </div>
              <div class="flex justify-between py-2 border-t border-gray-200">
                <span class="font-semibold">Total:</span>
                <span class="font-bold text-blue-600">$${cotizacion.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div class="border-t border-gray-200 pt-6">
            <div class="text-sm text-gray-600">
              <p><strong>Vigencia:</strong> ${cotizacion.vigencia}</p>
              <p class="mt-2"><strong>Notas:</strong> ${cotizacion.notas}</p>
              <p class="mt-4 text-xs text-gray-500">Esta cotización no representa un compromiso contractual.</p>
            </div>
          </div>
        </div>

        <div class="bg-gray-50 px-8 py-4 flex justify-end gap-4">
          <button class="px-4 py-2 text-gray-600 hover:text-gray-800" onclick="document.body.removeChild(this.closest('.fixed'))">
            Cerrar
          </button>
          <button class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 mr-2" onclick="window.dispatchEvent(new CustomEvent('savePDF', { detail: { cotizacionId: '${cotizacion.id}' } }))">
            Guardar PDF
          </button>
          <button class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" onclick="window.print()">
            Imprimir
          </button>
        </div>
      </div>
    `;

    // Agregar estilos de impresión
    const style = document.createElement('style');
    style.textContent = `
      @media print {
        body * {
          visibility: hidden;
        }
        .fixed {
          position: absolute;
          left: 0;
          top: 0;
          margin: 0;
          padding: 0;
        }
        .fixed * {
          visibility: visible;
        }
        .bg-white {
          box-shadow: none !important;
        }
        button {
          display: none !important;
        }
      }
    `;
    document.head.appendChild(style);

    // Agregar al DOM
    document.body.appendChild(previewContainer);

    // Manejar el evento de guardar PDF
    const handleSavePDF = async (event: CustomEvent) => {
      const { cotizacionId } = event.detail;
      const content = document.querySelector('.bg-white') as HTMLElement;
      
      if (content) {
        const canvas = await html2canvas(content, {
          scale: 2,
          useCORS: true,
          logging: false
        });
        
        const pdf = new jsPDF({
          format: 'a4',
          unit: 'mm'
        });

        const imgData = canvas.toDataURL('image/png');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`cotizacion-${cotizacionId.slice(0, 8)}.pdf`);

        // Guardar la cotización en el cliente con el PDF generado
        const clienteActualizado = {
          ...selectedClient,
          cotizaciones: [
            ...(selectedClient?.cotizaciones || []),
            {
              ...cotizacion,
              pdfGenerado: true,
              fecha: new Date().toISOString(),
              estado: 'pendiente'
            }
          ]
        };

        setClientes(prevClientes =>
          prevClientes.map(c =>
            c.id === selectedClient?.id ? clienteActualizado : c
          )
        );
      }
    };

    window.addEventListener('savePDF', handleSavePDF as EventListener);
    return () => {
      window.removeEventListener('savePDF', handleSavePDF as EventListener);
    };
  };

  return (
    <div className="space-y-8">
      {/* Lista de Cotizaciones */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-600" />
          Registro de Cotizaciones
        </h3>
        <DataTable
          data={formData.cotizaciones || []}
          columns={[
            {
              key: 'fecha',
              label: 'Fecha',
              render: (value) => format(new Date(value), 'dd/MM/yyyy')
            },
            {
              key: 'id',
              label: 'Folio',
              render: (value) => `#${value.slice(0, 8)}`
            },
            {
              key: 'items',
              label: 'Descripción',
              render: (value) => value.map((item: any) => item.descripcion).join(', ')
            },
            {
              key: 'total',
              label: 'Total',
              render: (value) => `$${value.toFixed(2)}`
            },
            {
              key: 'vigencia',
              label: 'Vigencia'
            },
            {
              key: 'estado',
              label: 'Estado',
              render: (value) => {
                const statusColors = {
                  pendiente: 'bg-yellow-100 text-yellow-800',
                  aprobada: 'bg-green-100 text-green-800',
                  rechazada: 'bg-red-100 text-red-800',
                  pagada: 'bg-blue-100 text-blue-800'
                };
                return (
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[value]}`}>
                    {value.charAt(0).toUpperCase() + value.slice(1)}
                  </span>
                );
              }
            },
            {
              key: 'pagoId',
              label: 'Referencia de Pago',
              render: (value) => value ? `Pago #${value.slice(0, 8)}` : '-'
            }
          ]}
          type="cotizaciones"
          onStatusChange={(id, status) => {
            const cotizacionesActualizadas = formData.cotizaciones?.map(cot =>
              cot.id === id ? { ...cot, estado: status } : cot
            ) || [];
            setFormData({ ...formData, cotizaciones: cotizacionesActualizadas });
          }}
          onMarkAsPaid={(id) => {
            const cotizacionesActualizadas = formData.cotizaciones?.map(cot =>
              cot.id === id ? { ...cot, estado: 'pagada' } : cot
            ) || [];
            setFormData({ ...formData, cotizaciones: cotizacionesActualizadas });
          }}
          onDelete={(id) => {
            if (window.confirm('¿Estás seguro de eliminar esta cotización?')) {
              const cotizacionesActualizadas = formData.cotizaciones?.filter(cot => cot.id !== id) || [];
              setFormData({ ...formData, cotizaciones: cotizacionesActualizadas });
            }
          }}
        />
      </div>
      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[ 
            { label: "Nombre de la Empresa", name: "nombreEmpresa", icon: Building2 },
            { label: "RFC", name: "rfc", icon: File },
            { label: "Nombre del Contacto", name: "nombreContacto", icon: User },
            { label: "Teléfono de Contacto", name: "telefonoContacto", icon: Phone },
            { label: "Correo Electrónico", name: "email", icon: Mail },
            { label: "Dirección", name: "direccion", icon: MapPin },
            { label: "Otro Contacto", name: "contacto", icon: FileText },
            { label: "Sector Empresarial", name: "sector", icon: Briefcase },
            { label: "País", name: "pais", icon: Globe },
            { label: "Método de Pago", name: "metodoPago", icon: CreditCard },
            { label: "Notas", name: "notas", icon: FileText }
          ].map(({ label, name, icon: Icon }) => (
            <div key={name}>
              <label className="block text-sm font-medium text-gray-700">
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="h-4 w-4" />
                  {label}
                </div>
              </label>
              <input
                type="text"
                name={name}
                value={(formData as any)[name]}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          ))}
        </div>

        <div className="flex justify-between">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none"
          >{clienteInicial ? 'Actualizar Cliente' : 'Registrar Cliente'}</button>
          
          <button
            type="button"
            onClick={() => setMostrarCotizacion(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none flex items-center gap-2"
          >
            <FileOutput className="h-5 w-5" />
            Generar Cotización
          </button>
          
          <button
            type="button"
            onClick={exportToExcel}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none"
          >
            Exportar a Excel
          </button>
        </div>
      </form>

      {mostrarCotizacion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center bg-gray-50">
              <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <FileOutput className="h-5 w-5 text-blue-600" />
                Generar Cotización
              </h3>
              <button
                onClick={() => setMostrarCotizacion(false)}
                className="text-gray-400 hover:text-gray-500 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6">
              {/* Cliente Info */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seleccionar Cliente
                </label>
                <select
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Seleccione un cliente</option>
                  {clientes.map(cliente => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.nombreEmpresa} - {cliente.rfc}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <h4 className="text-sm font-semibold text-blue-800 mb-2">Información del Cliente</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <p><span className="font-medium">Empresa:</span> {selectedClient?.nombreEmpresa || 'No seleccionado'}</p>
                  <p><span className="font-medium">RFC:</span> {selectedClient?.rfc || 'No seleccionado'}</p>
                  <p><span className="font-medium">Contacto:</span> {selectedClient?.nombreContacto || 'No seleccionado'}</p>
                  <p><span className="font-medium">Email:</span> {selectedClient?.email || 'No seleccionado'}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Descripción</label>
                  <input
                    type="text"
                    value={nuevoItem.descripcion}
                    onChange={(e) => setNuevoItem({ ...nuevoItem, descripcion: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 placeholder-gray-400"
                    placeholder="Ej: Renta de Generador 100KW"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Cantidad</label>
                  <input
                    type="number"
                    min="1"
                    value={nuevoItem.cantidad}
                    onChange={(e) => setNuevoItem({ ...nuevoItem, cantidad: Number(e.target.value) })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 placeholder-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Precio Unitario</label>
                  <div className="relative mt-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <DollarSign className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={nuevoItem.precioUnitario}
                      onChange={(e) => setNuevoItem({ ...nuevoItem, precioUnitario: Number(e.target.value) })}
                      className="pl-8 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={agregarItemCotizacion}
                className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="h-5 w-5" />
                Agregar Item
              </button>

              <div className="mt-6">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio Unit.</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {cotizacion.items.map((item, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.descripcion}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.cantidad}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${item.precioUnitario.toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">${item.total.toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => eliminarItemCotizacion(index)}
                            className="text-red-600 hover:text-red-900 transition-colors"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 space-y-2 bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-end">
                  <span className="font-medium">Subtotal:</span>
                  <span className="ml-4">${cotizacion.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-end">
                  <span className="font-medium">IVA (16%):</span>
                  <span className="ml-4">${cotizacion.iva.toFixed(2)}</span>
                </div>
                <div className="flex justify-end text-lg font-bold">
                  <span className="text-blue-600">Total:</span>
                  <span className="ml-4">${cotizacion.total.toFixed(2)}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Vigencia</label>
                  <input
                    type="text"
                    value={cotizacion.vigencia}
                    onChange={(e) => setCotizacion({ ...cotizacion, vigencia: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 placeholder-gray-400"
                    placeholder="Ej: 30 días"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Notas</label>
                  <textarea
                    value={cotizacion.notas}
                    onChange={(e) => setCotizacion({ ...cotizacion, notas: e.target.value })}
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 placeholder-gray-400"
                    placeholder="Términos y condiciones adicionales..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-4 mt-6">
                <button
                  onClick={() => setMostrarCotizacion(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2" type="button"
                >
                  <X className="h-5 w-5" />
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    if (!selectedClient) return;
                    
                    const clienteActualizado = {
                      ...selectedClient,
                      cotizaciones: [
                        ...(selectedClient?.cotizaciones || []),
                        {
                          ...cotizacion,
                          fecha: new Date().toISOString(),
                          estado: 'pendiente'
                        }
                      ]
                    };

                    setClientes(prevClientes =>
                      prevClientes.map(c =>
                        c.id === selectedClient?.id ? clienteActualizado : c
                      )
                    );

                    setMostrarCotizacion(false);
                    alert('Cotización guardada exitosamente');
                  }}
                  disabled={!selectedClientId || cotizacion.items.length === 0}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  type="button"
                >
                  <FileText className="h-5 w-5" />
                  Guardar Cotización
                </button>
                <button
                  onClick={exportarCotizacion}
                  disabled={!selectedClientId}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  type="button"
                >
                  <FileOutput className="h-5 w-5" />
                  Exportar Cotización
                </button>
                {!selectedClientId && (
                  <p className="text-sm text-red-500 mt-2">
                    Seleccione un cliente para generar la cotización
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">Registro Diario de Clientes</h3>
        {clientes.length === 0 ? (
          <p className="text-gray-500">No hay clientes registrados hoy.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-2">Fecha</th>
                  <th className="border border-gray-300 px-4 py-2">Empresa</th>
                  <th className="border border-gray-300 px-4 py-2">RFC</th>
                  <th className="border border-gray-300 px-4 py-2">Contacto</th>
                  <th className="border border-gray-300 px-4 py-2">Teléfono</th>
                </tr>
              </thead>
              <tbody>
                {clientes.map(cliente => (
                  <tr key={cliente.id} className="border border-gray-300">
                    <td className="border border-gray-300 px-4 py-2">{new Date(cliente.fechaRegistro).toLocaleDateString()}</td>
                    <td className="border border-gray-300 px-4 py-2">{cliente.nombreEmpresa}</td>
                    <td className="border border-gray-300 px-4 py-2">{cliente.rfc}</td>
                    <td className="border border-gray-300 px-4 py-2">{cliente.nombreContacto}</td>
                    <td className="border border-gray-300 px-4 py-2">{cliente.telefonoContacto}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <button onClick={handleDeleteTodayRecords} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center gap-2">
          <Trash2 className="h-5 w-5" /> Borrar Registro Diario
        </button>
      </div>
    </div>
  );
};