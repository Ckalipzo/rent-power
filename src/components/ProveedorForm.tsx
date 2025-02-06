import React, { useState } from 'react';
import { Building2, User, Phone, Mail, MapPin, FileText, Tags } from 'lucide-react';
import type { Proveedor } from '../types/types';

const CATEGORIAS_PROVEEDOR = [
  'Refacciones',
  'Servicios de Mantenimiento',
  'Combustible',
  'Transporte',
  'Herramientas',
  'Otros'
];

interface ProveedorFormProps {
  onSubmit?: (proveedor: Omit<Proveedor, 'id' | 'fechaRegistro'>) => void;
  setProveedores: React.Dispatch<React.SetStateAction<Proveedor[]>>;
  proveedores: Proveedor[];
  proveedorInicial?: Proveedor;
}

export const ProveedorForm: React.FC<ProveedorFormProps> = ({ 
  onSubmit,
  setProveedores,
  proveedores,
  proveedorInicial 
}) => {
  const [formData, setFormData] = useState({
    nombreEmpresa: proveedorInicial?.nombreEmpresa || '',
    nombreContacto: proveedorInicial?.nombreContacto || '',
    telefonoContacto: proveedorInicial?.telefonoContacto || '',
    email: proveedorInicial?.email || '',
    direccion: proveedorInicial?.direccion || '',
    rfc: proveedorInicial?.rfc || '',
    categoria: proveedorInicial?.categoria || '',
    productos: proveedorInicial?.productos || [],
    notas: proveedorInicial?.notas || ''
  });

  const [nuevoProducto, setNuevoProducto] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (onSubmit) {
        onSubmit(formData);
      } else {
        const nuevoProveedor = {
          ...formData,
          id: proveedorInicial?.id || crypto.randomUUID(),
          fechaRegistro: proveedorInicial?.fechaRegistro || new Date().toISOString()
        };

        setProveedores(prevProveedores =>
          proveedorInicial
            ? prevProveedores.map(p => (p.id === proveedorInicial.id ? nuevoProveedor : p))
            : [...prevProveedores, nuevoProveedor]
        );
      }

      // Limpiar formulario solo si no es una actualización
      if (!proveedorInicial) {
        setFormData({
          nombreEmpresa: '',
          nombreContacto: '',
          telefonoContacto: '',
          email: '',
          direccion: '',
          rfc: '',
          categoria: '',
          productos: [],
          notas: ''
        });
      }
    } catch (error) {
      console.error("Error al registrar proveedor:", error);
    }
    if (!proveedorInicial) {
      setFormData({
        nombreEmpresa: '',
        nombreContacto: '',
        telefonoContacto: '',
        email: '',
        direccion: '',
        rfc: '',
        categoria: '',
        productos: [],
        notas: ''
      });
    }
  };

  const agregarProducto = () => {
    if (nuevoProducto.trim()) {
      setFormData({
        ...formData,
        productos: [...formData.productos, nuevoProducto.trim()]
      });
      setNuevoProducto('');
    }
  };

  const eliminarProducto = (index: number) => {
    setFormData({
      ...formData,
      productos: formData.productos.filter((_, i) => i !== index)
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow-md">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Nombre de la Empresa */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="h-4 w-4" />
              Nombre de la Empresa
            </div>
          </label>
          <input
            type="text"
            required
            value={formData.nombreEmpresa}
            onChange={(e) => setFormData({ ...formData, nombreEmpresa: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        {/* RFC */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="h-4 w-4" />
              RFC
            </div>
          </label>
          <input
            type="text"
            required
            value={formData.rfc}
            onChange={(e) => setFormData({ ...formData, rfc: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        {/* Categoría */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            <div className="flex items-center gap-2 mb-1">
              <Tags className="h-4 w-4" />
              Categoría
            </div>
          </label>
          <select
            required
            value={formData.categoria}
            onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">Selecciona una categoría</option>
            {CATEGORIAS_PROVEEDOR.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Nombre del Contacto */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            <div className="flex items-center gap-2 mb-1">
              <User className="h-4 w-4" />
              Nombre del Contacto
            </div>
          </label>
          <input
            type="text"
            required
            value={formData.nombreContacto}
            onChange={(e) => setFormData({ ...formData, nombreContacto: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        {/* Teléfono */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            <div className="flex items-center gap-2 mb-1">
              <Phone className="h-4 w-4" />
              Teléfono de Contacto
            </div>
          </label>
          <input
            type="tel"
            required
            value={formData.telefonoContacto}
            onChange={(e) => setFormData({ ...formData, telefonoContacto: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            <div className="flex items-center gap-2 mb-1">
              <Mail className="h-4 w-4" />
              Email
            </div>
          </label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        {/* Dirección */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="h-4 w-4" />
              Dirección
            </div>
          </label>
          <input
            type="text"
            required
            value={formData.direccion}
            onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        {/* Productos/Servicios */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <div className="flex items-center gap-2 mb-1">
              <Tags className="h-4 w-4" />
              Productos/Servicios
            </div>
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={nuevoProducto}
              onChange={(e) => setNuevoProducto(e.target.value)}
              className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Agregar producto o servicio"
            />
            <button
              type="button"
              onClick={agregarProducto}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Agregar
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.productos.map((producto, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full"
              >
                {producto}
                <button
                  type="button"
                  onClick={() => eliminarProducto(index)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Notas */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="h-4 w-4" />
              Notas Adicionales
            </div>
          </label>
          <textarea
            rows={3}
            value={formData.notas}
            onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {proveedorInicial ? 'Actualizar Proveedor' : 'Registrar Proveedor'}
        </button>
      </div>
    </form>
  );
};