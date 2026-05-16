import { useState, useEffect } from 'react';
import { Button, Card, Input, Select } from '../components/ui';
import { getSettings, saveSettings } from '../data/manager';

export function Settings() {
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    businessName: 'TAP KLASS',
    businessAddress: '',
    businessPhone: '',
    currency: 'JMD',
    taxRate: 0,
  });

  useEffect(() => {
    let mounted = true;
    setRefreshing(true);
    getSettings()
      .then((data) => {
        if (!mounted) return;
        if (data && Object.keys(data).length > 0) {
          setFormData({
            businessName: data.businessName || 'TAP KLASS',
            businessAddress: data.businessAddress || '',
            businessPhone: data.businessPhone || '',
            currency: data.currency || 'JMD',
            taxRate: data.taxRate || 0,
          });
        }
      })
      .catch((error) => console.warn('Failed to load settings', error))
      .finally(() => { if (mounted) setRefreshing(false); });
    return () => { mounted = false; };
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveSettings(formData);
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Failed to save settings', error);
      alert('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6 page-content">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Settings</h1>
          <p className="mt-1 text-zinc-500">Manage your cloud-synced business preferences</p>
        </div>
        {refreshing && (
          <span className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs text-violet-200">
            <span className="h-2 w-2 animate-pulse rounded-full bg-violet-400" />
            Syncing
          </span>
        )}
      </div>

      <Card>
        <h2 className="mb-6 text-lg font-semibold text-white">Business Information</h2>
        <div className="space-y-4">
          <Input label="Business Name" value={formData.businessName} onChange={(e) => setFormData({ ...formData, businessName: e.target.value })} placeholder="Your business name" />
          <Input label="Business Address" value={formData.businessAddress} onChange={(e) => setFormData({ ...formData, businessAddress: e.target.value })} placeholder="Business address" />
          <Input label="Business Phone" value={formData.businessPhone} onChange={(e) => setFormData({ ...formData, businessPhone: e.target.value })} placeholder="Phone number" />
        </div>
      </Card>

      <Card>
        <h2 className="mb-6 text-lg font-semibold text-white">Financial Settings</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Select
            label="Currency"
            options={[
              { value: 'JMD', label: 'Jamaican Dollar (JMD)' },
              { value: 'USD', label: 'US Dollar (USD)' },
            ]}
            value={formData.currency}
            onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
          />
          <Input
            label="Default Tax Rate (%)"
            type="number"
            step="0.01"
            min="0"
            value={formData.taxRate}
            onChange={(e) => setFormData({ ...formData, taxRate: parseFloat(e.target.value) || 0 })}
          />
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 text-lg font-semibold text-white">Cloud Sync</h2>
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
          <p className="text-sm font-medium text-emerald-300">Connected to live backend</p>
          <p className="mt-1 text-xs text-zinc-400">All settings and module data are stored in the cloud database and remain available across devices.</p>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} isLoading={saving}>Save Settings</Button>
      </div>
    </div>
  );
}
