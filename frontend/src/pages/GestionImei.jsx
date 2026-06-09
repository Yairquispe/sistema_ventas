import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axios';
import toast from 'react-hot-toast';
import './GestionImei.css';

const GestionImei = () => {
    const [imeis, setImeis] = useState([]);
    const [productos, setProductos] = useState([]);
    const [formData, setFormData] = useState({
        imei: '',
        productoId: ''
    });
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState('TODOS');

    useEffect(() => {
        fetchImeis();
        fetchProductos();
    }, []);

    const fetchImeis = async () => {
        try {
            const res = await axiosInstance.get('/api/imeis');
            setImeis(res.data);
        } catch (error) {
            toast.error('Error al cargar IMEIs');
        }
    };

    const fetchProductos = async () => {
        try {
            const res = await axiosInstance.get('/api/productos');
            setProductos(res.data);
        } catch (error) {
            toast.error('Error al cargar productos');
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        // Validación para solo números y máximo 15 dígitos en el IMEI
        if (name === 'imei') {
            const val = value.replace(/\D/g, '').slice(0, 15);
            setFormData({ ...formData, [name]: val });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (formData.imei.length !== 15) {
            toast.error('El IMEI debe tener exactamente 15 dígitos');
            return;
        }

        if (!formData.productoId) {
            toast.error('Debe seleccionar un producto');
            return;
        }

        setLoading(true);
        try {
            await axiosInstance.post('/api/imeis', formData);
            toast.success('IMEI registrado correctamente');
            setFormData({ imei: '', productoId: '' });
            fetchImeis();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error al registrar IMEI');
        } finally {
            setLoading(false);
        }
    };

    const filteredImeis = imeis.filter(i => filter === 'TODOS' ? true : i.estado === filter);

    return (
        <div className="page-container imei-page">
            <h2>Gestión de IMEI</h2>
            
            <div className="imei-grid">
                <div className="imei-form-section card">
                    <h3>Registrar Nuevo IMEI</h3>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Código IMEI (15 dígitos)</label>
                            <input 
                                type="text" 
                                name="imei" 
                                value={formData.imei} 
                                onChange={handleInputChange}
                                placeholder="Ej: 351234567890123"
                                required
                            />
                            <small className={formData.imei.length === 15 ? 'valid' : ''}>
                                {formData.imei.length}/15 caracteres
                            </small>
                        </div>
                        
                        <div className="form-group">
                            <label>Producto Asociado</label>
                            <select 
                                name="productoId" 
                                value={formData.productoId} 
                                onChange={handleInputChange}
                                required
                            >
                                <option value="">Seleccione un producto...</option>
                                {productos.map(p => (
                                    <option key={p.id} value={p.id}>{p.marca} {p.modelo}</option>
                                ))}
                            </select>
                        </div>

                        <button type="submit" className="btn-primary w-100" disabled={loading}>
                            {loading ? 'Registrando...' : 'Registrar IMEI'}
                        </button>
                    </form>
                </div>

                <div className="imei-list-section card">
                    <div className="list-header">
                        <h3>IMEIs Registrados</h3>
                        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
                            <option value="TODOS">Todos</option>
                            <option value="DISPONIBLE">Disponibles</option>
                            <option value="VENDIDO">Vendidos</option>
                        </select>
                    </div>

                    <div className="table-responsive">
                        <table className="modern-table">
                            <thead>
                                <tr>
                                    <th>IMEI</th>
                                    <th>Producto</th>
                                    <th>Fecha Registro</th>
                                    <th>Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredImeis.map(imei => (
                                    <tr key={imei.id}>
                                        <td className="imei-code">{imei.imei}</td>
                                        <td>{imei.producto?.marca} {imei.producto?.modelo}</td>
                                        <td>{new Date(imei.fechaRegistro).toLocaleDateString()}</td>
                                        <td>
                                            <span className={`badge ${imei.estado === 'DISPONIBLE' ? 'green' : 'red'}`}>
                                                {imei.estado}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {filteredImeis.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="text-center">No hay IMEIs registrados</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GestionImei;
