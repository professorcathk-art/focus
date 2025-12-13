/**
 * User routes
 */

const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const { requireAuth } = require('../middleware/auth');

/**
 * Get user stats
 */
router.get('/stats', requireAuth, async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    // Total ideas
    const { count: totalIdeas } = await supabase
      .from('ideas')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', req.user.id);

    // Ideas this month
    const { count: ideasThisMonth } = await supabase
      .from('ideas')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', req.user.id)
      .gte('created_at', startOfMonth);

    // Average per day (last 30 days)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { count: ideasLast30Days } = await supabase
      .from('ideas')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', req.user.id)
      .gte('created_at', thirtyDaysAgo);

    const averagePerDay = ideasLast30Days ? (ideasLast30Days / 30).toFixed(1) : 0;

    // Top category
    const { data: clusters } = await supabase
      .from('clusters')
      .select('id, label')
      .eq('user_id', req.user.id);

    let topCategory = null;
    if (clusters && clusters.length > 0) {
      const clusterCounts = await Promise.all(
        clusters.map(async (cluster) => {
          const { count } = await supabase
            .from('ideas')
            .select('*', { count: 'exact', head: true })
            .eq('cluster_id', cluster.id);
          return { label: cluster.label, count: count || 0 };
        })
      );

      const top = clusterCounts.sort((a, b) => b.count - a.count)[0];
      if (top && top.count > 0) {
        topCategory = top;
      }
    }

    res.json({
      totalIdeas: totalIdeas || 0,
      ideasThisMonth: ideasThisMonth || 0,
      averagePerDay: parseFloat(averagePerDay),
      topCategory,
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * Export user data
 */
router.get('/export', requireAuth, async (req, res) => {
  try {
    const { data: ideas } = await supabase
      .from('ideas')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    const { data: clusters } = await supabase
      .from('clusters')
      .select('*')
      .eq('user_id', req.user.id);

    res.json({
      user: req.user,
      ideas: ideas || [],
      clusters: clusters || [],
      exportedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * Delete user account
 */
router.delete('/delete', requireAuth, async (req, res) => {
  try {
    // Delete all user data
    await supabase.from('ideas').delete().eq('user_id', req.user.id);
    await supabase.from('clusters').delete().eq('user_id', req.user.id);
    await supabase.from('users').delete().eq('id', req.user.id);

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;

