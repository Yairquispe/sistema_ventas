import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './Ventas.css';

const Ventas = () => {
    const { user } = useAuth();
    const [productos, setProductos] = useState([]);
    const [carrito, setCarrito] = useState([]);
    const [metodoPago, setMetodoPago] = useState('CONTADO');
    const [descuento, setDescuento] = useState(0);
    const [interes, setInteres] = useState(0);
    const [cuotas, setCuotas] = useState(3);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchProductos();
    }, []);

    const fetchProductos = async () => {
        try {
            const res = await axiosInstance.get('/api/productos');
            setProductos(res.data.filter(p => p.stock > 0)); // Solo mostrar con stock
        } catch (error) {
            toast.error('Error al cargar productos');
        }
    };

    const addToCart = (producto) => {
        const exist = carrito.find(item => item.productoId === producto.id);
        if (exist) {
            if (exist.cantidad >= producto.stock) {
                toast.error('No hay suficiente stock');
                return;
            }
            setCarrito(carrito.map(item => 
                item.productoId === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item
            ));
        } else {
            setCarrito([...carrito, { 
                productoId: producto.id, 
                modelo: producto.modelo, 
                marca: producto.marca,
                precio: producto.precio,
                cantidad: 1,
                maxStock: producto.stock
            }]);
        }
    };

    const updateQuantity = (id, delta) => {
        setCarrito(carrito.map(item => {
            if (item.productoId === id) {
                const newQty = item.cantidad + delta;
                if (newQty > 0 && newQty <= item.maxStock) {
                    return { ...item, cantidad: newQty };
                }
            }
            return item;
        }));
    };

    const removeFromCart = (id) => {
        setCarrito(carrito.filter(item => item.productoId !== id));
    };

    const calcularSubtotal = () => {
        return carrito.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);
    };

    const calcularTotal = () => {
        const sub = calcularSubtotal();
        if (metodoPago === 'CONTADO') {
            return sub * (1 - (descuento / 100));
        } else {
            return sub * (1 + (interes / 100));
        }
    };

    const handleConfirmarVenta = async () => {
        if (carrito.length === 0) return toast.error('El carrito está vacío');
        setLoading(true);
        try {
            const request = {
                vendedorId: user?.id || 2, // Default to 2 if not found in context correctly
                metodoPago: metodoPago,
                descuentoPorcentaje: metodoPago === 'CONTADO' ? descuento : 0,
                interesPorcentaje: metodoPago === 'CUOTAS' ? interes : 0,
                numeroCuotas: metodoPago === 'CUOTAS' ? cuotas : 0,
                items: carrito.map(item => ({
                    productoId: item.productoId,
                    cantidad: item.cantidad
                }))
            };

            await axiosInstance.post('/api/ventas', request);
            toast.success('Venta registrada exitosamente');
            setCarrito([]);
            setDescuento(0);
            setInteres(0);
            fetchProductos();
        } catch (error) {
            toast.error('Error al registrar la venta');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-container ventas-page">
            <div className="ventas-grid">
                <div className="productos-section card">
                    <h2>Módulo de Ventas - Productos Disponibles</h2>
                    <div className="productos-list">
                        {productos.map(p => (
                            <div key={p.id} className="producto-card">
                                <div className="producto-img">
                                    {p.fotoUrl ? 
                                        <img src={`http://localhost:8080/api/productos/${p.id}/foto`} alt={p.modelo} /> :
                                        <div className="img-placeholder">Sin Foto</div>
                                    }
                                </div>
                                <div className="producto-info">
                                    <h3>{p.modelo} <span className="marca-badge">{p.marca}</span></h3>
                                    <div className="precio-stock">
                                        <span className="precio">${p.precio}</span>
                                        <span className={`stock-text ${p.stock < 5 ? 'low' : ''}`}>Stock: {p.stock}</span>
                                    </div>
                                    <button className="btn-primary" onClick={() => addToCart(p)}>+ Agregar</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="carrito-section card">
                    <h2><span role="img" aria-label="cart">🛒</span> Carrito de Compras</h2>
                    
                    {carrito.length === 0 ? (
                        <div className="empty-cart">Carrito vacío</div>
                    ) : (
                        <div className="carrito-items">
                            {carrito.map(item => (
                                <div key={item.productoId} className="cart-item">
                                    <div className="item-details">
                                        <h4>{item.modelo}</h4>
                                        <span>${item.precio}</span>
                                    </div>
                                    <div className="item-actions">
                                        <button onClick={() => updateQuantity(item.productoId, -1)}>-</button>
                                        <span>{item.cantidad}</span>
                                        <button onClick={() => updateQuantity(item.productoId, 1)}>+</button>
                                        <button className="remove-btn" onClick={() => removeFromCart(item.productoId)}>✖</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="pago-section">
                        <h3>Método de Pago</h3>
                        <div className="radio-group">
                            <label>
                                <input type="radio" name="pago" checked={metodoPago === 'CONTADO'} onChange={() => setMetodoPago('CONTADO')} /> Contado
                            </label>
                            <label>
                                <input type="radio" name="pago" checked={metodoPago === 'CUOTAS'} onChange={() => setMetodoPago('CUOTAS')} /> Cuotas
                            </label>
                        </div>

                        {metodoPago === 'CONTADO' ? (
                            <div className="form-group">
                                <label>Descuento (%)</label>
                                <input type="number" min="0" max="100" value={descuento} onChange={(e) => setDescuento(e.target.value)} />
                            </div>
                        ) : (
                            <div className="cuotas-config">
                                <div className="form-group">
                                    <label>Interés (%)</label>
                                    <input type="number" min="0" value={interes} onChange={(e) => setInteres(e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label>Nº Cuotas</label>
                                    <select value={cuotas} onChange={(e) => setCuotas(e.target.value)}>
                                        <option value="3">3 cuotas</option>
                                        <option value="6">6 cuotas</option>
                                        <option value="9">9 cuotas</option>
                                        <option value="12">12 cuotas</option>
                                        <option value="24">24 cuotas</option>
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="resumen-section">
                        <div className="resumen-row">
                            <span>Subtotal:</span>
                            <span>${calcularSubtotal().toFixed(2)}</span>
                        </div>
                        {metodoPago === 'CONTADO' && descuento > 0 && (
                            <div className="resumen-row discount">
                                <span>Descuento ({descuento}%):</span>
                                <span>-${(calcularSubtotal() * (descuento/100)).toFixed(2)}</span>
                            </div>
                        )}
                        {metodoPago === 'CUOTAS' && interes > 0 && (
                            <div className="resumen-row interest">
                                <span>Interés ({interes}%):</span>
                                <span>+${(calcularSubtotal() * (interes/100)).toFixed(2)}</span>
                            </div>
                        )}
                        <div className="resumen-row total">
                            <span>Total Final:</span>
                            <span>${calcularTotal().toFixed(2)}</span>
                        </div>
                        {metodoPago === 'CUOTAS' && (
                            <div className="resumen-row cuota-monto">
                                <span>Monto por cuota:</span>
                                <span>${(calcularTotal() / cuotas).toFixed(2)}</span>
                            </div>
                        )}
                    </div>

                    <div className="cart-buttons">
                        <button className="btn-danger" onClick={() => setCarrito([])} disabled={carrito.length === 0}>Vaciar Carrito</button>
                        <button className="btn-success" onClick={handleConfirmarVenta} disabled={carrito.length === 0 || loading}>
                            {loading ? 'Procesando...' : 'Confirmar Venta'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Ventas;
