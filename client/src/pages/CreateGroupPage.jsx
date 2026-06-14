import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FolderPlus, ArrowLeft } from 'lucide-react';
import { useGroupStore } from '../store';
import toast from 'react-hot-toast';

const CreateGroupPage = () => {
  const navigate = useNavigate();
  const { createGroup, isLoading } = useGroupStore();
  const [name, setName] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter a group name');
      return;
    }

    const result = await createGroup({ name });
    if (result.success) {
      toast.success('Group created successfully');
      navigate(`/groups/${result.group.id}`);
    } else {
      toast.error(result.error || 'Failed to create group');
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/groups')}
          className="flex items-center gap-1 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Groups
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Create New Group</h1>
        <p className="text-gray-600 mt-1">
          Start a new expense sharing group with your flatmates
        </p>
      </div>

      {/* Form */}
      <motion.form
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="card p-6"
      >
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Group Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-field"
            placeholder="e.g., Flat 204, Weekend Trip"
            autoFocus
          />
        </div>

        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => navigate('/groups')}
            className="btn-secondary flex-1"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading || !name.trim()}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            <FolderPlus className="w-5 h-5" />
            {isLoading ? 'Creating...' : 'Create Group'}
          </button>
        </div>
      </motion.form>
    </div>
  );
};

export default CreateGroupPage;
