KAMPALA MART V69 - THE REAL FIX
ROOT CAUSE FOUND: Shop code had var base="RENDER_ORIGIN" - a placeholder, not a real address.
Every cloud save/load did fetch("RENDER_ORIGIN/rest/v1/km_data") which fails, so shop fell back to this-browser-only localStorage.
V69 replaces ALL RENDER_ORIGIN with window.location.origin (your real Render URL), and server unifies /api/data + /rest/v1/km_data into SAME storage.
ALSO: You have TWO Render sites: kampalamart-uga.onrender.com AND kampalamartug00.onrender.com - they are DIFFERENT servers.
PICK ONE and use only that one from now on. Recommended: keep kampalamart-uga.onrender.com, delete/suspend kampalamartug00.onrender.com, or vice versa - but do NOT use both.
Deploy V69 to the ONE you keep: GitHub repo for that service -> delete old -> upload ALL files -> Commit -> Manual Deploy -> Live (must say V69)
TEST: Browser A upload -> wait 5s -> Browser B hard refresh Ctrl+Shift+R -> must show. Owner Panel change -> Save -> hard refresh other browser -> must stay.
