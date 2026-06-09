import { useState, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import './Inventario.css';

const MARCAS = ['Samsung', 'Apple', 'Xiaomi', 'Huawei', 'Motorola', 'OPPO', 'Realme', 'Otro'];

function Inventario() {
  const [productos, setProductos] = useState([]);
  const [filteredProductos, setFilteredProductos] = useState([]);
  const [search, setSearch] = useState('');
  const [filterMarca, setFilterMarca] = useState('Todas');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [stockProduct, setStockProduct] = useState(null);
  const [stockAmount, setStockAmount] = useState(1);
  const [stockAction, setStockAction] = useState('add');
  const [formData, setFormData] = useState({
    modelo: '',
    marca: 'Samsung',
    precio: '',
    stock: '',
    imei: '',
  });
  const [fotoFile, setFotoFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchProductos();
  }, []);

  useEffect(() => {
    let filtered = productos;
    if (search.trim()) {
      const s = search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          (p.modelo && p.modelo.toLowerCase().includes(s)) ||
          (p.marca && p.marca.toLowerCase().includes(s)) ||
          (p.imei && p.imei.includes(s))
      );
    }
    if (filterMarca !== 'Todas') {
      filtered = filtered.filter((p) => p.marca === filterMarca);
    }
    setFilteredProductos(filtered);
  }, [search, filterMarca, productos]);

  const fetchProductos = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/productos');
      setProductos(res.data);
    } catch (err) {
      toast.error('Error al cargar productos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormData({ modelo: '', marca: 'Samsung', precio: '', stock: '', imei: '' });
    setFotoFile(null);
    setShowModal(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      modelo: product.modelo || '',
      marca: product.marca || 'Samsung',
      precio: product.precio || '',
      stock: product.stock || 0,
      imei: product.imei || '',
    });
    setFotoFile(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProduct(null);
  };

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.modelo.trim() || !formData.precio) {
      toast.error('Modelo y precio son requeridos');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        modelo: formData.modelo.trim(),
        marca: formData.marca,
        precio: parseFloat(formData.precio),
        stock: parseInt(formData.stock) || 0,
        imei: formData.imei.trim() || null,
      };

      let productId;
      if (editingProduct) {
        await api.put(`/api/productos/${editingProduct.id}`, payload);
        productId = editingProduct.id;
        toast.success('Producto actualizado');
      } else {
        const res = await api.post('/api/productos', payload);
        productId = res.data.id || res.data;
        toast.success('Producto creado');
      }

      if (fotoFile && productId) {
        const fd = new FormData();
        fd.append('foto', fotoFile);
        try {
          await api.post(`/api/productos/${productId}/foto`, fd, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        } catch {
          toast.error('Producto guardado, pero error al subir foto');
        }
      }

      closeModal();
      fetchProductos();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al guardar producto');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (product) => {
    if (!window.confirm(`¿Eliminar "${product.modelo}"?`)) return;
    try {
      await api.delete(`/api/productos/${product.id}`);
      toast.success('Producto eliminado');
      fetchProductos();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al eliminar');
    }
  };

  const openStockModal = (product) => {
    setStockProduct(product);
    setStockAmount(1);
    setStockAction('add');
    setShowStockModal(true);
  };

  const handleStockUpdate = async () => {
    if (!stockProduct || stockAmount <= 0) return;
    try {
      const newStock =
        stockAction === 'add'
          ? stockProduct.stock + stockAmount
          : Math.max(0, stockProduct.stock - stockAmount);

      await api.put(`/api/productos/${stockProduct.id}/stock`, { stock: newStock });
      toast.success('Stock actualizado');
      setShowStockModal(false);
      fetchProductos();
    } catch (err) {
      toast.error('Error al actualizar stock');
    }
  };

  const getStockClass = (stock) => {
    if (stock === 0) return 'stock-red';
    if (stock < 5) return 'stock-yellow';
    return 'stock-green';
  };

  const getProductImage = (product) => {
    return `http://localhost:8080/api/productos/${product.id}/foto`;
  };

  const handleImageError = (e) => {
    e.target.src = 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60"><rect fill="#f0f0f0" width="60" height="60" rx="8"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" font-family="sans-serif" font-size="24" fill="#ccc">📱</text></svg>`);
  };

  return (
    <div className="inventario-page">
      <div className="inventario-header">
        <div>
          <h1 className="inventario-title">Dashboard del Inventario</h1>
          <p className="inventario-subtitle">Gestiona tus productos y stock</p>
        </div>
        <button className="btn-primary" onClick={openCreateModal}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Nuevo Producto
        </button>
      </div>

      <div className="inventario-filters">
        <div className="search-box">
          <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por modelo, marca o IMEI..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
        </div>
        <select
          value={filterMarca}
          onChange={(e) => setFilterMarca(e.target.value)}
          className="filter-select"
        >
          <option value="Todas">Todas las marcas</option>
          {MARCAS.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Cargando productos...</p>
        </div>
      ) : filteredProductos.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">📦</span>
          <h3>No hay productos</h3>
          <p>{search || filterMarca !== 'Todas' ? 'No se encontraron resultados con los filtros aplicados' : 'Agrega tu primer producto'}</p>
        </div>
      ) : (
        <div className="inventario-table-wrapper">
          <table className="inventario-table">
            <thead>
              <tr>
                <th>Foto</th>
                <th>Modelo</th>
                <th>Marca</th>
                <th>Stock</th>
                <th>Precio</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredProductos.map((p) => (
                <tr key={p.id}>
                  <td>
                    <img
                      src={getProductImage(p)}
                      alt={p.modelo}
                      className="product-thumb"
                      onError={handleImageError}
                    />
                  </td>
                  <td className="td-modelo">{p.modelo}</td>
                  <td>{p.marca}</td>
                  <td>
                    <span className={`stock-badge ${getStockClass(p.stock)}`}>{p.stock}</span>
                  </td>
                  <td className="td-precio">${Number(p.precio).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                  <td>
                    <span className={`estado-badge ${p.stock > 0 ? 'disponible' : 'agotado'}`}>
                      {p.stock > 0 ? 'DISPONIBLE' : 'AGOTADO'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-icon btn-edit" title="Editar" onClick={() => openEditModal(p)}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button className="btn-icon btn-delete" title="Eliminar" onClick={() => handleDelete(p)}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                      <button className="btn-icon btn-stock" title="Modificar Stock" onClick={() => openStockModal(p)}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</h2>
              <button className="modal-close" onClick={closeModal}>&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>Modelo *</label>
                <input type="text" name="modelo" value={formData.modelo} onChange={handleFormChange} placeholder="Ej: Galaxy S24 Ultra" required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Marca *</label>
                  <select name="marca" value={formData.marca} onChange={handleFormChange}>
                    {MARCAS.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Precio *</label>
                  <input type="number" name="precio" value={formData.precio} onChange={handleFormChange} placeholder="0.00" step="0.01" min="0" required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Stock</label>
                  <input type="number" name="stock" value={formData.stock} onChange={handleFormChange} placeholder="0" min="0" />
                </div>
                <div className="form-group">
                  <label>IMEI (opcional)</label>
                  <input type="text" name="imei" value={formData.imei} onChange={handleFormChange} placeholder="15 dígitos" maxLength={15} />
                </div>
              </div>
              <div className="form-group">
                <label>Foto</label>
                <input type="file" accept="image/*" onChange={(e) => setFotoFile(e.target.files[0])} className="file-input" />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={closeModal}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showStockModal && stockProduct && (
        <div className="modal-overlay" onClick={() => setShowStockModal(false)}>
          <div className="modal-content modal-small" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Modificar Stock</h2>
              <button className="modal-close" onClick={() => setShowStockModal(false)}>&times;</button>
            </div>
            <div className="stock-modal-body">
              <p className="stock-modal-product">{stockProduct.modelo}</p>
              <p className="stock-modal-current">Stock actual: <strong>{stockProduct.stock}</strong></p>

              <div className="stock-action-selector">
                <label className={`stock-action-option ${stockAction === 'add' ? 'selected' : ''}`}>
                  <input type="radio" name="stockAction" value="add" checked={stockAction === 'add'} onChange={(e) => setStockAction(e.target.value)} />
                  ➕ Agregar
                </label>
                <label className={`stock-action-option ${stockAction === 'subtract' ? 'selected' : ''}`}>
                  <input type="radio" name="stockAction" value="subtract" checked={stockAction === 'subtract'} onChange={(e) => setStockAction(e.target.value)} />
                  ➖ Restar
                </label>
              </div>

              <div className="form-group">
                <label>Cantidad</label>
                <input type="number" value={stockAmount} onChange={(e) => setStockAmount(parseInt(e.target.value) || 0)} min="1" />
              </div>

              <p className="stock-modal-result">
                Nuevo stock: <strong>{stockAction === 'add' ? stockProduct.stock + stockAmount : Math.max(0, stockProduct.stock - stockAmount)}</strong>
              </p>

              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setShowStockModal(false)}>Cancelar</button>
                <button className="btn-primary" onClick={handleStockUpdate}>Actualizar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Inventario;
