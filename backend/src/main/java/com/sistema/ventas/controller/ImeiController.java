package com.sistema.ventas.controller;

import com.sistema.ventas.dto.ImeiRequest;
import com.sistema.ventas.model.Imei;
import com.sistema.ventas.service.ImeiService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/imeis")
@CrossOrigin(origins = "*")
@Tag(name = "IMEI", description = "API para gestión de IMEIs")
public class ImeiController {
    public ImeiController(ImeiService imeiService) {
        this.imeiService = imeiService;
    }


    private final ImeiService imeiService;

    @GetMapping
    @Operation(summary = "Listar todos los IMEIs registrados")
    public ResponseEntity<List<Imei>> findAll() {
        return ResponseEntity.ok(imeiService.findAll());
    }

    @PostMapping
    @Operation(summary = "Registrar nuevo IMEI")
    public ResponseEntity<Imei> registrar(@RequestBody ImeiRequest request) {
        return ResponseEntity.ok(imeiService.registrar(request));
    }

    @GetMapping("/{imei}")
    @Operation(summary = "Buscar detalles de un IMEI específico")
    public ResponseEntity<Imei> findByImei(@PathVariable String imei) {
        return ResponseEntity.ok(imeiService.findByImei(imei));
    }

    @PutMapping("/{id}/estado")
    @Operation(summary = "Cambiar estado del IMEI (DISPONIBLE/VENDIDO)")
    public ResponseEntity<Imei> cambiarEstado(@PathVariable Long id, @RequestParam String estado) {
        return ResponseEntity.ok(imeiService.cambiarEstado(id, estado));
    }
}
