import React, { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import axiosInstance from '../api/axios';
import toast from 'react-hot-toast';
import './EscanerQR.css';
import { useNavigate } from 'react-router-dom';

const EscanerQR = () => {
    const [scanResult, setScanResult] = useState(null);
    const [producto, setProducto] = useState(null);
    const [manualImei, setManualImei] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        let scanner = new Html5QrcodeScanner(
            "reader",
            { fps: 10, qrbox: { width: 250, height: 250 } },
            false
        );

        scanner.render(onScanSuccess, onScanFailure);

        function onScanSuccess(decodedText) {
            setScanResult(decodedText);
            buscarProducto(decodedText);
            scanner.clear(); // Detener escáner tras lectura
        }

        function onScanFailure(error) {
            // Ignorar errores de no encontrar QR
        }

        return () => {
            scanner.clear().catch(error => console.error("Failed to clear scanner", error));
        };
    }, []);

    const buscarProducto = async (codigo) => {
        try {
            // Primero intentamos buscar si es un IMEI
            if (codigo.length === 15 && !isNaN(codigo)) {
                const resImei = await axiosInstance.get(`/api/imeis/${codigo}`);
                if (resImei.data) {
                    setProducto(resImei.data.producto);
                    toast.success('Producto encontrado por IMEI');
                    return;
                }
            }
            
            // Si no es IMEI, asumimos que es el ID del producto
            const resProd = await axiosInstance.get(`/api/productos/${codigo}`);
            if (resProd.data) {
                setProducto(resProd.data);
                toast.success('Producto encontrado');
            }
        } catch (error) {
            toast.error('Producto no encontrado');
            setProducto(null);
        }
    };

    const handleManualSubmit = (e) => {
        e.preventDefault();
        if (manualImei) {
            buscarProducto(manualImei);
        }
    };

    const handleAgregarCarrito = () => {
        if (!producto) return;
        if (producto.stock <= 0) {
            toast.error('El producto está agotado');
            return;
        }
        
        // Simular agregar al carrito redirigiendo a ventas o guardando en context
        toast.success('Ve a Ventas para confirmar');
        navigate('/ventas');
    };

    return (
        <div className="page-container qr-page">
            <h2>Escáner de Código QR</h2>
            
            <div className="qr-grid">
                <div className="scanner-section card">
                    <h3>Cámara</h3>
                    <div id="reader" className="qr-reader"></div>
                    
                    <div className="manual-entry">
                        <h4>O ingreso manual (IMEI/ID):</h4>
                        <form onSubmit={handleManualSubmit}>
                            <input 
                                type="text" 
                                placeholder="Ingrese IMEI o ID de producto" 
                                value={manualImei}
                                onChange={(e) => setManualImei(e.target.value)}
                            />
                            <button type="submit" className="btn-primary">Buscar</button>
                        </form>
                    </div>
                </div>

                <div className="result-section card">
                    <h3>Resultado</h3>
                    {!producto ? (
                        <div className="empty-result">
                            <span className="qr-icon">📱</span>
                            <p>Escanee un código QR o ingrese un código manual para ver el producto.</p>
                        </div>
                    ) : (
                        <div className="producto-detalle">
                            <div className="foto-container">
                                {producto.fotoUrl ? 
                                    <img src={`http://localhost:8080/api/productos/${producto.id}/foto`} alt={producto.modelo} /> :
                                    <div className="img-placeholder">Sin Foto</div>
                                }
                            </div>
                            <h2>{producto.modelo}</h2>
                            <p className="marca">{producto.marca}</p>
                            
                            <div className="info-grid">
                                <div className="info-item">
                                    <span>Precio</span>
                                    <strong>${producto.precio.toFixed(2)}</strong>
                                </div>
                                <div className="info-item">
                                    <span>Stock</span>
                                    <strong className={producto.stock < 5 ? 'low' : ''}>{producto.stock} uds</strong>
                                </div>
                                <div className="info-item">
                                    <span>Estado</span>
                                    <span className={`badge ${producto.estado === 'DISPONIBLE' ? 'green' : 'red'}`}>
                                        {producto.estado}
                                    </span>
                                </div>
                            </div>

                            <button className="btn-success w-100" onClick={handleAgregarCarrito}>
                                Ir a Ventas
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EscanerQR;
