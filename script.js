// 1. CHOOSE YOUR ADMIN PASSWORD HERE
const ADMIN_PASSWORD = "efootball2026";

// 2. CONNECT TO SUPABASE DATA STREAM
const SUPABASE_URL = "https://hvorooldyswqcontmlwi.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_pKzOziQPWdmjdJWFKMgF4Q_0tGpm81S";

const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let tournamentData = { teams: {}, matches: [] };
let isAdmin = false;

// Fetch fresh live data from cloud database
async function loadCloudData() {
    try {
        const { data, error } = await supabaseClient
            .from('tournament')
            .select('*')
            .eq('id', 1)
            .single();

        if (error) throw error;

        if (data) {
            tournamentData.teams = data.teams || {};
            tournamentData.matches = data.matches || [];
            renderLeagueTable();
            renderMatches();
        }
    } catch (error) {
        console.error("Error fetching tournament data:", error);
    }
}

// Navigation Tabs
function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.getElementById(tabName).classList.add('active');
}

// Admin Verification
function checkAdminPassword() {
    const password = prompt("Enter Admin Password:");
    if (password === ADMIN_PASSWORD) {
        isAdmin = true;
        document.body.classList.add('admin-mode');
        alert("Admin Access Granted!");
        renderMatches();
    } else {
        alert("Incorrect Password!");
    }
}

// Render League Standings
function renderLeagueTable() {
    const tableBody = document.querySelector("#league-table tbody");
    if (!tableBody) return;
    tableBody.innerHTML = "";

    // Convert teams object to sorted array
    const sortedTeams = Object.values(tournamentData.teams).sort((a, b) => b.pts - a.pts || b.gd - a.gd);

    sortedTeams.forEach((team, index) => {
        tableBody.innerHTML += `
            <tr>
                <td>${index + 1}</td>
                <td><strong>${team.name}</strong></td>
                <td>${team.p}</td>
                <td>${team.w}</td>
                <td>${team.d}</td>
                <td>${team.l}</td>
                <td>${team.gd}</td>
                <td><strong>${team.pts}</strong></td>
            </tr>
        `;
    });
}

// Render Matches
function renderMatches() {
    const matchContainer = document.getElementById("matches-container");
    if (!matchContainer) return;
    matchContainer.innerHTML = "";

    tournamentData.matches.forEach((match) => {
        matchContainer.innerHTML += `
            <div class="match-card">
                <div class="team-row"><span>${match.team1}</span> <strong>${match.score1 ?? '-'}</strong></div>
                <div class="team-row"><span>${match.team2}</span> <strong>${match.score2 ?? '-'}</strong></div>
                ${isAdmin ? `<button onclick="editMatchScore(${match.id})">Update Score</button>` : ''}
            </div>
        `;
    });
}

// Initialize on page load
window.onload = loadCloudData;