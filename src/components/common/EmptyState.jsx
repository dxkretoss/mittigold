import React from 'react';

export const EmptyState = ({ message = 'No records found', colSpan = 5 }) => {
  return (
    <tr>
      <td
        colSpan={colSpan}
        style={{
          textAlign: 'center',
          color: 'var(--ink-faint)',
          padding: '26px',
        }}
      >
        {message}
      </td>
    </tr>
  );
};
