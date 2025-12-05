import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import SidebarLayout from '../components/SidebarLayout';
import {
  Plus,
  Edit2,
  Trash2,
  Tag,
  Calendar,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

const AdminCouponsPage = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    discount_percentage: '',
    valid_from: '',
    valid_until: '',
    usage_limit: '',
    is_active: true
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const response = await apiService.getAllCoupons();
      setCoupons(response?.data?.coupons || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch coupons');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const payload = {
        ...formData,
        discount_percentage: parseFloat(formData.discount_percentage),
        usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
        valid_from: formData.valid_from || null,
        valid_until: formData.valid_until || null
      };

      if (editingCoupon) {
        await apiService.updateCoupon(editingCoupon.id, payload);
      } else {
        await apiService.createCoupon(payload);
      }

      setShowModal(false);
      setEditingCoupon(null);
      resetForm();
      fetchCoupons();
    } catch (err) {
      alert(err.message || 'Failed to save coupon');
    }
  };

  const handleEdit = (coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      discount_percentage: coupon.discount_percentage,
      valid_from: coupon.valid_from ? new Date(coupon.valid_from).toISOString().split('T')[0] : '',
      valid_until: coupon.valid_until ? new Date(coupon.valid_until).toISOString().split('T')[0] : '',
      usage_limit: coupon.usage_limit || '',
      is_active: coupon.is_active
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this coupon?')) return;

    try {
      await apiService.deleteCoupon(id);
      fetchCoupons();
    } catch (err) {
      alert(err.message || 'Failed to delete coupon');
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      discount_percentage: '',
      valid_from: '',
      valid_until: '',
      usage_limit: '',
      is_active: true
    });
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCoupon(null);
    resetForm();
  };

  return (
    <SidebarLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Coupon Management</h1>
            <p className="text-gray-600 text-sm mt-1">Create and manage discount coupons</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Coupon
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          /* Coupons List */
          <div className="grid gap-4">
            {coupons.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <Tag className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No coupons created yet</p>
                <button
                  onClick={() => setShowModal(true)}
                  className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
                >
                  Create your first coupon
                </button>
              </div>
            ) : (
              coupons.map((coupon) => (
                <div
                  key={coupon.id}
                  className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <Tag className="w-5 h-5 text-blue-500" />
                          <h3 className="text-lg font-bold text-gray-800">{coupon.code}</h3>
                        </div>
                        <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-semibold rounded-full">
                          {coupon.discount_percentage}% OFF
                        </span>
                        {coupon.is_active ? (
                          <span className="flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full">
                            <CheckCircle className="w-3 h-3" />
                            Active
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                            <XCircle className="w-3 h-3" />
                            Inactive
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
                        {coupon.valid_from && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <div>
                              <p className="text-xs text-gray-500">Valid From</p>
                              <p className="font-medium">
                                {new Date(coupon.valid_from).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        )}

                        {coupon.valid_until && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <div>
                              <p className="text-xs text-gray-500">Valid Until</p>
                              <p className="font-medium">
                                {new Date(coupon.valid_until).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-2 text-gray-600">
                          <Users className="w-4 h-4" />
                          <div>
                            <p className="text-xs text-gray-500">Usage</p>
                            <p className="font-medium">
                              {coupon.usage_count}
                              {coupon.usage_limit ? ` / ${coupon.usage_limit}` : ' / Unlimited'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleEdit(coupon)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(coupon.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  {editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Coupon Code *
                    </label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., SAVE20"
                      required
                      disabled={editingCoupon}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Discount Percentage * (0-100)
                    </label>
                    <input
                      type="number"
                      value={formData.discount_percentage}
                      onChange={(e) => setFormData({ ...formData, discount_percentage: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 20"
                      min="0"
                      max="100"
                      step="0.01"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Valid From
                    </label>
                    <input
                      type="date"
                      value={formData.valid_from}
                      onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Valid Until
                    </label>
                    <input
                      type="date"
                      value={formData.valid_until}
                      onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Usage Limit (leave empty for unlimited)
                    </label>
                    <input
                      type="number"
                      value={formData.usage_limit}
                      onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 100"
                      min="1"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                      Active
                    </label>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      {editingCoupon ? 'Update' : 'Create'}
                    </button>
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
};

export default AdminCouponsPage;
