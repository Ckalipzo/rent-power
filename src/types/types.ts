export interface Cliente {
  id: string;
  nombreEmpresa: string;
  cotizaciones?: Cotizacion[];
  nombreContacto: string;
  telefonoContacto: string;
  email: string;
  direccion: string;
  rfc: string;
  notas?: string;
  fechaRegistro: string;
}

export interface Proveedor {
  id: string;
  nombreEmpresa: string;
  nombreContacto: string;
  telefonoContacto: string;
  email: string;
  direccion: string;
  rfc: string;
  categoria: string;
  productos: string[];
  notas?: string;
  fechaRegistro: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface InventoryItem {
  id: string;
  category_id: string;
  name: string;
  model?: string;
  serial_number?: string;
  status: 'available' | 'rented' | 'maintenance' | 'retired';
  condition: 'new' | 'good' | 'fair' | 'poor';
  purchase_date?: string;
  purchase_price?: number;
  daily_rental_price: number;
  location?: string;
  notes?: string;
  minimum_stock: number;
  current_stock: number;
  created_at: string;
  updated_at: string;
}

export interface InventoryMovement {
  id: string;
  item_id: string;
  type: 'entrada' | 'salida';
  quantity: number;
  reference_type: 'compra' | 'renta' | 'ajuste';
  reference_id?: string;
  notes?: string;
  created_at: string;
  created_by: string;
}

export interface Project {
  id: string;
  title: string;
  activities: Activity[];
  isBlocked: boolean;
  cotizacionId?: string;
}

export interface Activity {
  id: string;
  title: string;
  description: string;
  time: string;
  completed: boolean;
}

export interface ProjectsByDate {
  [key: string]: Project;
}

export interface Renta {
  id: string;
  clienteId: string;
  item_id: string;
  fechaInicio: string;
  fechaFin: string;
  estado: string;
  metodoPago: string;
  total: number;
}

export interface Pago {
  id: string;
  tipo: 'ingreso' | 'egreso';
  categoria: string;
  concepto: string;
  monto: number;
  fecha: string;
  metodoPago: 'efectivo' | 'transferencia' | 'tarjeta' | 'cheque';
  estado: 'pendiente' | 'completado' | 'cancelado';
  comprobante?: string;
  cliente?: string;
  proveedor?: string;
  referencia?: string;
  notaCreditoId?: string;
}

export interface NotaCredito {
  id: string;
  clienteId: string;
  pagoId: string;
  monto: number;
  fecha: string;
  motivo: string;
  estado: 'activa' | 'cancelada';
  aplicada: boolean;
}

export interface Movimiento {
  id: string;
  tipo: 'ingreso' | 'egreso';
  categoria: string;
  concepto: string;
  monto: number;
  fecha: string;
  metodoPago: 'efectivo' | 'transferencia' | 'tarjeta' | 'cheque';
  estado: 'pendiente' | 'completado' | 'cancelado';
  referencia: string;
  pagoId?: string;
  notaCreditoId?: string;
  clienteId: string;
  proveedorId: string;
  comprobante?: string;
  notas?: string;
}

export type PeriodoFiltro = 'dia' | 'semana' | 'mes' | 'trimestre' | 'año' | 'total';

export interface Balance {
  ingresos: number;
  egresos: number;
  total: number;
  periodo: PeriodoFiltro;
  fechaInicio: string;
  fechaFin: string;
  detalleIngresos: Record<string, number>;
  detalleEgresos: Record<string, number>;
}

export interface Cotizacion {
  id: string;
  clienteId: string;
  fechaReserva: string;
  fecha: string;
  items: CotizacionItem[];
  subtotal: number;
  iva: number;
  total: number;
  vigencia: string;
  notas: string;
  estado: 'pendiente' | 'aprobada' | 'rechazada' | 'pagada';
  pdfGenerado?: boolean;
  pagoId?: string;
  stripeSessionId?: string;
  stripePaymentStatus?: 'pending' | 'completed' | 'failed';
}

export interface CotizacionItem {
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  total: number;
}