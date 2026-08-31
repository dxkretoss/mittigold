import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { BrokersTable } from '../../components/brokers/BrokersTable';
import { AddBrokerModal } from '../../components/brokers/AddBrokerModal';
import { brokerService } from '../../services/brokerService';

export const Brokers = () => {
  const [brokers, setBrokers] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const loadBrokers = async () => {
    const data = await brokerService.getAll();
    setBrokers(data);
  };

  useEffect(() => {
    loadBrokers();
  }, []);

  const handleAddBroker = async (newBrokerData) => {
    await brokerService.add(newBrokerData);
    loadBrokers();
  };

  return (
    <div className="panel">
      <div className="panel-head">
        <div>
          <h3>Broker Performance</h3>
          <div className="hint">Commission — paid vs pending, monthly report</div>
        </div>
        <button
          type="button"
          className="btn-primary"
          onClick={() => setIsAddModalOpen(true)}
        >
          <Plus className="w-3.5 h-3.5" /> Add Broker
        </button>
      </div>

      <div className="panel-body" style={{ paddingTop: '6px' }}>
        <BrokersTable brokers={brokers} />
      </div>

      <AddBrokerModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddBroker}
      />
    </div>
  );
};
