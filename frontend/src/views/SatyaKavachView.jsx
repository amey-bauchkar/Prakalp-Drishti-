import React from 'react';
import FinancialIntegrityView from '../../tanmay/index.jsx';
import LoginGate from '../../amey/LoginGate.jsx';

/**
 * Pillar 2 — SATYA-KAVACH: statutory CCEA boundary audit & financial integrity.
 */
export default function SatyaKavachView() {
  return (
    <LoginGate>
      <FinancialIntegrityView />
    </LoginGate>
  );
}
