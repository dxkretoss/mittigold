import React, { useState } from 'react';
import { STAGE_LABELS } from '../../utils/constants';

const STAGES = ['new', 'followup', 'convert', 'close'];

export const LeadsKanban = ({ leads = [], onStageChange, filter = 'all' }) => {
  const [draggedLead, setDraggedLead] = useState(null);
  const [dragOverStage, setDragOverStage] = useState(null);

  const handleDragStart = (e, lead) => {
    setDraggedLead(lead);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', lead.id);
  };

  const handleDragEnd = () => {
    setDraggedLead(null);
    setDragOverStage(null);
  };

  const handleDragOver = (e, stage) => {
    e.preventDefault();
    if (dragOverStage !== stage) {
      setDragOverStage(stage);
    }
  };

  const handleDragLeave = (e, stage) => {
    if (dragOverStage === stage) {
      setDragOverStage(null);
    }
  };

  const handleDrop = (e, targetStage) => {
    e.preventDefault();
    setDragOverStage(null);
    if (draggedLead) {
      onStageChange(draggedLead, targetStage);
      setDraggedLead(null);
    }
  };

  return (
    <div className="kanban-wrap">
      {STAGES.map((st) => {
        const items = leads.filter((l) => l.stage === st && (filter === 'all' || filter === st));
        const isOver = dragOverStage === st;

        return (
          <div
            key={st}
            className={`kanban-col ${isOver ? 'dragover' : ''}`}
            onDragOver={(e) => handleDragOver(e, st)}
            onDragLeave={(e) => handleDragLeave(e, st)}
            onDrop={(e) => handleDrop(e, st)}
          >
            <div className="kanban-col-head">
              <b>{STAGE_LABELS[st]}</b>
              <span>{items.length}</span>
            </div>

            {items.length > 0 ? (
              items.map((l) => {
                const isDragging = draggedLead?.id === l.id;
                return (
                  <div
                    key={l.id || l.name}
                    className={`kanban-card ${isDragging ? 'dragging' : ''}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, l)}
                    onDragEnd={handleDragEnd}
                  >
                    <div className="kc-name">{l.name}</div>
                    <div className="kc-meta">
                      <span>{l.zone}</span>
                      <span>{l.owner}</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ fontSize: '11.5px', color: 'var(--ink-faint)', textAlign: 'center', padding: '16px 0' }}>
                No leads
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
