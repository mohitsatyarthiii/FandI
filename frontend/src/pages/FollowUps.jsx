import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { 
  sendFollowUpAPI, 
  getFollowUpHistoryAPI, 
  getFollowUpStatsAPI,
  retryFollowUpAPI,
  getEntriesAPI,
  getTemplatesAPI,        // ✅ Make sure this is imported
  createTemplateAPI,      // ✅ Make sure this is imported
  updateTemplateAPI,      // ✅ Make sure this is imported
  deleteTemplateAPI       // ✅ Make sure this is imported
} from '../api/axios';
import {
  Send,
  MessageSquare,
  Phone,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Search,
  Filter,
  MapPin,
  AlertCircle,
  TrendingUp,
  Users,
  MessageCircle,
                  // ✅ Make sure Plus is imported
} from 'lucide-react';

const FollowUps = () => {
  const { user, isAdmin, isManager } = useAuth();
  const [activeTab, setActiveTab] = useState('send'); // send, history, stats, templates
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Send className="h-6 w-6 text-indigo-600" />
              Follow-ups
            </h1>
            <p className="text-gray-600 mt-1">
              Send bulk messages and manage follow-up communications
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {[
                { id: 'send', label: 'Send Message', icon: Send },
                { id: 'history', label: 'History', icon: Clock },
                { id: 'stats', label: 'Statistics', icon: TrendingUp },
                ...(isAdmin || isManager ? [{ id: 'templates', label: 'Templates', icon: MessageSquare }] : [])
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2
                    ${activeTab === tab.id 
                      ? 'border-indigo-500 text-indigo-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                  `}
                >
                  <tab.icon size={18} />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'send' && <SendFollowUpSection />}
            {activeTab === 'history' && <FollowUpHistorySection />}
            {activeTab === 'stats' && <FollowUpStatsSection />}
            {activeTab === 'templates' && (isAdmin || isManager) && <TemplatesSection />}
          </div>
        </div>
      </div>
    </Layout>
  );
};

// Send Follow-up Section
const SendFollowUpSection = () => {
  const { user, isAdmin } = useAuth();
  const [entries, setEntries] = useState([]);
  const [selectedEntries, setSelectedEntries] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState(isAdmin ? 'all' : user.location);
  const [channel, setChannel] = useState('whatsapp');
  const [useTemplate, setUseTemplate] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [customMessage, setCustomMessage] = useState('');

  useEffect(() => {
    fetchEntries();
    fetchTemplates();
  }, [locationFilter]);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const params = {};
      if (isAdmin && locationFilter !== 'all') {
        params.location = locationFilter;
      } else if (!isAdmin) {
        params.location = user.location;
      }
      const response = await getEntriesAPI(params);
      setEntries(response.data.entries || []);
    } catch (error) {
      setError('Failed to fetch entries');
      console.error('Fetch entries error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await getTemplatesAPI();
      setTemplates(response.data.templates || []);
    } catch (error) {
      console.error('Fetch templates error:', error);
    }
  };

  const handleSelectAll = () => {
    if (selectedEntries.length === filteredEntries.length) {
      setSelectedEntries([]);
    } else {
      setSelectedEntries(filteredEntries.map(e => e._id));
    }
  };

  const handleToggleEntry = (entryId) => {
    setSelectedEntries(prev =>
      prev.includes(entryId)
        ? prev.filter(id => id !== entryId)
        : [...prev, entryId]
    );
  };

  const handleSend = async () => {
    if (selectedEntries.length === 0) {
      setError('Please select at least one entry');
      return;
    }

    if (!useTemplate && !customMessage.trim()) {
      setError('Please enter a message or select a template');
      return;
    }

    if (useTemplate && !selectedTemplate) {
      setError('Please select a template');
      return;
    }

    try {
      setSending(true);
      setError('');
      setSuccess('');

      const payload = {
        entryIds: selectedEntries,
        channel,
        ...(useTemplate 
          ? { templateId: selectedTemplate }
          : { message: customMessage }
        )
      };

      const response = await sendFollowUpAPI(payload);

      if (response.data.success) {
        setSuccess(`Successfully processed ${response.data.total} messages. Sent: ${response.data.sent}, Failed: ${response.data.failed}`);
        setSelectedEntries([]);
        setCustomMessage('');
        setSelectedTemplate('');
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to send messages');
    } finally {
      setSending(false);
    }
  };

  const filteredEntries = entries.filter(entry =>
    entry.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.clientPhone?.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg flex items-center gap-2">
          <CheckCircle2 size={18} />
          {success}
        </div>
      )}

      {/* Channel Selection & Message Input */}
      <div className="bg-gray-50 rounded-lg p-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Channel</label>
            <div className="flex gap-2">
              <button
                onClick={() => setChannel('whatsapp')}
                className={`px-4 py-2 rounded-lg border-2 flex items-center gap-2 ${
                  channel === 'whatsapp'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-300 hover:border-green-300'
                }`}
              >
                <MessageCircle size={18} />
                WhatsApp
              </button>
              <button
                onClick={() => setChannel('sms')}
                className={`px-4 py-2 rounded-lg border-2 flex items-center gap-2 ${
                  channel === 'sms'
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-gray-300 hover:border-indigo-300'
                }`}
              >
                <Phone size={18} />
                SMS
              </button>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Message Type</label>
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setUseTemplate(true)}
              className={`px-4 py-2 rounded-lg border-2 ${
                useTemplate
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                  : 'border-gray-300 hover:border-indigo-300'
              }`}
            >
              Use Template
            </button>
            <button
              onClick={() => setUseTemplate(false)}
              className={`px-4 py-2 rounded-lg border-2 ${
                !useTemplate
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                  : 'border-gray-300 hover:border-indigo-300'
              }`}
            >
              Custom Message
            </button>
          </div>

          {useTemplate ? (
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Select a template</option>
              {templates.filter(t => t.channel === channel || !t.channel).map(template => (
                <option key={template._id} value={template._id}>
                  {template.name}
                </option>
              ))}
            </select>
          ) : (
            <textarea
              rows={4}
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Type your message here... Use {{clientName}}, {{phone}}, {{location}} for personalization"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          )}
        </div>
      </div>

      {/* Entry Selection */}
      <div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Select Recipients ({selectedEntries.length} selected)
          </h3>
          <div className="flex gap-2">
            {isAdmin && (
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
              >
                <option value="all">All Locations</option>
                <option value="mathura">Mathura</option>
                <option value="agra">Agra</option>
                <option value="noida">Noida</option>
              </select>
            )}
            <input
              type="text"
              placeholder="Search entries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <>
            <button
              onClick={handleSelectAll}
              className="text-sm text-indigo-600 hover:text-indigo-800 mb-2"
            >
              {selectedEntries.length === filteredEntries.length ? 'Deselect All' : 'Select All'}
            </button>
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredEntries.map(entry => (
                <div
                  key={entry._id}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                    selectedEntries.includes(entry._id)
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleToggleEntry(entry._id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{entry.clientName}</p>
                      <p className="text-sm text-gray-500">{entry.clientPhone}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs capitalize bg-gray-100 px-2 py-1 rounded">
                        {entry.location}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Send Button */}
      <button
        onClick={handleSend}
        disabled={sending || selectedEntries.length === 0}
        className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
      >
        {sending ? (
          <>
            <RefreshCw size={18} className="animate-spin" />
            Sending...
          </>
        ) : (
          <>
            <Send size={18} />
            Send to {selectedEntries.length} Recipients
          </>
        )}
      </button>
    </div>
  );
};

// Follow-up History Section
const FollowUpHistorySection = () => {
  const { user, isAdmin } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [channelFilter, setChannelFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [retryingId, setRetryingId] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, [statusFilter, channelFilter, locationFilter, page]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 20,
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(channelFilter !== 'all' && { channel: channelFilter }),
        ...(isAdmin && locationFilter !== 'all' && { location: locationFilter }),
        ...(searchTerm && { phone: searchTerm })
      };

      const response = await getFollowUpHistoryAPI(params);
      setHistory(response.data.history || []);
      setTotalPages(response.data.totalPages || 1);
    } catch (error) {
      console.error('Fetch history error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async (id) => {
    try {
      setRetryingId(id);
      await retryFollowUpAPI(id);
      fetchHistory();
    } catch (error) {
      console.error('Retry error:', error);
    } finally {
      setRetryingId(null);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      sent: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800'
    };
    return `px-2 py-1 rounded-full text-xs font-medium capitalize ${badges[status] || 'bg-gray-100'}`;
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search by phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && fetchHistory()}
          className="px-3 py-2 border border-gray-300 rounded-lg flex-1 min-w-[200px]"
        />
        
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg"
        >
          <option value="all">All Status</option>
          <option value="sent">Sent</option>
          <option value="failed">Failed</option>
          <option value="pending">Pending</option>
        </select>

        <select
          value={channelFilter}
          onChange={(e) => setChannelFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg"
        >
          <option value="all">All Channels</option>
          <option value="whatsapp">WhatsApp</option>
          <option value="sms">SMS</option>
        </select>

        {isAdmin && (
          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="all">All Locations</option>
            <option value="mathura">Mathura</option>
            <option value="agra">Agra</option>
            <option value="noida">Noida</option>
          </select>
        )}
      </div>

      {/* History Table */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Client</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Phone</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Channel</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Date</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {history.map(record => (
                <tr key={record._id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">{record.clientName}</td>
                  <td className="py-3 px-4">{record.phone}</td>
                  <td className="py-3 px-4 capitalize">{record.channel}</td>
                  <td className="py-3 px-4">
                    <span className={getStatusBadge(record.status)}>
                      {record.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-500">
                    {new Date(record.sentAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    {record.status === 'failed' && (
                      <button
                        onClick={() => handleRetry(record._id)}
                        disabled={retryingId === record._id}
                        className="text-indigo-600 hover:text-indigo-800 text-sm flex items-center gap-1"
                      >
                        <RefreshCw size={14} className={retryingId === record._id ? 'animate-spin' : ''} />
                        Retry
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={`px-3 py-1 rounded ${
                page === i + 1
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Statistics Section
const FollowUpStatsSection = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await getFollowUpStatsAPI();
      setStats(response.data.stats);
    } catch (error) {
      console.error('Fetch stats error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    { label: 'Total Messages', value: stats.total, icon: Send, color: 'text-indigo-600', bg: 'bg-indigo-100' },
    { label: 'Sent', value: stats.sent, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-100' },
    { label: 'Failed', value: stats.failed, icon: XCircle, color: 'text-red-600', bg: 'bg-red-100' },
    { label: 'WhatsApp', value: stats.whatsapp, icon: MessageCircle, color: 'text-green-600', bg: 'bg-green-100' },
    { label: 'SMS', value: stats.sms, icon: Phone, color: 'text-blue-600', bg: 'bg-blue-100' }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {statCards.map((card, index) => (
        <div key={index} className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">{card.label}</p>
              <p className="text-2xl font-bold mt-1">{card.value}</p>
            </div>
            <div className={`${card.bg} p-3 rounded-full`}>
              <card.icon className={`${card.color}`} size={24} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Templates Section
const TemplatesSection = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    content: '',
    channel: 'whatsapp'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await getTemplatesAPI();
      setTemplates(response.data.templates || []);
    } catch (error) {
      console.error('Fetch templates error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (editingTemplate) {
        await updateTemplateAPI(editingTemplate._id, formData);
        setSuccess('Template updated successfully!');
      } else {
        await createTemplateAPI(formData);
        setSuccess('Template created successfully!');
      }
      setShowModal(false);
      resetForm();
      fetchTemplates();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to save template');
    }
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || '',
      content: template.content,
      channel: template.channel
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this template?')) return;
    try {
      await deleteTemplateAPI(id);
      fetchTemplates();
    } catch (error) {
      console.error('Delete template error:', error);
    }
  };

  const resetForm = () => {
    setEditingTemplate(null);
    setFormData({
      name: '',
      description: '',
      content: '',
      channel: 'whatsapp'
    });
    setError('');
  };

  const variables = ['{{clientName}}', '{{phone}}', '{{location}}', '{{clientAddress}}', '{{clientCity}}', '{{enquiryType}}'];

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg flex items-center gap-2">
          <CheckCircle2 size={18} />
          {success}
        </div>
      )}

      <button
        onClick={() => { resetForm(); setShowModal(true); }}
        className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2"
      >
        <Plus size={18} />
        Create Template
      </button>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map(template => (
            <div key={template._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-900">{template.name}</h4>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  template.channel === 'whatsapp' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {template.channel}
                </span>
              </div>
              {template.description && (
                <p className="text-sm text-gray-600 mb-2">{template.description}</p>
              )}
              <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto whitespace-pre-wrap">
                {template.content}
              </pre>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => handleEdit(template)}
                  className="text-indigo-600 hover:text-indigo-800 text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(template._id)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Template Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {editingTemplate ? 'Edit Template' : 'Create Template'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Template Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Channel *</label>
                <select
                  value={formData.channel}
                  onChange={(e) => setFormData({...formData, channel: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="whatsapp">WhatsApp</option>
                  <option value="sms">SMS</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content *</label>
                <textarea
                  required
                  rows={6}
                  value={formData.content}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
                  placeholder="Type your message template..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Available Variables</label>
                <div className="flex flex-wrap gap-2">
                  {variables.map(variable => (
                    <button
                      key={variable}
                      type="button"
                      onClick={() => setFormData({
                        ...formData,
                        content: formData.content + ' ' + variable
                      })}
                      className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200"
                    >
                      {variable}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700"
                >
                  {editingTemplate ? 'Update Template' : 'Create Template'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Missing Plus import for TemplatesSection
import { Plus } from 'lucide-react';

export default FollowUps;