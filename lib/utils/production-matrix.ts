import { BracketMatch } from '@/lib/types/standings';

/**
 * Utility to generate a 2D matrix (array of string arrays) that mimics
 * the CEL S4_GFX - MLBB PLAYOFFS.csv layout precisely.
 */
export function generateProductionMatrix(bracket: BracketMatch[], stageName: string): string[][] {
    // 1. Initialize result grid (approx 30 rows x 30 columns)
    const ROWS = 26;
    const COLS = 26;
    const grid: string[][] = Array.from({ length: ROWS }, () => Array(COLS).fill(''));

    // 2. Static Header Labels (Exact cell positions from template)
    grid[0][0] = stageName.split(' ')[0] || 'CEL'; // e.g. "MLBB"
    grid[3][4] = 'Upper Bracket Quarterfinals';
    grid[14][4] = 'Lower Bracket Quarterfinals';
    grid[5][15] = 'Upper Bracket Semifinals';
    grid[15][10] = 'Lower Bracket Semifinals';
    grid[15][16] = 'Lower Bracket Finals';
    grid[10][21] = 'Grand Final';

    // Helper to find match by Round/Position
    const findMatch = (r: number, p: number) => bracket.find(m => m.round === r && m.position === p);

    // Helper to populate a Match Slot (2 rows)
    const paintMatch = (
        match: BracketMatch | undefined, 
        r1: number, 
        c1: number, 
        label?: string, 
        labelPos?: { r: number, c: number }, 
        swapNameAbbr: boolean = false,
        t1Placeholder: string = 'TBD',
        t2Placeholder: string = 'TBD'
    ) => {
        const team1 = match?.team1;
        const team2 = match?.team2;

        const setRow = (r: number, team: any, fallbackName: string) => {
            const abbrev = team?.school_abbreviation || 'TBD';
            grid[r][c1] = getLocalLogoPath(abbrev);
            
            if (swapNameAbbr) {
                grid[r][c1 + 1] = abbrev;
                grid[r][c1 + 2] = team?.team_name || fallbackName;
            } else {
                grid[r][c1 + 1] = team?.team_name || fallbackName;
                grid[r][c1 + 2] = abbrev;
            }
            grid[r][c1 + 3] = String(team?.score ?? 0);
        };

        setRow(r1, team1, t1Placeholder);
        setRow(r1 + 1, team2, t2Placeholder);

        // Optional Match Label
        if (label && labelPos) {
            grid[labelPos.r][labelPos.c] = label;
        }
    };

    // 3. Map Data Points (0-indexed coordinates)

    // Match 1 (UB QF 1): Row 4-5, Col 3-6 (D-G)
    paintMatch(findMatch(1, 1), 4, 3, 'Match 1', { r: 6, c: 5 }, false, 'MATCH 1 A', 'MATCH 1 B');

    // Match 2 (UB QF 2): Row 9-10, Col 3-6
    paintMatch(findMatch(1, 2), 9, 3, 'Match 2', { r: 11, c: 5 }, false, 'MATCH 2 A', 'MATCH 2 B');

    // Match 3 (LB QF 1): Row 16-17, Col 3-6
    paintMatch(findMatch(1, 3), 16, 3, 'Match 3', { r: 18, c: 5 }, false, 'TBD', 'MATCH 1 LOSER');

    // Match 4 (LB QF 2): Row 21-22, Col 3-6
    paintMatch(findMatch(1, 4), 21, 3, 'Match 4', { r: 23, c: 5 }, false, 'TBD', 'MATCH 2 LOSER');

    // Match 6 (UB Semi): Row 7-8, Col 15-18 (P-S)
    paintMatch(findMatch(2, 1), 7, 15, 'Match 6', { r: 9, c: 17 }, true, 'MATCH 1 WINNER', 'MATCH 2 WINNER');

    // Match 5 (LB SF): Row 18-19, Col 10-13 (K-N)
    paintMatch(findMatch(2, 2), 18, 10, 'Match 5', { r: 20, c: 11 }, true, 'MATCH 3 WINNER', 'MATCH 4 WINNER');

    // Match 7 (LB Final): Row 18-19, Col 16-19 (Q-T)
    paintMatch(findMatch(3, 2), 18, 16, 'Match 7', { r: 20, c: 17 }, true, 'MATCH 5 WINNER', 'MATCH 6 LOSER');

    // Match 8 (Grand Final): Row 12-13, Col 21-24 (V-Y)
    paintMatch(findMatch(4, 1), 12, 21, 'Match 8', { r: 14, c: 22 }, true, 'MATCH 6 WINNER', 'MATCH 7 WINNER');

    // 4. Missing Footer Labels
    grid[24][8] = 'TOP 1/2 PLAY-INS';

    return grid;
}

/** Helper to generate the local windows path as requested */
function getLocalLogoPath(abbrev: string | null | undefined): string {
    if (!abbrev || abbrev === 'TBD' || abbrev === '#N/A') return 'C:\\Users\\CESAFI\\Desktop\\CEL S4\\IMAGES\\SCHOOL_LOGOS\\TBD.png';
    // Handle the special case in sample: Row 22 has a nested .png.png bug in sample, we ignore it.
    return `C:\\Users\\CESAFI\\Desktop\\CEL S4\\IMAGES\\SCHOOL_LOGOS\\${abbrev.toUpperCase()}.png`;
}

/** Convert Matrix to CSV string */
export function matrixToCsv(matrix: string[][]): string {
    return matrix.map(row => 
        row.map(cell => {
            const str = String(cell || '');
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        }).join(',')
    ).join('\n');
}
