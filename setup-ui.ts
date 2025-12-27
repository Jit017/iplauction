import { SetupManager, SetupState, AuctionType } from './setup';
import { Player, Team } from './types';
import { getInitialTeams } from './teams';
import { setAuctionType, setSelectedTeam } from './auction-state';

// UI Elements (will be initialized when DOM is ready)
let setupScreenEl: HTMLElement;
let auctionScreenEl: HTMLElement;
let auctionTypeRadios: NodeListOf<HTMLInputElement>;
let teamSelectorEl: HTMLSelectElement;
let squadSectionEl: HTMLElement;
let previousSquadEl: HTMLElement;
let retentionSummaryEl: HTMLElement;
let retainedCountEl: HTMLElement;
let retentionCostEl: HTMLElement;
let remainingPurseEl: HTMLElement;
let retentionErrorsEl: HTMLElement;
let proceedBtn: HTMLButtonElement;

function getUIElements(): void {
  setupScreenEl = document.getElementById('setup-screen')!;
  auctionScreenEl = document.getElementById('auction-screen')!;
  auctionTypeRadios = document.querySelectorAll<HTMLInputElement>('input[name="auction-type"]');
  teamSelectorEl = document.getElementById('setup-team-selector') as HTMLSelectElement;
  squadSectionEl = document.getElementById('squad-section')!;
  previousSquadEl = document.getElementById('previous-squad')!;
  retentionSummaryEl = document.getElementById('retention-summary')!;
  retainedCountEl = document.getElementById('retained-count')!;
  retentionCostEl = document.getElementById('retention-cost')!;
  remainingPurseEl = document.getElementById('remaining-purse')!;
  retentionErrorsEl = document.getElementById('retention-errors')!;
  proceedBtn = document.getElementById('proceed-btn')!;
}

let setupManager: SetupManager | null = null;
let onSetupComplete: ((state: SetupState) => void) | null = null;

/**
 * Initialize setup screen
 * Loads teams from central teams data file
 */
export async function initializeSetupScreen(
  onComplete: (state: SetupState) => void
): Promise<void> {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    await new Promise((resolve) => {
      document.addEventListener('DOMContentLoaded', resolve);
    });
  }
  
  // Get UI elements
  getUIElements();
  
  // Verify team selector element exists
  if (!teamSelectorEl) {
    console.error('Team selector element not found. Retrying...');
    // Retry after a short delay
    await new Promise(resolve => setTimeout(resolve, 100));
    getUIElements();
  }
  
  // Load teams from central data file
  const teams = await getInitialTeams();
  console.log('Loaded teams:', teams.length);
  
  onSetupComplete = onComplete;
  setupManager = new SetupManager(teams, onComplete);

  // Populate team selector
  populateTeamSelector(teams);

  // Set up event listeners
  setupEventListeners();

  // Initialize UI state - disable proceed button until team is selected
  if (proceedBtn) {
    proceedBtn.disabled = true;
  }

  // Show setup screen, hide auction screen
  if (setupScreenEl) {
    setupScreenEl.style.display = 'block';
  }
  if (auctionScreenEl) {
    auctionScreenEl.style.display = 'none';
  }
}

/**
 * Populate team selector
 */
function populateTeamSelector(teams: Team[]): void {
  if (!teamSelectorEl) {
    console.error('Team selector element not found');
    return;
  }
  
  if (!teams || teams.length === 0) {
    console.error('No teams provided to populate selector');
    return;
  }
  
  teamSelectorEl.innerHTML = '<option value="">-- Select Team --</option>';
  teams.forEach((team) => {
    const option = document.createElement('option');
    option.value = team.id;
    option.textContent = team.name;
    teamSelectorEl.appendChild(option);
  });
  
  console.log(`Populated team selector with ${teams.length} teams`);
}

/**
 * Set up event listeners
 */
function setupEventListeners(): void {
  // Auction type selection
  auctionTypeRadios.forEach((radio) => {
    radio.addEventListener('change', (e) => {
      const type = (e.target as HTMLInputElement).value as AuctionType;
      if (setupManager) {
        setupManager.setAuctionType(type);
        // Re-render squad to show updated retention rules
        renderPreviousSquad();
        updateRetentionSummary();
        updateProceedButton();
      }
    });
  });

  // Team selection
  teamSelectorEl.addEventListener('change', (e) => {
    const teamId = (e.target as HTMLSelectElement).value;
    if (teamId && setupManager) {
      try {
        setupManager.setSelectedTeam(teamId);
        renderPreviousSquad();
        updateRetentionSummary();
        squadSectionEl.style.display = 'block';
        retentionSummaryEl.style.display = 'block';
        // Enable proceed button when team is selected
        updateProceedButton();
      } catch (error: any) {
        alert(`Error: ${error.message}`);
      }
    } else {
      squadSectionEl.style.display = 'none';
      retentionSummaryEl.style.display = 'none';
      // Disable proceed button when no team is selected
      proceedBtn.disabled = true;
    }
  });

  // Proceed button
  proceedBtn.addEventListener('click', () => {
    if (setupManager && setupManager.isSetupComplete()) {
      try {
        setupManager.completeSetup();
        const state = setupManager.getState();
        
        // Save to global state
        if (state.auctionType) {
          setAuctionType(state.auctionType);
        }
        if (state.selectedTeam) {
          setSelectedTeam(state.selectedTeam);
        }
        
        if (onSetupComplete) {
          onSetupComplete(state);
          // Hide setup, show auction
          setupScreenEl.style.display = 'none';
          auctionScreenEl.style.display = 'block';
        }
      } catch (error: any) {
        alert(`Cannot proceed: ${error.message}`);
      }
    }
  });
}

/**
 * Render previous season squad with retention checkboxes
 */
function renderPreviousSquad(): void {
  if (!setupManager) return;

  const state = setupManager.getState();
  const squad = state.previousSquad;
  const retainedIds = new Set(state.retainedPlayers.map((p) => p.id));

  if (squad.length === 0) {
    previousSquadEl.innerHTML = '<p class="no-squad">No previous season squad available</p>';
    return;
  }

  previousSquadEl.innerHTML = squad
    .map((player) => {
      const isRetained = retainedIds.has(player.id);
      const playerCost = getPlayerRetentionCost(player, state.retainedPlayers);
      
      return `
        <div class="squad-player ${isRetained ? 'retained' : ''}">
          <label class="player-checkbox">
            <input 
              type="checkbox" 
              data-player-id="${player.id}"
              ${isRetained ? 'checked' : ''}
            >
            <div class="player-details">
              <div class="player-name">${player.name}</div>
              <div class="player-meta">
                <span>${player.role}</span>
                <span>${player.isCapped ? 'Capped' : 'Uncapped'}</span>
                <span class="retention-cost">${playerCost > 0 ? `${playerCost} Cr` : ''}</span>
              </div>
            </div>
          </label>
        </div>
      `;
    })
    .join('');

  // Attach checkbox listeners
  previousSquadEl.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
    checkbox.addEventListener('change', (e) => {
      const playerId = (e.target as HTMLInputElement).getAttribute('data-player-id');
      if (playerId && setupManager) {
        const result = setupManager.toggleRetention(playerId);
        if (!result.success) {
          alert(result.error);
          // Revert checkbox
          (e.target as HTMLInputElement).checked = !(e.target as HTMLInputElement).checked;
        } else {
          renderPreviousSquad();
          updateRetentionSummary();
        }
      }
    });
  });
}

/**
 * Get retention cost for a specific player
 */
function getPlayerRetentionCost(player: Player, allRetained: Player[]): number {
  if (!allRetained.some((p) => p.id === player.id)) {
    return 0;
  }

  const cappedPlayers = allRetained
    .filter((p) => p.isCapped)
    .sort((a, b) => {
      // Sort by some criteria (e.g., rating) to determine order
      return b.rating - a.rating;
    });

  const uncappedPlayers = allRetained.filter((p) => !p.isCapped);

  if (player.isCapped) {
    const index = cappedPlayers.findIndex((p) => p.id === player.id);
    const costs = [18, 14, 8, 4];
    return costs[index] || 0;
  } else {
    return 4; // Uncapped players cost 4 Cr each
  }
}

/**
 * Update retention summary
 */
function updateRetentionSummary(): void {
  if (!setupManager) return;

  const state = setupManager.getState();
  const error = setupManager.getRetentionError();

  // Update counts and costs
  retainedCountEl.textContent = state.retainedPlayers.length.toString();
  retentionCostEl.textContent = `${state.retentionCost.toFixed(2)} Cr`;
  remainingPurseEl.textContent = `${state.remainingPurse.toFixed(2)} Cr`;

  // Show retention rules based on auction type
  const isMega = state.auctionType === 'mega';
  const cappedCount = state.retainedPlayers.filter(p => p.isCapped).length;
  const uncappedCount = state.retainedPlayers.filter(p => !p.isCapped).length;
  
  let rulesText = '';
  if (isMega) {
    rulesText = `Mega Auction Rules: Max 6 total (${state.retainedPlayers.length}/6), Max 4 capped (${cappedCount}/4), Max 2 uncapped (${uncappedCount}/2)`;
  } else {
    rulesText = `Mini Auction: Unlimited retentions allowed (${state.retainedPlayers.length} retained)`;
  }

  // Update error display
  if (error) {
    retentionErrorsEl.innerHTML = `<div class="error-text">${error}</div><div class="rules-text">${rulesText}</div>`;
    retentionErrorsEl.style.display = 'block';
    retentionErrorsEl.className = 'error-message';
  } else {
    retentionErrorsEl.innerHTML = `<div class="rules-text">${rulesText}</div>`;
    retentionErrorsEl.style.display = 'block';
    retentionErrorsEl.className = 'info-message';
  }

  // Update purse color based on remaining amount
  if (state.remainingPurse < 10) {
    remainingPurseEl.className = 'purse-amount purse-low';
  } else {
    remainingPurseEl.className = 'purse-amount';
  }

  // Update proceed button state
  updateProceedButton();
}

/**
 * Update proceed button enabled state
 * Disabled until a team is selected
 */
function updateProceedButton(): void {
  if (!setupManager) {
    proceedBtn.disabled = true;
    return;
  }

  const state = setupManager.getState();
  const error = setupManager.getRetentionError();

  // Disable if no team selected
  if (!state.selectedTeam) {
    proceedBtn.disabled = true;
    return;
  }

  // Disable if there are retention errors
  if (error) {
    proceedBtn.disabled = true;
    return;
  }

  // Enable if setup is complete
  proceedBtn.disabled = !setupManager.isSetupComplete();
}

