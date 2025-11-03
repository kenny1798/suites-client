import React, { useEffect, useState } from 'react';
import { apiAuth } from '@suite/api-clients';
import { useNavigate } from 'react-router-dom';

export default function ProfilePage() {
  const [form, setForm] = useState({ name: '', email: '', phoneNumber: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await apiAuth.get('/profile/me');
        setForm({
          name: data.name || '',
          email: data.email || '',
          phoneNumber: data.phoneNumber || '',
        });
      } catch (err) {
        console.log('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiAuth.put('/profile/update', {
        name: form.name,
        phoneNumber: form.phoneNumber,
      });
      console.log('Profile updated successfully');
      // ✅ Redirect ke homepage (root)
      setTimeout(() => navigate('/'), 800);
    } catch (err) {
      console.log(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return <div className="p-6 text-center text-slate-500">Loading profile...</div>;

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-semibold text-slate-800 mb-6">Edit Profile</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-slate-600 mb-1">Name</label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            className="w-full border rounded-md px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm text-slate-600 mb-1">Email</label>
          <input
            type="email"
            name="email"
            value={form.email}
            disabled
            className="w-full border rounded-md px-3 py-2 bg-slate-100 cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block text-sm text-slate-600 mb-1">Phone Number</label>
          <input
            type="text"
            name="phoneNumber"
            value={form.phoneNumber || ''}
            onChange={handleChange}
            className="w-full border rounded-md px-3 py-2"
            placeholder="+60 12 345 6789"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="mt-4 w-full bg-indigo-600 text-white font-semibold py-2 rounded-md hover:bg-indigo-700 disabled:bg-slate-400"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}
