import { Hono } from 'hono';
import { supabase } from '@vimovies/db';
import { ok, serverError } from '@vimovies/utils';

const router = new Hono();

// Get dashboard statistics
router.get('/stats', async (c) => {
  try {
    // Get total movies
    const { count: totalMovies, error: moviesError } = await supabase
      .from('media')
      .select('*', { count: 'exact', head: true })
      .eq('media_type', 'movie');

    if (moviesError) throw moviesError;

    // Get movies with noindex
    const { count: noindexMovies, error: noindexError } = await supabase
      .from('media')
      .select('*', { count: 'exact', head: true })
      .eq('media_type', 'movie')
      .eq('noindex', true);

    if (noindexError) throw noindexError;

    // Get total people
    const { count: totalPeople, error: peopleError } = await supabase
      .from('people')
      .select('*', { count: 'exact', head: true });

    if (peopleError) throw peopleError;

    // Get movies added this week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const { count: moviesThisWeek, error: weekError } = await supabase
      .from('media')
      .select('*', { count: 'exact', head: true })
      .eq('media_type', 'movie')
      .gte('created_at', oneWeekAgo.toISOString());

    if (weekError) throw weekError;

    // Get people added this month
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const { count: peopleThisMonth, error: monthError } = await supabase
      .from('people')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', oneMonthAgo.toISOString());

    if (monthError) throw monthError;

    // TODO: Get monthly visits from analytics system
    // For now, return a placeholder
    const monthlyVisits = 0; // Will be replaced with real analytics data

    const stats = {
      totalMovies: totalMovies || 0,
      monthlyVisits,
      totalPeople: totalPeople || 0,
      noindexMovies: noindexMovies || 0,
      moviesDelta: moviesThisWeek ? `+${moviesThisWeek} esta semana` : '+0 esta semana',
      visitsDelta: '0% vs mes anterior', // Will be calculated from analytics
      peopleDelta: peopleThisMonth ? `+${peopleThisMonth} este mes` : '+0 este mes',
    };

    return ok(c, stats);
  } catch (error) {
    console.error('[Dashboard] Error fetching stats:', error);
    return serverError(c, error instanceof Error ? error.message : 'Unknown error');
  }
});

// Get recent activity
router.get('/activity', async (c) => {
  try {
    const activities: any[] = [];

    // Get recent movies synced (updated in last 24 hours)
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const { data: recentSyncs, error: syncsError } = await supabase
      .from('media')
      .select('id, title_es, title_en, tmdb_last_synced_at, updated_at')
      .eq('media_type', 'movie')
      .not('tmdb_last_synced_at', 'is', null)
      .gte('tmdb_last_synced_at', oneDayAgo.toISOString())
      .order('tmdb_last_synced_at', { ascending: false })
      .limit(10);

    if (syncsError) throw syncsError;

    recentSyncs?.forEach((movie) => {
      activities.push({
        id: movie.id,
        type: 'sync',
        title: movie.title_es || movie.title_en || 'Unknown',
        details: 'Sync completado — sincronización TMDB actualizada',
        time: formatRelativeTime(movie.tmdb_last_synced_at!),
        timestamp: new Date(movie.tmdb_last_synced_at!).getTime(),
      });
    });

    // Get recent movies created (new additions)
    const { data: newMovies, error: newMoviesError } = await supabase
      .from('media')
      .select('id, title_es, title_en, created_at')
      .eq('media_type', 'movie')
      .gte('created_at', oneDayAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(5);

    if (newMoviesError) throw newMoviesError;

    newMovies?.forEach((movie) => {
      activities.push({
        id: `new-${movie.id}`,
        type: 'new',
        title: movie.title_es || movie.title_en || 'Unknown',
        details: 'Nueva película añadida',
        time: formatRelativeTime(movie.created_at),
        timestamp: new Date(movie.created_at).getTime(),
      });
    });

    // Get recent articles
    const { data: recentArticles, error: articlesError } = await supabase
      .from('articles')
      .select('id, title_es, title_en, updated_at')
      .eq('status', 'published')
      .gte('updated_at', oneDayAgo.toISOString())
      .order('updated_at', { ascending: false })
      .limit(5);

    if (articlesError) throw articlesError;

    recentArticles?.forEach((article) => {
      activities.push({
        id: `article-${article.id}`,
        type: 'editorial',
        title: article.title_es || article.title_en || 'Unknown',
        details: 'Artículo actualizado',
        time: formatRelativeTime(article.updated_at),
        timestamp: new Date(article.updated_at).getTime(),
      });
    });

    // Sort all activities by timestamp
    activities.sort((a, b) => b.timestamp - a.timestamp);

    return ok(c, activities.slice(0, 10));
  } catch (error) {
    console.error('[Dashboard] Error fetching activity:', error);
    return serverError(c, error instanceof Error ? error.message : 'Unknown error');
  }
});

// Get sync queue (movies that need syncing)
router.get('/sync-queue', async (c) => {
  try {
    // Get movies that haven't been synced yet (tmdb_last_synced_at is null)
    const { data: pendingMovies, error: pendingError } = await supabase
      .from('media')
      .select('id, title_es, title_en, created_at')
      .eq('media_type', 'movie')
      .is('tmdb_last_synced_at', null)
      .order('created_at', { ascending: false })
      .limit(5);

    if (pendingError) throw pendingError;

    // Get recently synced movies (last sync in the last hour)
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    const { data: recentlySynced, error: syncedError } = await supabase
      .from('media')
      .select('id, title_es, title_en, tmdb_last_synced_at')
      .eq('media_type', 'movie')
      .not('tmdb_last_synced_at', 'is', null)
      .gte('tmdb_last_synced_at', oneHourAgo.toISOString())
      .order('tmdb_last_synced_at', { ascending: false })
      .limit(3);

    if (syncedError) throw syncedError;

    const queue: any[] = [];

    // Add recently synced movies as completed
    recentlySynced?.forEach((movie) => {
      queue.push({
        id: movie.id,
        name: movie.title_es || movie.title_en || 'Unknown',
        step: 'Completado',
        progress: 100,
        status: 'completed',
      });
    });

    // Add pending movies
    pendingMovies?.forEach((movie) => {
      queue.push({
        id: movie.id,
        name: movie.title_es || movie.title_en || 'Unknown',
        step: 'En cola',
        progress: 0,
        status: 'queued',
      });
    });

    return ok(c, queue);
  } catch (error) {
    console.error('[Dashboard] Error fetching sync queue:', error);
    return serverError(c, error instanceof Error ? error.message : 'Unknown error');
  }
});

// Helper function to format relative time
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `hace ${diffMins} min`;
  if (diffHours < 24) return `hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
  if (diffDays < 7) return `hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

export default router;
