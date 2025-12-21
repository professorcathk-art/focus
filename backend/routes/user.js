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
 * Deletes all user data and the auth user
 */
router.delete('/delete', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`[Delete Account] Deleting account for user: ${userId}`);
    
    // Step 1: Delete all user data from database tables
    // Note: Supabase RLS will ensure user can only delete their own data
    const { error: ideasError } = await supabase.from('ideas').delete().eq('user_id', userId);
    if (ideasError) console.error('[Delete Account] Error deleting ideas:', ideasError);
    
    const { error: clustersError } = await supabase.from('clusters').delete().eq('user_id', userId);
    if (clustersError) console.error('[Delete Account] Error deleting clusters:', clustersError);
    
    const { error: todosError } = await supabase.from('todos').delete().eq('user_id', userId);
    if (todosError) console.error('[Delete Account] Error deleting todos:', todosError);
    
    const { error: usersError } = await supabase.from('users').delete().eq('id', userId);
    if (usersError) console.error('[Delete Account] Error deleting user record:', usersError);
    
    // Step 2: Delete the auth user from Supabase Auth (CRITICAL!)
    // This prevents the user from logging in after account deletion
    // Using Admin API requires service role key (already configured in lib/supabase.js)
    console.log(`[Delete Account] Attempting to delete auth user: ${userId}`);
    
    try {
      // First, revoke all refresh tokens to invalidate existing sessions
      // This prevents the user from logging in even if their JWT hasn't expired yet
      console.log(`[Delete Account] Revoking refresh tokens for user: ${userId}`);
      const { error: revokeError } = await supabase.auth.admin.signOut(userId, 'global');
      
      if (revokeError) {
        console.warn('[Delete Account] ⚠️ Warning: Failed to revoke refresh tokens:', revokeError);
        // Continue with deletion even if token revocation fails
      } else {
        console.log(`[Delete Account] ✅ Refresh tokens revoked for user: ${userId}`);
      }
      
      // Now delete the auth user
      const { data: deleteResult, error: authDeleteError } = await supabase.auth.admin.deleteUser(userId);
      
      if (authDeleteError) {
        console.error('[Delete Account] ❌ Error deleting auth user:', {
          error: authDeleteError,
          message: authDeleteError.message,
          status: authDeleteError.status,
          userId: userId
        });
        
        // Return error so frontend knows deletion failed
        return res.status(500).json({ 
          message: 'Account data deleted but auth user deletion failed. Please contact support.',
          error: authDeleteError.message,
          details: process.env.NODE_ENV === 'development' ? authDeleteError : undefined
        });
      }
      
      console.log(`[Delete Account] ✅ Auth user deleted successfully:`, {
        userId: userId,
        deleteResult: deleteResult
      });
    } catch (adminError) {
      // Catch any unexpected errors (e.g., if admin API is not available)
      console.error('[Delete Account] ❌ Exception deleting auth user:', {
        error: adminError,
        message: adminError.message,
        stack: adminError.stack,
        userId: userId
      });
      
      return res.status(500).json({ 
        message: 'Account data deleted but auth user deletion failed. Please contact support.',
        error: adminError.message,
        details: process.env.NODE_ENV === 'development' ? adminError.stack : undefined
      });
    }
    
    console.log(`[Delete Account] ✅ Account and auth user deleted for user: ${userId}`);
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('[Delete Account] Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;

