// 1. CHOOSE YOUR ADMIN PASSWORD HERE
const ADMIN_PASSWORD = "efootball2026";

// 2. CONNECT TO SUPABASE DATA STREAM
const SUPABASE_URL = "https://hvorooldyswqcontmlwi.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_pKzOziQPWdmjdJWFKMgF4Q_0tGpm81S";

// Initialize the Supabase client safely for GitHub Pages
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let tournamentData = { teams: {}, matches: [] };

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