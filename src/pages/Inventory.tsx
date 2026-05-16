import { useState, useEffect, useMemo } from 'react';
import { Button, Card, Input, Modal, Select, Badge, EmptyState } from '../components/ui';
import { getInventory, addInventoryItem, updateInventoryItem, deleteInventoryItem } from '../data/manager';
import type { InventoryItem } from '../types';
import { formatCurrency } from '../utils/format';

export function Inventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: '',
    quantity: 0,
    price: 0,
    cost: 0,
    status: 'in-stock' as 'in-stock' | 'low-stock' | 'out-of-stock',
  });

  useEffect(() => {
    let mounted = true;
    setRefreshing(true);
    getInventory()
      .then((data) => { if (mounted) setItems(data); })
      .catch((error) => console.warn('Failed to load inventory', error))
      .finally(() => { if (mounted) setRefreshing(false); });
    return () => { mounted = false; };
  }, []);

  const categories = useMemo(() => {
    const cats = new Set(items.map(i => i.category));
    return ['all', ...Array.from(cats)];
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
      return matchesSearch && matchesCategory;
    });
  }, [items, searchQuery, filterCategory]);

  const handleOpenModal = (item?: InventoryItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        sku: item.sku,
        category: item.category,
        quantity: item.quantity,
        price: item.price,
        cost: item.cost,
        status: item.status,
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        sku: '',
        category: '',
        quantity: 0,
        price: 0,
        cost: 0,
        status: 'in-stock',
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      if (editingItem) {
        const updated = await updateInventoryItem(editingItem.id, {
          ...formData,
          lastUpdated: new Date().toISOString(),
        });
        if (updated) {
          setItems(items.map(i => i.id === updated.id ? updated : i));
        }
      } else {
        const newItem = await addInventoryItem({
          ...formData,
          lastUpdated: new Date().toISOString(),
        });
        setItems([...items, newItem]);
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error('Failed to save item', error);
      alert('Failed to save item. Please check your connection.');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await deleteInventoryItem(id);
        setItems(items.filter(i => i.id !== id));
      } catch (error) {
        console.error('Failed to delete item', error);
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in-stock':
        return <Badge variant="success">In Stock</Badge>;
      case 'low-stock':
        return <Badge variant="warning">Low Stock</Badge>;
      case 'out-of-stock':
        return <Badge variant="danger">Out of Stock</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 page-content">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Inventory</h1>
            <p className="text-zinc-500 mt-1">Manage your products and stock</p>
          </div>
          {refreshing && (
            <span className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs text-violet-200">
              <span className="h-2 w-2 animate-pulse rounded-full bg-violet-400" />
              Syncing
            </span>
          )}
        </div>
        <Button onClick={() => handleOpenModal()}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Item
        </Button>
      </div>

      <Card className="!p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              }
            />
          </div>
          <div className="w-full sm:w-48">
            <Select
              options={categories.map(c => ({ value: c, label: c === 'all' ? 'All Categories' : c }))}
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {items.length === 0 ? (
        <EmptyState
          title="No inventory items"
          description="Add your first item to start tracking stock."
          action={<Button onClick={() => handleOpenModal()}>Add Item</Button>}
        />
      ) : (
        <Card className="!p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Item</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">SKU</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Category</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Quantity</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Price</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Status</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4"><p className="text-sm font-medium text-white">{item.name}</p></td>
                    <td className="px-6 py-4"><span className="text-sm text-zinc-400 font-mono">{item.sku}</span></td>
                    <td className="px-6 py-4"><span className="text-sm text-zinc-400">{item.category}</span></td>
                    <td className="px-6 py-4">
                      <span className={`text-sm font-medium ${item.status === 'out-of-stock' ? 'text-rose-400' : item.status === 'low-stock' ? 'text-amber-400' : 'text-zinc-300'}`}>
                        {item.quantity}
                      </span>
                    </td>
                    <td className="px-6 py-4"><span className="text-sm text-white font-medium">{formatCurrency(item.price)}</span></td>
                    <td className="px-6 py-4">{getStatusBadge(item.status)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleOpenModal(item)} className="p-2 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button onClick={() => handleDelete(item.id)} className="p-2 rounded-lg hover:bg-rose-500/10 text-zinc-400 hover:text-rose-400 transition-colors">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingItem ? 'Edit Item' : 'Add New Item'}>
        <div className="space-y-4">
          <Input label="Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Product name" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="SKU" value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} placeholder="SKU-001" />
            <Input label="Category" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} placeholder="Category" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Quantity" type="number" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })} />
            <Select
              label="Status"
              options={[
                { value: 'in-stock', label: 'In Stock' },
                { value: 'low-stock', label: 'Low Stock' },
                { value: 'out-of-stock', label: 'Out of Stock' },
              ]}
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Price" type="number" step="0.01" value={formData.price} onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })} />
            <Input label="Cost" type="number" step="0.01" value={formData.cost} onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })} />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>{editingItem ? 'Save Changes' : 'Add Item'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}