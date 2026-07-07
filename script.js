// 1. CHOOSE YOUR ADMIN PASSWORD HERE
const ADMIN_PASSWORD = "efootball2026"; 

// 2. CONNECT TO SUPABASE DATA STREAM (Replace these with your exact keys from Supabase)
const SUPABASE_URL = "YOUR_SUPABASE_URL"; 
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";

// Initialize the Supabase client safely for GitHub Pages
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let tournamentData = { teams: {}, matches: [] };

// Fetch fresh live data from cloud database
async function loadCloudData() {
    const { data, error } = await supabaseClient
        .from('tournament')
        .select('*')
        .eq('id', 1)
        .single();
    
    if (error) {
        console.error("Error fetching tournament data:", error);
        return;
    }
    
    tournamentData = data;
    renderMatches();
    calculateTable();
}

// Listen for live updates in real-time
supabaseClient
    .channel('schema-db-changes')
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tournament' }, (payload) => {
        tournamentData = payload.new;
        renderMatches();
        calculateTable();
    })
    .subscribe();

// Maintain Admin Session Logged In Check
window.addEventListener('DOMContentLoaded', () => {
    if (sessionStorage.getItem('isAdminLoggedIn') === 'true') {
        document.getElementById('admin-sec').style.display = 'block';
    }
    loadCloudData();
});

// Switch view tabs (Slider Effect)
function switchTab(tab) {
    document.querySelectorAll('.slide').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    
    if (tab === 'matches') {
        document.getElementById('matches-slide').classList.add('active');
        if (event) event.currentTarget.classList.add('active');
    } else {
        document.getElementById('table-slide').classList.add('active');
        if (event) event.currentTarget.classList.add('active');
    }
}

// Render Matches View
function renderMatches() {
    const matchList = document.getElementById('match-list');
    const matchSelect = document.getElementById('match-select');
    
    if (!matchList || !tournamentData.matches) return;
    matchList.innerHTML = '';
    matchSelect.innerHTML = '';

    tournamentData.matches.forEach(match => {
        const s1 = match.score1 !== null ? match.score1 : "-";
        const s2 = match.score2 !== null ? match.score2 : "-";
        
        matchList.innerHTML += `
            <div class="match-card">
                <span class="team">${match.team1}</span>
                <span class="score">${s1} : ${s2}</span>
                <span class="team right">${match.team2}</span>
            </div>
        `;

        matchSelect.innerHTML += `<option value="${match.id}">${match.team1} vs ${match.team2}</option>`;
    });
}

// Calculate Standings Table Dynamically
function calculateTable() {
    if (!tournamentData.teams || !tournamentData.matches) return;
    
    // Reset stats to recount fresh
    for (let team in tournamentData.teams) {
        tournamentData.teams[team] = { p: 0, w: 0, d: 0, l: 0, pts: 0 };
    }

    // Process every played match
    tournamentData.matches.forEach(m => {
        if (m.score1 !== null && m.score2 !== null) {
            tournamentData.teams[m.team1].p++;
            tournamentData.teams[m.team2].p++;

            if (m.score1 > m.score2) {
                tournamentData.teams[m.team1].w++;
                tournamentData.teams[m.team1].pts += 3;
                tournamentData.teams[m.team2].l++;
            } else if (m.score1 < m.score2) {
                tournamentData.teams[m.team2].w++;
                tournamentData.teams[m.team2].pts += 3;
                tournamentData.teams[m.team1].l++;
            } else {
                tournamentData.teams[m.team1].d++;
                tournamentData.teams[m.team1].pts += 1;
                tournamentData.teams[m.team2].d++;
                tournamentData.teams[m.team2].pts += 1;
            }
        }
    });

    // Sort teams by points descending
    const sortedTeams = Object.entries(tournamentData.teams).sort((a, b) => b[1].pts - a[1].pts);
    
    const tableBody = document.getElementById('table-body');
    if (!tableBody) return;
    tableBody.innerHTML = '';
    
    sortedTeams.forEach(([teamName, stats], index) => {
        tableBody.innerHTML += `
            <tr>
                <td>${index + 1}</td>
                <td style="text-align:left;">${teamName}</td>
                <td>${stats.p}</td>
                <td>${stats.w}</td>
                <td>${stats.d}</td>
                <td>${stats.l}</td>
                <td><strong>${stats.pts}</strong></td>
            </tr>
        `;
    });
}

// Admin Score Submission directly to Cloud
async function updateScore() {
    const matchId = parseInt(document.getElementById('match-select').value);
    const score1 = document.getElementById('score1').value;
    const score2 = document.getElementById('score2').value;

    if (score1 === '' || score2 === '') {
        alert("Please enter scores for both teams!");
        return;
    }

    const match = tournamentData.matches.find(m => m.id === matchId);
    match.score1 = parseInt(score1);
    match.score2 = parseInt(score2);

    // Update cloud row
    const { error } = await supabaseClient
        .from('tournament')
        .update({ matches: tournamentData.matches })
        .eq('id', 1);

    if (error) {
        alert("Error saving score online!");
        console.error(error);
    } else {
        alert("Score updated successfully on the cloud!");
    }
}

// Hidden Password Verification
function checkAdminPassword() {
    const panel = document.getElementById('admin-sec');
    if (panel.style.display === 'block') {
        logoutAdmin();
        return;
    }

    const userInput = prompt("Enter Admin Password:");
    
    if (userInput === ADMIN_PASSWORD) {
        panel.style.display = 'block';
        sessionStorage.setItem('isAdminLoggedIn', 'true');
        panel.scrollIntoView({ behavior: 'smooth' });
    } else if (userInput !== null) {
        alert("Incorrect password!");
    }
}

// Admin Panel Logout
function logoutAdmin() {
    document.getElementById('admin-sec').style.display = 'none';
    sessionStorage.removeItem('isAdminLoggedIn');
}
