import { analystProof } from './analyst-proof.js';

// Backward-compatible family entry. Boardroom decks open on Analyst Proof and
// expose the complete theme family in the viewer.
export const boardroom = {
  ...analystProof,
  label: 'Boardroom Theme Collection',
  description: 'Three purpose-built finance themes available inside the viewer',
  requestedTheme: 'boardroom',
};
