import { Component, OnInit } from '@angular/core';

import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { DetalleVenta } from 'src/app/Interfaces/detalle-venta';
import { Producto } from 'src/app/Interfaces/producto';
import { UtilidadService } from 'src/app/Reutilizable/utilidad.service';
import { ProductoService } from 'src/app/Services/producto.service';
import { VentaService } from 'src/app/Services/venta.service';
import { Venta } from '../../../../Interfaces/venta';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-venta',
  templateUrl: './venta.component.html',
  styleUrls: ['./venta.component.css']
})
export class VentaComponent implements OnInit {

  listaProductos: Producto[] = [];
  listaProductosFiltro: Producto[] = [];

  listaProductosParaVenta: DetalleVenta[] = [];
  bloquearBotonRegistrar: boolean = false;

  productoSeleccionado!: Producto;
  tipoPagoPorDefecto: string = "Efectivo";
  totalPagar: number = 0;

  formularioProductoVenta: FormGroup;
  columnasTabla: string[] = ['producto', 'cantidad', 'precio', 'total', 'accion'];
  datosDetalleVenta = new MatTableDataSource(this.listaProductosParaVenta);

  RetornarProductosPorFiltro(busqueda: any): Producto[]{
    const valorBuscado = typeof busqueda === "string" ? busqueda.toLowerCase() : busqueda.nombre.toLowerCase();

    return this.listaProductos.filter(item => item.nombre.toLowerCase().includes(valorBuscado));
  }

  constructor(
    private fb: FormBuilder,
    private _productoService: ProductoService,
    private _ventaService: VentaService,
    private _utilidadService: UtilidadService
  ) { 
    this.formularioProductoVenta = this.fb.group({
      producto: ['', Validators.required],
      cantidad: ['', Validators.required],
    });

    this._productoService.Lista().subscribe({
      next: (data) => {
        if (data.status) {
          const lista = data.value as Producto[];
          this.listaProductos = lista.filter(p => p.esActivo == 1 && p.stock > 0);
        }
      },
      error: (e) => { }
    });

    this.formularioProductoVenta.get('producto')?.valueChanges.subscribe(value => {
      this.listaProductosFiltro = this.RetornarProductosPorFiltro(value);
    });
  }

  ngOnInit(): void {
  }

  mostrarProducto(producto: Producto): string{
    return producto.nombre;
  }

  productoParaVenta(event: any) {
    this.productoSeleccionado = event.option.value;
  }

  agregarProductoParaVenta() {
    const _cantidad: number = this.formularioProductoVenta.value.cantidad;
    const _precio: number = parseFloat(this.productoSeleccionado.precioText);
    const _total: number = _cantidad * _precio;
    this.totalPagar = this.totalPagar + _total;

    this.listaProductosParaVenta.push({
      idProducto: this.productoSeleccionado.idProducto,
      productoDescription: this.productoSeleccionado.nombre,
      cantidad: _cantidad,
      precioTexto: String(_precio.toFixed(2)),
      totalTexto: String(_total.toFixed(2))
    });

    this.datosDetalleVenta = new MatTableDataSource(this.listaProductosParaVenta);

    this.formularioProductoVenta.patchValue({
      producto: '',
      cantidad: ''
    });
  }

  eliminarProducto(detalle: DetalleVenta) {
    this.totalPagar = this.totalPagar - parseFloat(detalle.totalTexto);
    this.listaProductosParaVenta = this.listaProductosParaVenta.filter(p => p.idProducto != detalle.idProducto);

    this.datosDetalleVenta = new MatTableDataSource(this.listaProductosParaVenta);
  }

  registrarVenta() {
    if (this.listaProductosParaVenta.length > 0) {
      this.bloquearBotonRegistrar = true;

      const request: Venta = {
        tipoPago: this.tipoPagoPorDefecto,
        totalTexto: String(this.totalPagar.toFixed(2)),
        DetalleVenta: this.listaProductosParaVenta
      };

      this._ventaService.Guardar(request).subscribe({
        next: (data) => {
          if (data.status) {
            this.totalPagar = 0.00;
            this.listaProductosParaVenta = [];
            this.datosDetalleVenta = new MatTableDataSource(this.listaProductosParaVenta);

            Swal.fire({
              icon: 'success',
              title: 'Venta registrada',
              text: `Número de venta: ${data.value.numeroDocumento}`
            })
          } else {
            this._utilidadService.MostrarAlerta("No se pudo realizar la venta", "Oops!");
          }
        },
        complete: () => {
          this.bloquearBotonRegistrar = false;
        },
        error: (e) => { }
      });
    }
  }
}
