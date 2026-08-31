import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { DistributorsTable } from '../../components/distributors/DistributorsTable';
import { AddDistributorModal } from '../../components/distributors/AddDistributorModal';
import { distributorService } from '../../services/distributorService';
import { zoneService } from '../../services/zoneService';

export const Distributors = () => {
  const [distributors, setDistributors] = useState([]);
  const [zones, setZones] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const loadData = async () => {
    const [dData, zData] = await Promise.all([
      distributorService.getAll(),
      zoneService.getAll(),
    ]);
    setDistributors(dData);
    setZones(zData);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddDistributor = async (newDistData) => {
    await distributorService.add(newDistData);
    loadData();
  };

  return (
    <div className="panel">
      <div className="panel-head">
        <div>
          <h3>Distributor Directory</h3>
          <div className="hint">46 active · Target vs achievement, 1st year</div>
        </div>
        <button
          type="button"
          className="btn-primary"
          onClick={() => setIsAddModalOpen(true)}
        >
          <Plus className="w-3.5 h-3.5" /> Add Distributor
        </button>
      </div>

      <div className="panel-body" style={{ paddingTop: '6px' }}>
        <DistributorsTable distributors={distributors} />
      </div>

      <AddDistributorModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        zones={zones}
        onAdd={handleAddDistributor}
      />
    </div>
  );
};
