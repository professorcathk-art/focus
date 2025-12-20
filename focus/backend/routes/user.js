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
    let topCategory = null;
    try {
      const { data: clusters, error: clustersError } = await supabase
      .from('clusters')
      .select('id, label')
      .eq('user_id', req.user.id);

      if (clustersError) {
        console.error('Error fetching clusters for stats:', clustersError);
        // Continue without top category if query fails
      } else if (clusters && clusters.length > 0) {
      const clusterCounts = await Promise.all(
        clusters.map(async (cluster) => {
            try {
              const { count, error: countError } = await supabase
            .from('ideas')
            .select('*', { count: 'exact', head: true })
            .eq('cluster_id', cluster.id);
              
              if (countError) {
                console.error(`Error counting ideas for cluster ${cluster.id}:`, countError);
                return { label: cluster.label, count: 0 };
              }
              
          return { label: cluster.label, count: count || 0 };
            } catch (err) {
              console.error(`Error processing cluster ${cluster.id}:`, err);
              return { label: cluster.label, count: 0 };
            }
        })
      );

      const top = clusterCounts.sort((a, b) => b.count - a.count)[0];
      if (top && top.count > 0) {
        topCategory = top;
      }
      }
    } catch (err) {
      console.error('Error calculating top category:', err);
      // Continue without top category if calculation fails
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

