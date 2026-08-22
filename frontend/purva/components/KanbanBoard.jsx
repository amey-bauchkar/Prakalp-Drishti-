import React from 'react';
import KanbanColumn from './KanbanColumn';

export const KanbanBoard = ({ issues = [], onCardClick }) => {
  const pendingIssues = issues.filter((i) => (i.status || 'Pending') === 'Pending');
  const inProgressIssues = issues.filter((i) => i.status === 'In Progress');
  const resolvedIssues = issues.filter((i) => i.status === 'Resolved');

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
      <KanbanColumn
        status="Pending"
        issues={pendingIssues}
        onCardClick={onCardClick}
      />
      <KanbanColumn
        status="In Progress"
        issues={inProgressIssues}
        onCardClick={onCardClick}
      />
      <KanbanColumn
        status="Resolved"
        issues={resolvedIssues}
        onCardClick={onCardClick}
      />
    </div>
  );
};

export default KanbanBoard;
