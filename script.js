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
    const targetTab = document.getElementById(tabName);
    if (targetTab) targetTab.classList.add('active');
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

// Edit Match Score and Save to Supabase
async function editMatchScore(matchId) {
    const match = tournamentData.matches.find(m => m.id === matchId);
    if (!match) return;

    const score1 = prompt(`Enter score for ${match.team1}:`, match.score1 ?? "");
    const score2 = prompt(`Enter score for ${match.team2}:`, match.score2 ?? "");

    if (score1 === null || score2 === null || score1 === "" || score2 === "") return;

    // Update locally
    match.score1 = parseInt(score1);
    match.score2 = parseInt(score2);

    // Recalculate table standings based on new score
    recalculateTable();

    // Save changes to cloud database
    try {
        const { error } = await supabaseClient
            .from('tournament')
            .update({ 
                matches: tournamentData.matches,
                teams: tournamentData.teams
            })
            .eq('id', 1);

        if (error) throw error;

        alert("Scores successfully updated online!");
        renderMatches();
        renderLeagueTable();
    } catch (error) {
        console.error("Error saving data:", error);
        alert("Failed to save data online.");
    }
}

// Simple Standings Recalculation Helper
function recalculateTable() {
    // Reset stats
    Object.keys(tournamentData.teams).forEach(key => {
        tournamentData.teams[key].p = 0;
        tournamentData.teams[key].w = 0;
        tournamentData.teams[key].d = 0;
        tournamentData.teams[key].l = 0;
        tournamentData.teams[key].gd = 0;
        tournamentData.teams[key].pts = 0;
    });

    // Compute from matches
    tournamentData.matches.forEach(m => {
        if (m.score1 !== null && m.score2 !== null) {
            const t1 = tournamentData.teams[m.team1];
            const t2 = tournamentData.teams[m.team2];
            
            if (t1 && t2) {
                t1.p++; t2.p++;
                t1.gd += (m.score1 - m.score2);
                t2.gd += (m.score2 - m.score1);
                
                if (m.score1 > m.score2) { t1.w++; t1.pts += 3; t2.l++; }
                else if (m.score2 > m.score1) { t2.w++; t2.pts += 3; t1.l++; }
                else { t1.d++; t1.pts += 1; t2.d++; t2.pts += 1; }
            }
        }
    });
}

// Initialize on page load
window.onload = loadCloudData;