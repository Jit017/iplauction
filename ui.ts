import { AuctionEngine, AuctionEventType } from './auction-engine';
import { AuctionManager } from './auction-manager';
import { Player, Team, AuctionStatus } from './types';
import { getNextBid } from './bid-utils';
import { initializeSetupScreen, SetupState } from './setup-ui';
import { getSelectedTeamId, getSelectedTeam } from './auction-state';
import { aiBidWithStopping } from './ai-bidding';

// UI Elements
const landingScreenEl = document.getElementById('landing-screen')!;
const setupScreenEl = document.getElementById('setup-screen')!;
const auctionScreenEl = document.getElementById('auction-screen')!;
const startAuctionBtn = document.getElementById('start-auction-btn')!;
const playerInfoEl = document.getElementById('player-info')!;
const currentBidEl = document.getElementById('current-bid')!;
const leadingTeamEl = document.getElementById('leading-team')!;
const timerEl = document.getElementById('timer')!;
const auctionStatusEl = document.getElementById('auction-status')!;
const startBtn = document.getElementById('start-btn')!;
const nextBtn = document.getElementById('next-btn')!;
const pauseBtn = document.getElementById('pause-btn')!;
const resumeBtn = document.getElementById('resume-btn')!;
const teamsListEl = document.getElementById('teams-list')!;
const teamSelectorEl = document.getElementById('team-selector') as HTMLSelectElement;
const nextBidAmountEl = document.getElementById('next-bid-amount')!;
const manualBidBtn = document.getElementById('manual-bid-btn')!;

// Auction state
let engine: AuctionEngine | null = null;
let manager: AuctionManager | null = null;
let teams: Team[] = [];

/**
 * Initialize the UI with teams from central data file
 */
async function initializeTeams(): Promise<Team[]> {
  // Import teams from central data file
  const { getInitialTeams } = await import('./teams');
  return getInitialTeams();
}

/**
 * Initialize auction engine and manager
 */
async function initializeAuction() {
  try {
    teams = await initializeTeams();
    engine = new AuctionEngine(teams, {
      timerDuration: 30,
      // bidIncrement is now handled by IPL-style increments (getNextBid)
    });

    // Load players and create manager
    const { loadPlayers } = await import('./auction-manager');
    const players = await loadPlayers();
    manager = new AuctionManager(engine, players, {
      autoProceed: false,
    });

    // Subscribe to events
    manager.subscribe(handleAuctionEvent);

    // Render teams
    renderTeams();

    console.log('Auction initialized');
  } catch (error) {
    console.error('Error initializing auction:', error);
    alert('Failed to initialize auction. Make sure players.ts exists.');
  }
}

/**
 * Handle auction events
 */
function handleAuctionEvent(event: any) {
  const state = event.state;

  // Update UI based on event type
  switch (event.type) {
    case AuctionEventType.PLAYER_SET:
      updatePlayerCard(state.currentPlayer);
      updateAuctionStatus(state);
      renderTeams(); // Re-render to show bid buttons
      updateNextBidAmount();
      updateManualBidButton();
      // AI bidding is now handled automatically by the auction engine on timer ticks
      break;

    case AuctionEventType.BID_PLACED:
      updateAuctionStatus(state);
      renderTeams();
      updateTeamSelector(); // Update team selector with new purse amounts
      updateNextBidAmount();
      updateManualBidButton();
      // AI bidding is now handled automatically by the auction engine on timer ticks
      break;

    case AuctionEventType.TIMER_TICK:
      updateTimer(state.timer);
      break;

    case AuctionEventType.TIMER_EXPIRED:
      updateTimer(0);
      break;

    case AuctionEventType.PLAYER_SOLD:
      updateAuctionStatus(state);
      renderTeams();
      updateTeamSelector(); // Update team selector with new purse amounts
      updateNextBidAmount();
      updateManualBidButton();
      alert(`Player ${state.currentPlayer?.name} sold to ${state.leadingTeam?.name} for ${state.currentBid.toFixed(2)} Cr`);
      break;

    case AuctionEventType.PLAYER_UNSOLD:
      updateAuctionStatus(state);
      alert(`Player ${state.currentPlayer?.name} went unsold`);
      break;

    case AuctionEventType.AUCTION_ENDED:
      updateAuctionStatus(state);
      if (event.data?.result === 'COMPLETE') {
        alert('Auction completed!');
        startBtn.disabled = false;
        nextBtn.disabled = true;
      }
      break;

    case AuctionEventType.STATE_CHANGED:
      updateAuctionStatus(state);
      renderTeams(); // Re-render to show/hide bid buttons
      updateNextBidAmount();
      updateManualBidButton();
      break;
  }
}

/**
 * Simple helper to determine if a player is likely overseas
 * This is a basic implementation - can be enhanced with actual nationality data
 */
function isLikelyOverseas(playerName: string): boolean {
  // Common overseas player name patterns (basic heuristic)
  // In a real implementation, this would use nationality data
  const commonOverseasPatterns = [
    /\b(steve|david|kane|williamson|trent|boult|rashid|khan|andre|russell|sunil|narine|kieron|pollard|dwayne|bravo|chris|gayle|ab|de|villiers|faf|du|plessis|glenn|maxwell|marcus|stoinis|pat|cummins|mitchell|starc|josh|hazlewood|ben|stokes|jos|buttler|eoin|morgan|jason|roy|jofra|archer|sam|curran|tom|curran|moeen|ali|adil|rashid|dawid|malan|jonny|bairstow|chris|woakes|mark|wood|liam|livingstone|phil|salt|harry|brook|will|jacks|reece|topley|david|willey|tymal|mills|jordan|cox|matt|parkinson|tom|helm|richard|gleeson|dan|lawrence|ollie|pope|ben|foakes|zak|crawley|dom|sibley|rory|burns|haseeb|hameed|daniel|lawrence|ollie|robinson|craig|overton|dom|bess|jack|leach|matt|parkinson|mason|crane|tom|helm|richard|gleeson|jordan|cox|tomalin|mills|david|willey|reece|topley|will|jacks|harry|brook|liam|livingstone|phil|salt|chris|woakes|mark|wood|moeen|ali|adil|rashid|dawid|malan|jonny|bairstow|sam|curran|tom|curran|jofra|archer|jason|roy|eoin|morgan|jos|buttler|ben|stokes|mitchell|starc|josh|hazlewood|pat|cummins|marcus|stoinis|glenn|maxwell|faf|du|plessis|ab|de|villiers|chris|gayle|dwayne|bravo|kieron|pollard|sunil|narine|andre|russell|rashid|khan|trent|boult|kane|williamson|david|warner|steve|smith|aaron|finch|mitch|marsh|marcus|stoinis|glenn|maxwell|daniel|sams|tim|david|josh|inglis|matthew|wade|alex|carey|pat|cummins|mitchell|starc|josh|hazlewood|kane|richardson|jason|behrendorff|daniel|worrall|nathan|ellis|sean|abbott|michael|neser|scott|boland|lance|morris|spencer|johnson|tanveer|sangha|todd|murphy|matthew|kuhnemann|mitchell|swepson|ashton|agar|adam|zampa|nathan|lyon|steven|smith|marnus|labuschagne|travis|head|cameron|green|marcus|harris|usman|khawaja|david|warner|matt|renshaw|joe|burns|will|pucovski|henry|hunt|tim|ward|jake|lehmann|daniel|hughes|kurtis|patterson|peter|handscomb|matt|wade|alex|carey|josh|inglis|jimmy|peirson|peter|nevill|sam|whiteman|ben|mcdermott|josh|philippe|harry|nielsen|baxter|holt|jake|fraser-mcgurk|oliver|davies|teague|wyllie|cooper|connolly|will|sutherland|aaron|hardie|matt|short|beau|webster|jordan|buckingham|will|prestwidge|jack|wildermuth|james|bazley|michael|neser|sean|abbott|daniel|sams|nathan|mcdermott|matt|kelly|joel|paris|andrew|tye|jason|behrendorff|daniel|worrall|kane|richardson|riley|meredith|scott|boland|lance|morris|spencer|johnson|tanveer|sangha|todd|murphy|matthew|kuhnemann|mitchell|swepson|ashton|agar|adam|zampa|nathan|lyon)\b/i
  ];
  
  // Check if name matches common overseas patterns
  return commonOverseasPatterns.some(pattern => pattern.test(playerName));
}

/**
 * Get form indicator based on rating
 */
function getFormIndicator(rating: number): string {
  if (rating >= 85) return 'Excellent';
  if (rating >= 70) return 'Good';
  if (rating >= 55) return 'Average';
  if (rating >= 40) return 'Below Average';
  return 'Poor';
}

/**
 * Update player card
 * Shows only: Name, Role, Base Price, Capped/Overseas, Rating (optional)
 * Hides internal pricing data (minPrice, maxPrice)
 */
function updatePlayerCard(player: Player | null) {
  if (!player) {
    playerInfoEl.innerHTML = '<p class="no-player">No player set</p>';
    return;
  }

  const isOverseas = isLikelyOverseas(player.name);
  const formIndicator = getFormIndicator(player.rating);

  playerInfoEl.innerHTML = `
    <div class="player-info-item">
      <label>Name</label>
      <span>${player.name}</span>
    </div>
    <div class="player-info-item">
      <label>Role</label>
      <span>${player.role}</span>
    </div>
    <div class="player-info-item">
      <label>Base Price</label>
      <span>${player.basePrice.toFixed(2)} Cr</span>
    </div>
    <div class="player-info-item">
      <label>Status</label>
      <span>${player.isCapped ? 'Capped' : 'Uncapped'}${isOverseas ? ' • Overseas' : ''}</span>
    </div>
    <div class="player-info-item">
      <label>Form</label>
      <span>${formIndicator} (${player.rating})</span>
    </div>
  `;
}

/**
 * Update auction status display
 */
function updateAuctionStatus(state: any) {
  currentBidEl.textContent = `${state.currentBid.toFixed(2)} Cr`;
  leadingTeamEl.textContent = state.leadingTeam?.name || '-';
  updateTimer(state.timer);
  updateStatusBadge(state.status);
}

/**
 * Update timer display
 */
function updateTimer(seconds: number) {
  timerEl.textContent = `${seconds}s`;
  if (seconds <= 5) {
    timerEl.style.color = '#dc2626';
  } else if (seconds <= 10) {
    timerEl.style.color = '#f59e0b';
  } else {
    timerEl.style.color = '#059669';
  }
}

/**
 * Update status badge
 */
function updateStatusBadge(status: AuctionStatus) {
  auctionStatusEl.textContent = status.toUpperCase();
  auctionStatusEl.className = 'status-badge ' + status.toLowerCase();
}

/**
 * Render teams list with manual bidding buttons
 */
function renderTeams() {
  if (!engine) return;

  const state = engine.getState();
  const leadingTeamId = state.leadingTeam?.id;
  const selectedTeamId = getSelectedTeamId();
  const canBid = state.status === AuctionStatus.BIDDING;
  const currentBid = state.currentBid || 0;

  teamsListEl.innerHTML = teams
    .map((team) => {
      const isLeading = team.id === leadingTeamId;
      const isSelected = team.id === selectedTeamId;
      const purseClass = team.purse < 10 ? 'purse-low' : 'purse-amount';
      const nextBid = canBid ? getNextBidAmount(currentBid) : 0;
      const canAfford = canBid && team.purse >= nextBid;
      
      // Build CSS classes for team card
      const cardClasses = ['team-card'];
      if (isLeading) cardClasses.push('leading');
      if (isSelected) cardClasses.push('user-selected');
      
      return `
        <div class="${cardClasses.join(' ')}">
          <div class="team-name-header">
            ${team.name}
            ${isSelected ? '<span class="user-team-badge">Your Team</span>' : ''}
          </div>
          <div class="team-stats">
            <div class="team-stat">
              <label>Purse:</label>
              <span class="${purseClass}">${team.purse.toFixed(2)} Cr</span>
            </div>
            <div class="team-stat">
              <label>Squad Size:</label>
              <span>${team.squad.length}</span>
            </div>
            <div class="team-stat">
              <label>Retained:</label>
              <span>${team.retainedPlayers.length}</span>
            </div>
            <div class="team-stat">
              <label>Aggression:</label>
              <span>${team.aggression}</span>
            </div>
          </div>
          ${canBid && isSelected ? `
            <div class="team-bid-section">
              <button 
                class="btn btn-bid" 
                data-team-id="${team.id}"
                ${!canAfford ? 'disabled' : ''}
                title="${canAfford ? `Bid ${nextBid.toFixed(2)} Cr` : `Insufficient purse. Need ${nextBid.toFixed(2)} Cr`}"
              >
                Bid ${nextBid.toFixed(2)} Cr
              </button>
            </div>
          ` : ''}
          ${canBid && !isSelected ? `
            <div class="team-bid-section">
              <div class="ai-bidding-indicator">AI Controlled</div>
            </div>
          ` : ''}
        </div>
      `;
    })
    .join('');

  // Attach event listeners to bid buttons (only for selected team)
  if (canBid) {
    teamsListEl.querySelectorAll('.btn-bid').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const teamId = (e.target as HTMLElement).getAttribute('data-team-id');
        const selectedTeamId = getSelectedTeamId();
        
        // Only allow manual bidding for selected team
        if (teamId && engine && teamId === selectedTeamId) {
          handleManualBid(teamId);
        } else if (teamId !== selectedTeamId) {
          alert('You can only bid manually for your selected team. Other teams are AI-controlled.');
        }
      });
    });
  }
}

/**
 * Get next bid amount using IPL increment logic
 */
function getNextBidAmount(currentBid: number): number {
  return getNextBid(currentBid);
}

/**
 * Initialize manual bidding controls
 * Only allows bidding for the user-selected team
 */
function initializeManualBidding() {
  const selectedTeamId = getSelectedTeamId();
  
  // Set team selector to selected team and disable it
  updateTeamSelector();
  if (selectedTeamId) {
    teamSelectorEl.value = selectedTeamId;
    teamSelectorEl.disabled = true; // Disable selector - user can only bid for their team
  }
  
  updateNextBidAmount();
  updateManualBidButton();
  
  // Add event listeners (though selector is disabled, keep for consistency)
  teamSelectorEl.addEventListener('change', () => {
    // Only allow selection of user's team
    const currentValue = teamSelectorEl.value;
    if (currentValue !== selectedTeamId) {
      teamSelectorEl.value = selectedTeamId || '';
      alert('You can only bid for your selected team.');
    }
    updateManualBidButton();
    updateNextBidAmount();
  });
  
  manualBidBtn.addEventListener('click', () => {
    if (selectedTeamId && engine) {
      handleManualBid(selectedTeamId);
    } else {
      alert('No team selected. Please select a team in the setup screen.');
    }
  });
}

/**
 * Update team selector dropdown
 */
function updateTeamSelector() {
  teamSelectorEl.innerHTML = '<option value="">-- Select Team --</option>';
  teams.forEach((team) => {
    const option = document.createElement('option');
    option.value = team.id;
    option.textContent = `${team.name} (${team.purse.toFixed(2)} Cr)`;
    teamSelectorEl.appendChild(option);
  });
}

/**
 * Update next bid amount display
 */
function updateNextBidAmount() {
  if (!engine) {
    nextBidAmountEl.textContent = '-';
    return;
  }

  const state = engine.getState();
  if (state.status === AuctionStatus.BIDDING && state.currentBid > 0) {
    const nextBid = getNextBidAmount(state.currentBid);
    nextBidAmountEl.textContent = `${nextBid.toFixed(2)} Cr`;
  } else {
    nextBidAmountEl.textContent = '-';
  }
}

/**
 * Update manual bid button state
 * Only enabled for user-selected team
 */
function updateManualBidButton() {
  if (!engine) {
    manualBidBtn.disabled = true;
    return;
  }

  const state = engine.getState();
  const selectedTeamId = getSelectedTeamId();
  
  // Only allow bidding for selected team
  if (!selectedTeamId) {
    manualBidBtn.disabled = true;
    manualBidBtn.textContent = 'No Team Selected';
    return;
  }
  
  if (state.status !== AuctionStatus.BIDDING) {
    manualBidBtn.disabled = true;
    manualBidBtn.textContent = 'Auction Not Active';
    return;
  }

  if (!state.currentPlayer) {
    manualBidBtn.disabled = true;
    manualBidBtn.textContent = 'No Player Set';
    return;
  }

  const selectedTeam = teams.find((t) => t.id === selectedTeamId);
  if (!selectedTeam) {
    manualBidBtn.disabled = true;
    manualBidBtn.textContent = 'Team Not Found';
    return;
  }

  const nextBid = getNextBidAmount(state.currentBid);
  const canAfford = selectedTeam.purse >= nextBid;

  manualBidBtn.disabled = !canAfford;
  
  // Update button text with next bid amount
  if (canAfford) {
    manualBidBtn.textContent = `Place Bid (${nextBid.toFixed(2)} Cr)`;
  } else {
    manualBidBtn.textContent = `Insufficient Purse (Need ${nextBid.toFixed(2)} Cr)`;
  }
}

/**
 * Handle manual bid placement
 * Only allows bidding for selected team
 */
function handleManualBid(teamId: string) {
  if (!engine) return;

  const selectedTeamId = getSelectedTeamId();
  
  // Only allow manual bidding for selected team
  if (teamId !== selectedTeamId) {
    alert('You can only bid manually for your selected team. Other teams are AI-controlled.');
    return;
  }

  try {
    engine.placeManualBid(teamId);
    // UI will update via event subscription
    // Update button state after bid
    setTimeout(() => {
      updateManualBidButton();
      updateNextBidAmount();
    }, 100);
  } catch (error: any) {
    alert(`Cannot place bid: ${error.message}`);
    console.error('Manual bid error:', error);
    updateManualBidButton();
  }
}

/**
 * Trigger AI bidding for all non-selected teams
 * Called during timer ticks to simulate AI bidding
 */
function triggerAIBidding(): void {
  if (!engine || !manager) return;

  const state = engine.getState();
  const selectedTeamId = getSelectedTeamId();

  // Only trigger AI bidding when auction is active
  if (state.status !== AuctionStatus.BIDDING || !state.currentPlayer) {
    return;
  }

  // Skip AI bidding if user's team is leading (give user time to react)
  if (state.leadingTeam?.id === selectedTeamId) {
    return;
  }

  // Process AI bids for all teams except the selected one
  const allTeams = engine.getTeams();
  const currentBid = state.currentBid || 0;
  const player = state.currentPlayer;

  allTeams.forEach((team) => {
    // Skip user's selected team
    if (team.id === selectedTeamId) {
      return;
    }

    // Skip if team is already leading
    if (team.id === state.leadingTeam?.id) {
      return;
    }

    // Check if team can bid using AI logic
    try {
      const aiResult = aiBidWithStopping(team, player, currentBid, 0, {
        useRatingBands: true,
      });

      if (aiResult.shouldBid && aiResult.bidAmount) {
        // Add some randomness to timing to make it more realistic
        const delay = Math.random() * 1000 + 500; // 500-1500ms delay
        
        setTimeout(() => {
          // Double-check state hasn't changed
          const currentState = engine?.getState();
          if (
            currentState?.status === AuctionStatus.BIDDING &&
            currentState?.currentPlayer?.id === player.id &&
            currentState?.currentBid === currentBid
          ) {
            try {
              engine?.placeManualBid(team.id, aiResult.bidAmount);
            } catch (error) {
              // Silently fail - team might not have enough purse or other constraint
              console.debug(`AI bid failed for ${team.name}:`, error);
            }
          }
        }, delay);
      }
    } catch (error) {
      // Silently handle errors
      console.debug(`AI bidding error for ${team.name}:`, error);
    }
  });
}

/**
 * Event handlers
 */
startBtn.addEventListener('click', async () => {
  if (!manager) {
    await initializeAuction();
  }
  if (manager) {
    manager.start();
    startBtn.disabled = true;
    nextBtn.disabled = false;
    pauseBtn.disabled = false;
  }
});

nextBtn.addEventListener('click', () => {
  if (manager) {
    manager.proceedToNextPlayer();
  }
});

pauseBtn.addEventListener('click', () => {
  if (manager) {
    manager.pause();
    pauseBtn.disabled = true;
    resumeBtn.disabled = false;
  }
});

resumeBtn.addEventListener('click', () => {
  if (manager) {
    manager.resume();
    pauseBtn.disabled = false;
    resumeBtn.disabled = true;
  }
});

/**
 * Show landing page
 */
function showLandingPage() {
  landingScreenEl.style.display = 'block';
  setupScreenEl.style.display = 'none';
  auctionScreenEl.style.display = 'none';
}

/**
 * Show setup page
 */
function showSetupPage() {
  landingScreenEl.style.display = 'none';
  setupScreenEl.style.display = 'block';
  auctionScreenEl.style.display = 'none';
}

/**
 * Show auction page
 */
function showAuctionPage() {
  landingScreenEl.style.display = 'none';
  setupScreenEl.style.display = 'none';
  auctionScreenEl.style.display = 'block';
}

// Initialize setup screen first, then auction
async function initializeApp() {
  // Show landing page initially
  showLandingPage();

  // Handle "Start Auction" button click
  startAuctionBtn.addEventListener('click', async () => {
    showSetupPage();
    
    // Initialize teams first (for auction engine later)
    teams = await initializeTeams();
    
    // Initialize setup screen (loads teams internally from central data file)
    await initializeSetupScreen((setupState: SetupState) => {
      // Setup complete - initialize auction with updated teams
      initializeAuctionWithSetup(setupState);
    });
  });
}

/**
 * Initialize auction after setup is complete
 */
async function initializeAuctionWithSetup(setupState: SetupState) {
  try {
    // Load all teams from central data file (not just the selected one)
    // This ensures all teams participate in the auction
    const { getInitialTeams } = await import('./teams');
    const allTeams = await getInitialTeams();
    
    // Update teams with retained players from setup state if available
    if (setupState.selectedTeam) {
      const selectedTeamIndex = allTeams.findIndex(t => t.id === setupState.selectedTeam!.id);
      if (selectedTeamIndex !== -1) {
        // Update the selected team with retained players and updated purse
        // Retained players are already in the squad from setup completion
        allTeams[selectedTeamIndex] = {
          ...setupState.selectedTeam,
          // Ensure all properties are copied
          squad: [...setupState.selectedTeam.squad], // Contains retained players
          retainedPlayers: [...setupState.selectedTeam.retainedPlayers],
          roleNeeds: { ...setupState.selectedTeam.roleNeeds },
          overseasCount: setupState.selectedTeam.overseasCount || 0,
        };
        
        // Validate: Ensure retained players are in squad
        const retainedIds = new Set(setupState.selectedTeam.retainedPlayers.map(p => p.id));
        const squadIds = new Set(setupState.selectedTeam.squad.map(p => p.id));
        retainedIds.forEach(id => {
          if (!squadIds.has(id)) {
            console.warn(`Retained player ${id} not found in squad. Adding...`);
            const retainedPlayer = setupState.selectedTeam.retainedPlayers.find(p => p.id === id);
            if (retainedPlayer) {
              allTeams[selectedTeamIndex].squad.push(retainedPlayer);
            }
          }
        });
      }
    }
    
    // Update global teams reference
    teams = allTeams;
    
    // Initialize auction engine with all teams
    engine = new AuctionEngine(teams, {
      timerDuration: 30,
      // bidIncrement is now handled by IPL-style increments (getNextBid)
    });
    
    // Set user-selected team in engine (for AI bidding exclusion)
    const selectedTeamId = getSelectedTeamId();
    if (selectedTeamId) {
      engine.setUserSelectedTeam(selectedTeamId);
    }

    // Load players and create manager
    const { loadPlayers } = await import('./auction-manager');
    const players = await loadPlayers();
    manager = new AuctionManager(engine, players, {
      autoProceed: false,
    });

    // Subscribe to events
    manager.subscribe(handleAuctionEvent);

    // Render teams
    renderTeams();
    
    // Initialize manual bidding controls
    initializeManualBidding();

    // Show auction page
    showAuctionPage();

    console.log('Auction initialized after setup');
  } catch (error) {
    console.error('Error initializing auction:', error);
    alert('Failed to initialize auction. Make sure players.ts exists.');
  }
}

// Initialize on load - wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
  });
} else {
  // DOM is already ready
  initializeApp();
}

