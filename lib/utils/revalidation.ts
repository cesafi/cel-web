import { revalidatePath } from 'next/cache';

/**
 * Centralized revalidation utility for consistent cache invalidation
 */
export class RevalidationHelper {
    /**
     * Revalidate all admin dashboard routes
     */
    static revalidateAdminDashboard() {
        revalidatePath('/admin');
    }

    /**
     * Revalidate all head-writer dashboard routes
     */
    static revalidateHeadWriterDashboard() {
        revalidatePath('/head-writer');
    }

    /**
     * Revalidate all writer dashboard routes
     */
    static revalidateWriterDashboard() {
        revalidatePath('/writer');
    }

    /**
     * Revalidate all league operator dashboard routes
     */
    static revalidateLeagueOperatorDashboard() {
        revalidatePath('/league-operator');
    }

    /**
     * Revalidate sports-related routes
     */
    static revalidateSports() {
        revalidatePath('/admin/sports');
        this.revalidateAdminDashboard(); // Sports count affects dashboard stats

        // Public pages that display sports
        revalidatePath('/schedule'); // Schedule page shows sports categories
    }

    /**
     * Revalidate schools-related routes
     */
    static revalidateSchools() {
        revalidatePath('/admin/schools');
        revalidatePath('/admin/school-teams');
        this.revalidateAdminDashboard(); // Schools count affects dashboard stats

        // Public pages that display schools
        revalidatePath('/'); // Landing page shows schools carousel
        revalidatePath('/schools'); // Schools page shows all schools
    }

    /**
     * Comprehensive revalidation for schools teams operations
     * This should be called when a school team is created, updated, or deleted
     */
    static revalidateSchoolsTeamsOperation() {
        // Revalidate schools and seasons (direct relationships)
        this.revalidateSchools();
        this.revalidateSeasons();
        
        // Revalidate matches since teams are used in match participants
        this.revalidateMatches();
        this.revalidateMatchParticipants();
        
        // Revalidate league stage since teams participate in stages
        this.revalidateLeagueStage();
        
        // Revalidate dashboards since team operations affect stats
        this.revalidateAdminDashboard();
        this.revalidateLeagueOperatorDashboard();
        
        // Revalidate specific school team routes
        revalidatePath('/admin/school-teams');
        revalidatePath('/admin/schools');
    }

    /**
     * Revalidate seasons-related routes
     */
    static revalidateSeasons() {
        revalidatePath('/admin/seasons');
        revalidatePath('/admin/school-teams');
        revalidatePath('/admin/league-stage');
        this.revalidateAdminDashboard(); // Seasons count affects dashboard stats

        // Public pages that display season-related data
        revalidatePath('/schedule'); // Schedule page shows season matches
        revalidatePath('/volunteers'); // Volunteers page shows seasonal data
    }

    /**
     * Revalidate matches-related routes
     */
    static revalidateMatches() {
        revalidatePath('/admin/matches');
        revalidatePath('/league-operator');
        revalidatePath('/league-operator/matches');
        this.revalidateAdminDashboard(); // Recent matches affect dashboard

        // Public pages that display matches
        revalidatePath('/'); // Landing page shows upcoming matches
        revalidatePath('/schedule'); // Schedule page shows all matches
    }

    /**
     * Comprehensive revalidation for match deletion
     * This should be called when a match is deleted to ensure all related data is refreshed
     */
    static revalidateMatchDeletion() {
        // Revalidate all match-related routes
        this.revalidateMatches();
        this.revalidateMatchParticipants();
        this.revalidateGames();
        this.revalidateGameScores();
        
        // Revalidate dashboards since match deletion affects stats and recent activity
        this.revalidateLeagueOperatorDashboard();
        this.revalidateAdminDashboard();
        
        // Revalidate specific match detail pages (they should redirect or show 404)
        revalidatePath('/admin/matches/[id]', 'page');
        revalidatePath('/league-operator/matches/[id]', 'page');
    }

    /**
     * Revalidate articles-related routes
     */
    static revalidateArticles() {
        revalidatePath('/admin/articles');
        revalidatePath('/head-writer');
        revalidatePath('/writer');
        this.revalidateAdminDashboard(); // Articles count affects dashboard stats

        // Public pages that display articles
        revalidatePath('/'); // Landing page shows latest articles
        revalidatePath('/news'); // News page shows articles
        revalidatePath('/about-us'); // About page shows articles
    }

    /**
     * Revalidate volunteers-related routes
     */
    static revalidateVolunteers() {
        revalidatePath('/admin/volunteers');
        this.revalidateAdminDashboard(); // Volunteers count affects dashboard stats

        // Public pages that display volunteers
        revalidatePath('/volunteers'); // Volunteers page shows all volunteers
    }

    /**
     * Revalidate sponsors-related routes
     */
    static revalidateSponsors() {
        revalidatePath('/admin/sponsors');
        this.revalidateAdminDashboard(); // Sponsors count affects dashboard stats

        // Public pages that display sponsors
        revalidatePath('/'); // Landing page shows sponsors carousel
        revalidatePath('/partners'); // Partners page (when implemented)
    }

    /**
     * Revalidate timeline-related routes
     */
    static revalidateTimeline() {
        revalidatePath('/admin/timeline');
        revalidatePath('/head-writer/timeline');
        revalidatePath('/about-us'); // Timeline appears on about page
    }

    /**
     * Revalidate league stage-related routes
     */
    static revalidateLeagueStage() {
        revalidatePath('/admin/league-stage');
        revalidatePath('/league-operator');
    }

    /**
     * Revalidate FAQ-related routes
     */
    static revalidateFAQ() {
        revalidatePath('/admin/faq');
        revalidatePath('/head-writer/faq');

        // Public pages that display FAQ
        revalidatePath('/about-us'); // About page shows FAQ
    }

    /**
     * Revalidate game scores and related routes
     */
    static revalidateGameScores() {
        revalidatePath('/admin/matches');
        revalidatePath('/league-operator');
        this.revalidateAdminDashboard(); // Game scores affect recent activity

        // Public pages that display game scores
        revalidatePath('/'); // Landing page shows recent match results
        revalidatePath('/schedule'); // Schedule page shows match scores
    }

    /**
     * Revalidate photo gallery-related routes
     */
    static revalidatePhotoGallery() {
        revalidatePath('/admin/photo-gallery');

        // Public pages that display photo gallery
        revalidatePath('/'); // Landing page shows photo gallery
        revalidatePath('/about-us'); // About page might show photo gallery
    }

    /**
     * Revalidate hero section-related routes
     */
    static revalidateHeroSection() {
        revalidatePath('/admin/hero-section');
        revalidatePath('/'); // Hero section appears on home page
    }

    /**
     * Revalidate games-related routes
     */
    static revalidateGames() {
        revalidatePath('/admin/matches'); // Games are part of matches
        revalidatePath('/league-operator');
        this.revalidateAdminDashboard(); // Games affect recent activity

        // Public pages that display games
        revalidatePath('/'); // Landing page shows upcoming games
        revalidatePath('/schedule'); // Schedule page shows all games
    }

    /**
     * Revalidate match participants-related routes
     */
    static revalidateMatchParticipants() {
        revalidatePath('/admin/matches');
        revalidatePath('/league-operator');
        this.revalidateAdminDashboard(); // Match participants affect dashboard

        // Public pages that display match participants
        revalidatePath('/'); // Landing page shows upcoming matches with participants
        revalidatePath('/schedule'); // Schedule page shows match participants
    }

    /**
     * Revalidate departments-related routes
     */
    static revalidateDepartments() {
        revalidatePath('/admin/departments');
        this.revalidateAdminDashboard(); // Departments count affects dashboard stats

        // Public pages that display departments
        revalidatePath('/volunteers'); // Volunteers page shows departments
    }

    /**
     * Revalidate all dashboard routes (use sparingly)
     */
    static revalidateAllDashboards() {
        this.revalidateAdminDashboard();
        this.revalidateHeadWriterDashboard();
        this.revalidateWriterDashboard();
        this.revalidateLeagueOperatorDashboard();
    }
}