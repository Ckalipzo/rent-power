import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { Cliente, Generador, Renta, Pago, NotaCredito, Movimiento } from '../types/types';

// Función para exportar datos a Excel
export const exportToExcel = <T>(data: T[], fileName: string) => {
  if (!data || data.length === 0) {
    console.error(`No hay datos para exportar en ${fileName}`);
    return;
  }

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  XLSX.writeFile(wb, `${fileName}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
};

// Función para formatear datos antes de exportar a Excel
export const formatDataForExcel = {
  clientes: (data: Cliente[]) => 
    data.map(cliente => ({
      ID: cliente.id,
      Nombre: cliente.nombre,
      Email: cliente.email,
      Teléfono: cliente.telefono,
      Dirección: cliente.direccion || 'N/A'
    })),

  generadores: (data: Generador[]) => 
    data.map(generador => ({
      ID: generador.id,
      Modelo: generador.modelo,
      Capacidad: generador.capacidad,
      Estado: generador.estado,
      'Precio Renta Diario': generador.precioRentaDiario.toFixed(2)
    })),

  rentas: (data: Renta[]) => 
    data.map(renta => ({
      ID: renta.id,
      'ID Cliente': renta.clienteId,
      'ID Generador': renta.generadorId,
      'Fecha Inicio': format(new Date(renta.fechaInicio), 'dd/MM/yyyy'),
      'Fecha Fin': format(new Date(renta.fechaFin), 'dd/MM/yyyy'),
      Estado: renta.estado,
      'Método de Pago': renta.metodoPago,
      Total: renta.total.toFixed(2)
    })),

  pagos: (data: Pago[]) => 
    data.map(pago => ({
      ID: pago.id,
      'ID Renta': pago.rentaId,
      Monto: pago.monto.toFixed(2),
      Fecha: format(new Date(pago.fecha), 'dd/MM/yyyy'),
      'Método de Pago': pago.metodoPago,
      Estado: pago.estado
    })),

  notasCredito: (data: NotaCredito[]) => 
    data.map(nota => ({
      ID: nota.id,
      'ID Renta': nota.rentaId,
      Monto: nota.monto.toFixed(2),
      Fecha: format(new Date(nota.fecha), 'dd/MM/yyyy'),
      Motivo: nota.motivo || 'Sin especificar'
    })),

  movimientos: (data: Movimiento[]) => 
    data.map(movimiento => ({
      ID: movimiento.id,
      Fecha: format(new Date(movimiento.fecha), 'dd/MM/yyyy'),
      Tipo: movimiento.tipo,
      Concepto: movimiento.concepto,
      Monto: movimiento.monto.toFixed(2),
      Referencia: movimiento.referencia || 'N/A'
    }))
};
