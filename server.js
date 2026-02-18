require('dotenv').config();
const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.static('public'));
app.use(express.json());

/* ==========================================================================
   ============================= CONFIGURATION ==============================
   ========================================================================== */

// Server Port
const PORT = process.env.PORT || 3000;

// Jellyfin Configuration
const JELLYFIN_URL = process.env.JELLYFIN_URL;
const JELLYFIN_API_KEY = process.env.JELLYFIN_API_KEY;

// TMDB Configuration (https://www.themoviedb.org/)
const TMDB_API_KEY = process.env.TMDB_API_KEY;

// Cleanup Configuration
// Keywords that should be removed from the title before searching
// Load keywords from .env or use a basic fallback
const junkPattern = process.env.JUNK_KEYWORDS || 'edition|bluray|dvd';
const JUNK_REGEX = new RegExp(junkPattern, 'gi');

/* ==========================================================================
   =========================== HELPER FUNCTIONS =============================
   ========================================================================== */

/**
 * Cleans the movie title to improve search results.
 * 1. Removes text in brackets [] or ()
 * 2. Removes defined marketing keywords (JUNK_REGEX)
 * 3. Trims whitespace and trailing dashes
 */
function cleanTitle(rawTitle) {
    // Take everything before first '[' or '('
    let cleanStep1 = rawTitle.split(' [')[0].split(' (')[0];

    return cleanStep1
        .replace(JUNK_REGEX, '')
        .trim()
        .replace(/\s*-\s*$/, '')
        .trim();
}

/* ==========================================================================
   ================================ ROUTES ==================================
   ========================================================================== */

// ROUTE 1: Barcode Check
app.post('/check-barcode', async (req, res) => {
    const { barcode } = req.body;
    console.log(`📡 Scanning Barcode: ${barcode}`);

    try {
        // 1. UPC Lookup
        const upcResponse = await axios.get(`https://api.upcitemdb.com/prod/trial/lookup?upc=${barcode}`);

        if (upcResponse.data.total === 0) {
            console.log("   ❌ Barcode not found in UPC DB.");
            return res.json({ found: false });
        }

        let rawTitle = upcResponse.data.items[0].title;
        let searchTitle = cleanTitle(rawTitle);
        console.log(`   ✨ Cleaned search title: "${searchTitle}"`);

        // Proceed to search logic
        await performSearch(searchTitle, res);

    } catch (error) {
        console.error("Global Error:", error.message);
        res.status(500).json({ error: "Server Error" });
    }
});

// ROUTE 2: Manual Title Check
app.post('/check-title', async (req, res) => {
    const { title } = req.body;
    console.log(`📝 Manual Title Search: ${title}`);

    // Proceed directly to search logic
    await performSearch(title, res);
});

// ROUTE 3: Library Search (Fulltext)
app.post('/search-collection', async (req, res) => {
    let { term } = req.body;
    if (term) term = term.trim();
    console.log(`📚 Searching Collection for: "${term}"`);

    try {
        // Query Jellyfin directly for what currently exists
        const jellyResponse = await axios.get(`${JELLYFIN_URL}/Items`, {
            params: {
                SearchTerm: term,
                IncludeItemTypes: 'Movie',
                Recursive: true,
                api_key: JELLYFIN_API_KEY
            }
        });

        // Map results for frontend
        const items = jellyResponse.data.Items.map(item => ({
            title: item.Name,
            year: item.ProductionYear,
            id: item.Id
        }));

        console.log(`   ✅ ${items.length} items found.`);
        res.json(items);

    } catch (error) {
        console.error("Library Search Error:", error.message);
        res.status(500).json({ error: "Jellyfin Search Failed" });
    }
});

/* ==========================================================================
   =========================== CENTRAL SEARCH LOGIC =========================
   ========================================================================== */

/**
 * Core Logic:
 * 1. Normalize Title via TMDB (English -> German)
 * 2. Search in Jellyfin
 */
async function performSearch(searchString, res) {
    let germanTitle = searchString;

    try {
        // 1. TMDB: Normalize and Translate
        if (TMDB_API_KEY) {
            try {
                // Search for the movie (language agnostic/english default)
                const searchRes = await axios.get(`https://api.themoviedb.org/3/search/movie`, {
                    params: { api_key: TMDB_API_KEY, query: searchString }
                });

                if (searchRes.data.results.length > 0) {
                    let bestMatch = searchRes.data.results[0];

                    // Check for exact match to prioritize
                    const exactMatch = searchRes.data.results.find(
                        movie => movie.title.toLowerCase() === searchString.toLowerCase()
                    );
                    if (exactMatch) bestMatch = exactMatch;

                    // Fetch German details for this ID
                    const movieDetails = await axios.get(`https://api.themoviedb.org/3/movie/${bestMatch.id}`, {
                        params: { api_key: TMDB_API_KEY, language: process.env.TMDB_LANG || 'en-US' }
                    });

                    germanTitle = movieDetails.data.title;
                    console.log(`   🇩🇪 Title (TMDB): "${germanTitle}"`);
                }
            } catch (e) {
                console.log("   ⚠️ TMDB Error/Timeout, using original search string.");
            }
        }

        // 2. Jellyfin Search
        const jellyResponse = await axios.get(`${JELLYFIN_URL}/Items`, {
            params: {
                SearchTerm: germanTitle,
                IncludeItemTypes: 'Movie',
                Recursive: true,
                api_key: JELLYFIN_API_KEY
            }
        });

        const items = jellyResponse.data.Items;

        if (items.length > 0) {
            res.json({
                found: true,
                inCollection: true,
                title: germanTitle,
                match: items[0].Name,
                year: items[0].ProductionYear
            });
            console.log(`   ✅ Found: "${items[0].Name}"`);
        } else {
            res.json({
                found: true,
                inCollection: false,
                title: germanTitle
            });
            console.log(`   ❌ Missing: "${germanTitle}"`);
        }
    } catch (error) {
        console.error("Search Logic Error:", error.message);
        res.status(500).json({ error: "Server Error" });
    }
}

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 App running on port ${PORT}`);
});
