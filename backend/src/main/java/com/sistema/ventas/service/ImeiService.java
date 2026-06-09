package com.sistema.ventas.service;

import com.sistema.ventas.dto.ImeiRequest;
import com.sistema.ventas.model.Imei;
import com.sistema.ventas.model.Producto;
import com.sistema.ventas.repository.ImeiRepository;
import com.sistema.ventas.repository.ProductoRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ImeiService {
    public ImeiService(ImeiRepository imeiRepository, ProductoRepository productoRepository) {
        this.imeiRepository = imeiRepository;
        this.productoRepository = productoRepository;
    }


    private final ImeiRepository imeiRepository;
    private final ProductoRepository productoRepository;

    public List<Imei> findAll() {
        return imeiRepository.findAll();
    }

    public Imei registrar(ImeiRequest request) {
        // Validate IMEI is exactly 15 digits
        if (request.getImei() == null || !request.getImei().matches("\\d{15}")) {
            throw new RuntimeException("El IMEI debe tener exactamente 15 dígitos numéricos");
        }

        // Check if IMEI already exists
        if (imeiRepository.findByImei(request.getImei()).isPresent()) {
            throw new RuntimeException("El IMEI ya está registrado: " + request.getImei());
        }

        Producto producto = productoRepository.findById(request.getProductoId())
                .orElseThrow(() -> new RuntimeException("Producto no encontrado con id: " + request.getProductoId()));

        Imei imei = new Imei();
        imei.setImei(request.getImei());
        imei.setProducto(producto);
        imei.setEstado("DISPONIBLE");
        imei.setFechaRegistro(LocalDateTime.now());

        return imeiRepository.save(imei);
    }

    public Imei findByImei(String imei) {
        return imeiRepository.findByImei(imei)
                .orElseThrow(() -> new RuntimeException("IMEI no encontrado: " + imei));
    }

    public Imei cambiarEstado(Long id, String estado) {
        Imei imei = imeiRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("IMEI no encontrado con id: " + id));

        if (!"DISPONIBLE".equals(estado) && !"VENDIDO".equals(estado)) {
            throw new RuntimeException("Estado no válido. Use DISPONIBLE o VENDIDO");
        }

        imei.setEstado(estado);
        return imeiRepository.save(imei);
    }
}
