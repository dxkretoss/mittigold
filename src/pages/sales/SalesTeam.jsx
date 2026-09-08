import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, UserCheck, Phone, Mail, MapPin, Target, Award, Edit2, Trash2, CheckCircle2, AlertCircle, Users, Eye } from 'lucide-react';
import { employeeService } from '../../services/employeeService';
import { EmployeeModal } from '../../components/sales/EmployeeModal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Skeleton } from '../../components/common/Skeleton';
import { useToast } from '../../hooks/useToast';
import { usePagination } from '../../hooks/usePagination';
import { Pagination } from '../../components/common/Pagination';

export const SalesTeam = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [modalState, setModalState] = useState({
    isOpen: false,
    employee: null,
  });

  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    employee: null,
  });

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const data = await employeeService.getAll();
      setEmployees(data || []);
    } catch (err) {
      showError('Error Loading Sales Team', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Clear legacy mock data cache if present
    try {
      const stored = localStorage.getItem('mittigold_employees_data');
      if (stored && stored.includes('emp-1')) {
        localStorage.removeItem('mittigold_employees_data');
      }
    } catch (_) { }

    loadEmployees();

    const handleUpdate = () => {
      loadEmployees();
    };

    window.addEventListener('mittigold-employee-updated', handleUpdate);
    window.addEventListener('mittigold-order-created', handleUpdate);
    window.addEventListener('mittigold-order-updated', handleUpdate);
    return () => {
      window.removeEventListener('mittigold-employee-updated', handleUpdate);
      window.removeEventListener('mittigold-order-created', handleUpdate);
      window.removeEventListener('mittigold-order-updated', handleUpdate);
    };
  }, []);

  const handleOpenAdd = () => {
    setModalState({ isOpen: true, employee: null });
  };

  const handleOpenEdit = (employee) => {
    setModalState({ isOpen: true, employee });
  };

  const handleSaveEmployee = async (empData, empId) => {
    try {
      if (empId) {
        await employeeService.update(empId, empData);
        showSuccess('Employee Updated', `${empData.name} details updated.`);
      } else {
        await employeeService.add(empData);
        showSuccess('Employee Added', `${empData.name} added to the sales team.`);
      }
      await loadEmployees();
    } catch (err) {
      showError('Save Failed', err.message);
    }
  };

  const handleOpenDelete = (employee) => {
    setDeleteDialog({ isOpen: true, employee });
  };

  const handleConfirmDelete = async () => {
    if (!deleteDialog.employee?.id) return;
    try {
      await employeeService.delete(deleteDialog.employee.id);
      showSuccess('Employee Deleted', `${deleteDialog.employee.name} was removed from the sales team.`);
      setDeleteDialog({ isOpen: false, employee: null });
      await loadEmployees();
    } catch (err) {
      showError('Delete Failed', err.message);
    }
  };

  // Filter & search
  const filteredEmployees = employees.filter((emp) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (emp.name || '').toLowerCase().includes(q) ||
      (emp.phone || '').includes(q) ||
      (emp.email || '').toLowerCase().includes(q)
    );
  });

  const {
    currentPage,
    totalPages,
    totalItems,
    pageSize,
    paginatedData,
    goToPage,
    canPrev,
    canNext,
  } = usePagination(filteredEmployees, 10);

  return (
    <div className="page-animate">
      {/* Main Panel */}
      <div className="panel">
        <div className="panel-head" style={{ flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3>Employee / Sales Roster</h3>
            <div className="hint">
              <b>{employees.length} sales representatives</b> · Field officers, area managers & executive personnel
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn-primary"
              onClick={handleOpenAdd}
            >
              <Plus className="w-3.5 h-3.5" /> Add Sales Employee
            </button>
          </div>
        </div>

        {/* Search Toolbar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: '12px',
            padding: '14px 24px 8px',
            flexWrap: 'wrap',
          }}
        >
          {/* Search Box */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: '#FFFFFF',
              border: '1px solid var(--line)',
              borderRadius: '9px',
              padding: '6px 12px',
              fontSize: '13px',
              width: '280px',
            }}
          >
            <Search className="w-4 h-4 text-ink-faint" />
            <input
              type="text"
              placeholder="Search by name, phone, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                border: 'none',
                outline: 'none',
                background: 'transparent',
                width: '100%',
                fontSize: '12.5px',
                padding: 0,
              }}
            />
          </div>
        </div>

        {/* Table Content */}
        <div className="panel-body" style={{ paddingTop: '6px' }}>
          {loading ? (
            <Skeleton variant="table" rows={6} cols={4} />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: '38%' }}>Sales Employee</th>
                      <th style={{ width: '26%' }}>Contact</th>
                      <th style={{ width: '26%' }}>Target vs Achieved</th>
                      <th style={{ textAlign: 'right', width: '10%' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.length > 0 ? (
                      paginatedData.map((emp) => {
                        const target = emp.target_bags || 1000;
                        const achieved = emp.achieved_bags || 0;
                        const pct = target > 0 ? Math.min(100, Math.round((achieved / target) * 100)) : 0;
                        const initials = (emp.name || 'EM')
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .toUpperCase()
                          .slice(0, 2);

                        return (
                          <tr key={emp.id}>
                            {/* Avatar & Name */}
                            <td>
                              <div
                                style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
                                onClick={() => navigate(`/sales-team/${emp.id}`)}
                                title="Click to view sales employee breakdown & details"
                              >
                                <div
                                  className="av"
                                  style={{
                                    width: '34px',
                                    height: '34px',
                                    borderRadius: '50%',
                                    background: 'var(--amber-bg)',
                                    color: 'var(--amber)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '12px',
                                    fontWeight: 700,
                                    flexShrink: 0,
                                    border: '1px solid rgba(185, 131, 46, 0.25)',
                                  }}
                                >
                                  {initials}
                                </div>
                                <div>
                                  <div style={{ fontWeight: 600, color: 'var(--navy)', fontSize: '13.5px' }}>
                                    {emp.name}
                                  </div>
                                  <div style={{ fontSize: '11px', color: 'var(--ink-soft)' }}>
                                    {emp.email || '—'}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Contact Phone */}
                            <td className="mono" style={{ fontSize: '12.5px' }}>
                              {emp.phone || '—'}
                            </td>

                            {/* Monthly Target Progress */}
                            <td>
                              <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', marginBottom: '4px' }}>
                                  <span style={{ fontWeight: 600, color: 'var(--navy)' }}>
                                    ₹{Number(achieved).toLocaleString('en-IN')} / ₹{Number(target).toLocaleString('en-IN')}
                                  </span>
                                  <span className="mono" style={{ fontWeight: 700, color: pct >= 80 ? 'var(--green)' : 'var(--amber)' }}>
                                    {pct}%
                                  </span>
                                </div>
                                <div
                                  style={{
                                    height: '6px',
                                    background: 'var(--line)',
                                    borderRadius: '999px',
                                    overflow: 'hidden',
                                  }}
                                >
                                  <div
                                    style={{
                                      width: `${pct}%`,
                                      height: '100%',
                                      background: pct >= 80 ? 'var(--green)' : 'var(--wheat)',
                                      borderRadius: '999px',
                                      transition: 'width 0.3s ease',
                                    }}
                                  />
                                </div>
                              </div>
                            </td>

                            {/* Actions */}
                            <td style={{ textAlign: 'right' }}>
                              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '6px' }}>
                                <button
                                  type="button"
                                  className="btn btn-outline"
                                  onClick={() => navigate(`/sales-team/${emp.id}`)}
                                  style={{
                                    padding: '4px 10px',
                                    fontSize: '11.5px',
                                    height: '28px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    borderRadius: '6px',
                                    color: 'var(--navy)',
                                  }}
                                  title="View Employee Details & Breakdown"
                                >
                                  <Eye className="w-3.5 h-3.5 text-wheat" />
                                  <span>View</span>
                                </button>
                                <button
                                  type="button"
                                  className="icon-sm"
                                  onClick={() => handleOpenEdit(emp)}
                                  title="Edit Employee"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  className="icon-sm danger"
                                  onClick={() => handleOpenDelete(emp)}
                                  title="Delete Employee"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={4} style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--ink-soft)' }}>
                          <Users className="w-10 h-10 mx-auto text-ink-faint mb-3 opacity-40" />
                          <div style={{ fontSize: '14.5px', fontWeight: 600, color: 'var(--navy)', marginBottom: '4px' }}>
                            {searchQuery ? 'No matching sales employees' : 'No sales employees found'}
                          </div>
                          <div style={{ fontSize: '12.5px', color: 'var(--ink-soft)', marginBottom: '16px' }}>
                            {searchQuery
                              ? 'Try adjusting your search query.'
                              : 'Add your first sales representative to get started.'}
                          </div>

                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {paginatedData.length > 0 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  pageSize={pageSize}
                  onPageChange={goToPage}
                  canPrev={canPrev}
                  canNext={canNext}
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* Add / Edit Employee Modal */}
      <EmployeeModal
        isOpen={modalState.isOpen}
        employee={modalState.employee}
        onClose={() => setModalState({ isOpen: false, employee: null })}
        onSave={handleSaveEmployee}
      />

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, employee: null })}
        onConfirm={handleConfirmDelete}
        title="Delete Sales Representative"
        confirmText="Delete Representative"
        confirmVariant="danger"
        message={
          deleteDialog.employee ? (
            <>
              Remove <b style={{ color: 'var(--ink)' }}>{deleteDialog.employee.name}</b> ({deleteDialog.employee.role}) from the sales team?
            </>
          ) : (
            ''
          )
        }
      />
    </div>
  );
};
