package com.sistema.ventas.service;

import com.sistema.ventas.dto.VentaItemRequest;
import com.sistema.ventas.dto.VentaRequest;
import com.sistema.ventas.model.*;
import com.sistema.ventas.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class VentaService {
    public VentaService(VentaRepository ventaRepository, UsuarioRepository usuarioRepository, ProductoRepository productoRepository, ImeiRepository imeiRepository) {
        this.ventaRepository = ventaRepository;
        this.usuarioRepository = usuarioRepository;
        this.productoRepository = productoRepository;
        this.imeiRepository = imeiRepository;
    }


    private final VentaRepository ventaRepository;
    private final UsuarioRepository usuarioRepository;
    private final ProductoRepository productoRepository;
    private final ImeiRepository imeiRepository;

    @Transactional
    public Venta registrarVenta(VentaRequest request) {
        Usuario vendedor = usuarioRepository.findById(request.getVendedorId())
                .orElseThrow(() -> new RuntimeException("Vendedor no encontrado"));

        Venta venta = new Venta();
        venta.setVendedor(vendedor);
        venta.setMetodoPago(request.getMetodoPago());
        venta.setFecha(LocalDateTime.now());

        BigDecimal descuentoPorcentaje = request.getDescuentoPorcentaje() != null
                ? request.getDescuentoPorcentaje() : BigDecimal.ZERO;
        BigDecimal interesPorcentaje = request.getInteresPorcentaje() != null
                ? request.getInteresPorcentaje() : BigDecimal.ZERO;
        Integer numeroCuotas = request.getNumeroCuotas() != null
                ? request.getNumeroCuotas() : 0;

        venta.setDescuentoPorcentaje(descuentoPorcentaje);
        venta.setInteresPorcentaje(interesPorcentaje);
        venta.setNumeroCuotas(numeroCuotas);

        // Calculate subtotal from items
        BigDecimal subtotal = BigDecimal.ZERO;
        List<DetalleVenta> detalles = new ArrayList<>();

        for (VentaItemRequest item : request.getItems()) {
            Producto producto = productoRepository.findById(item.getProductoId())
                    .orElseThrow(() -> new RuntimeException("Producto no encontrado: " + item.getProductoId()));

            if (producto.getStock() < item.getCantidad()) {
                throw new RuntimeException("Stock insuficiente para " + producto.getModelo()
                        + ". Stock disponible: " + producto.getStock());
            }

            DetalleVenta detalle = new DetalleVenta();
            detalle.setVenta(venta);
            detalle.setProducto(producto);
            detalle.setCantidad(item.getCantidad());
            detalle.setPrecioUnitario(producto.getPrecio());

            BigDecimal subtotalItem = producto.getPrecio()
                    .multiply(BigDecimal.valueOf(item.getCantidad()));
            detalle.setSubtotal(subtotalItem);
            subtotal = subtotal.add(subtotalItem);

            detalles.add(detalle);

            // Decrease stock
            producto.setStock(producto.getStock() - item.getCantidad());
            productoRepository.save(producto);

            // Update IMEI status if applicable
            List<Imei> imeisDisponibles = imeiRepository.findByProductoId(producto.getId())
                    .stream()
                    .filter(imei -> "DISPONIBLE".equals(imei.getEstado()))
                    .toList();

            int imeiCount = Math.min(item.getCantidad(), imeisDisponibles.size());
            for (int i = 0; i < imeiCount; i++) {
                Imei imei = imeisDisponibles.get(i);
                imei.setEstado("VENDIDO");
                imeiRepository.save(imei);
            }
        }

        venta.setSubtotal(subtotal);
        venta.setDetalles(detalles);

        // Calculate total based on payment method
        BigDecimal total;
        if ("CONTADO".equals(request.getMetodoPago())) {
            // Apply discount
            BigDecimal descuento = subtotal.multiply(descuentoPorcentaje)
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            total = subtotal.subtract(descuento);
            venta.setMontoCuota(BigDecimal.ZERO);
        } else {
            // CUOTAS - Apply interest
            BigDecimal interes = subtotal.multiply(interesPorcentaje)
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            total = subtotal.add(interes);

            if (numeroCuotas > 0) {
                BigDecimal montoCuota = total.divide(BigDecimal.valueOf(numeroCuotas), 2, RoundingMode.HALF_UP);
                venta.setMontoCuota(montoCuota);
            } else {
                venta.setMontoCuota(total);
            }
        }
        venta.setTotal(total);

        // Save venta (cascades detalles)
        return ventaRepository.save(venta);
    }

    public List<Venta> findAll() {
        return ventaRepository.findAll();
    }

    public Venta findById(Long id) {
        return ventaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Venta no encontrada con id: " + id));
    }
}
