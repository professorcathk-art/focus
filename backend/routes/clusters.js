/**
 * Clusters routes
 */

const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const aimlClient = require('../lib/aiml-client');
const { requireAuth } = require('../middleware/auth');

/**
 * List user's clusters
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const { data: clusters, error } = await supabase
      .from('clusters')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching clusters:', error);
      return res.status(500).json({ message: 'Failed to fetch clusters' });
    }

    // Get idea IDs for each cluster
    const clustersWithIdeas = await Promise.all(
      clusters.map(async (cluster) => {
        const { data: ideas } = await supabase
          .from('ideas')
          .select('id')
          .eq('cluster_id', cluster.id);

        return {
          id: cluster.id,
          userId: cluster.user_id,
          label: cluster.label,
          ideaIds: ideas?.map(i => i.id) || [],
          createdAt: cluster.created_at,
          updatedAt: cluster.updated_at,
        };
      })
    );

    res.json(clustersWithIdeas);
  } catch (error) {
    console.error('List clusters error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * Create new cluster
 */
router.post('/', requireAuth, async (req, res) => {
  try {
    const { label } = req.body;

    if (!label || !label.trim()) {
      return res.status(400).json({ message: 'Label is required' });
    }

    // Check if cluster with this label already exists
    const { data: existing } = await supabase
      .from('clusters')
      .select('id')
      .eq('user_id', req.user.id)
      .eq('label', label.trim())
      .single();

    if (existing) {
      return res.status(400).json({ message: 'Cluster with this label already exists' });
    }

    const clusterId = require('crypto').randomUUID();
    const now = new Date().toISOString();

    const { data: cluster, error } = await supabase
      .from('clusters')
      .insert({
        id: clusterId,
        user_id: req.user.id,
        label: label.trim(),
        created_at: now,
        updated_at: now,
      })
      .select('*')
      .single();

    if (error) {
      console.error('Create cluster error:', error);
      return res.status(500).json({ message: 'Failed to create cluster' });
    }

    res.json({
      id: cluster.id,
      userId: cluster.user_id,
      label: cluster.label,
      ideaIds: [],
      createdAt: cluster.created_at,
      updatedAt: cluster.updated_at,
    });
  } catch (error) {
    console.error('Create cluster error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * Assign idea to cluster (must come before /:id routes)
 */
router.post('/:id/assign', requireAuth, async (req, res) => {
  try {
    const { ideaId } = req.body;

    if (!ideaId) {
      return res.status(400).json({ message: 'Idea ID is required' });
    }

    // Check cluster ownership
    const { data: cluster } = await supabase
      .from('clusters')
      .select('id')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (!cluster) {
      return res.status(404).json({ message: 'Cluster not found' });
    }

    // Check idea ownership
    const { data: idea } = await supabase
      .from('ideas')
      .select('id')
      .eq('id', ideaId)
      .eq('user_id', req.user.id)
      .single();

    if (!idea) {
      return res.status(404).json({ message: 'Idea not found' });
    }

    // Assign idea to cluster
    const { error } = await supabase
      .from('ideas')
      .update({ cluster_id: cluster.id })
      .eq('id', ideaId);

    if (error) {
      console.error('Assign idea error:', error);
      return res.status(500).json({ message: 'Failed to assign idea' });
    }

    res.json({ message: 'Idea assigned to cluster successfully' });
  } catch (error) {
    console.error('Assign idea error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * Get ideas in cluster (must come before /:id route)
 */
router.get('/:id/ideas', requireAuth, async (req, res) => {
  try {
    const { data: ideas, error } = await supabase
      .from('ideas')
      .select('*')
      .eq('cluster_id', req.params.id)
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching cluster ideas:', error);
      return res.status(500).json({ message: 'Failed to fetch ideas' });
    }

    const formattedIdeas = ideas.map(idea => ({
      id: idea.id,
      userId: idea.user_id,
      transcript: idea.transcript,
      audioUrl: idea.audio_url,
      duration: idea.duration,
      createdAt: idea.created_at,
      updatedAt: idea.updated_at,
      clusterId: idea.cluster_id,
      embedding: idea.embedding,
    }));

    res.json(formattedIdeas);
  } catch (error) {
    console.error('Get cluster ideas error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * Get single cluster
 */
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { data: cluster, error } = await supabase
      .from('clusters')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (error || !cluster) {
      return res.status(404).json({ message: 'Cluster not found' });
    }

    const { data: ideas } = await supabase
      .from('ideas')
      .select('id')
      .eq('cluster_id', cluster.id);

    res.json({
      id: cluster.id,
      userId: cluster.user_id,
      label: cluster.label,
      ideaIds: ideas?.map(i => i.id) || [],
      createdAt: cluster.created_at,
      updatedAt: cluster.updated_at,
    });
  } catch (error) {
    console.error('Get cluster error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * Update cluster label
 */
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { label } = req.body;

    if (!label || !label.trim()) {
      return res.status(400).json({ message: 'Label is required' });
    }

    // Check ownership
    const { data: existingCluster } = await supabase
      .from('clusters')
      .select('id')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (!existingCluster) {
      return res.status(404).json({ message: 'Cluster not found' });
    }

    const { data: cluster, error } = await supabase
      .from('clusters')
      .update({
        label: label.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', req.params.id)
      .select('*')
      .single();

    if (error) {
      console.error('Update cluster error:', error);
      return res.status(500).json({ message: 'Failed to update cluster' });
    }

    const { data: ideas } = await supabase
      .from('ideas')
      .select('id')
      .eq('cluster_id', cluster.id);

    res.json({
      id: cluster.id,
      userId: cluster.user_id,
      label: cluster.label,
      ideaIds: ideas?.map(i => i.id) || [],
      createdAt: cluster.created_at,
      updatedAt: cluster.updated_at,
    });
  } catch (error) {
    console.error('Update cluster error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * Delete cluster (must come after /:id/assign and /:id/ideas routes)
 */
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    // Check ownership
    const { data: cluster } = await supabase
      .from('clusters')
      .select('id')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (!cluster) {
      return res.status(404).json({ message: 'Cluster not found' });
    }

    // Remove cluster_id from all ideas in this cluster (set to null)
    const { error: updateError } = await supabase
      .from('ideas')
      .update({ cluster_id: null })
      .eq('cluster_id', req.params.id)
      .eq('user_id', req.user.id);

    if (updateError) {
      console.error('Error removing cluster from ideas:', updateError);
      return res.status(500).json({ message: 'Failed to remove cluster from ideas' });
    }

    // Delete the cluster
    const { error: deleteError } = await supabase
      .from('clusters')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);

    if (deleteError) {
      console.error('Delete cluster error:', deleteError);
      return res.status(500).json({ message: 'Failed to delete cluster' });
    }

    res.json({ message: 'Cluster deleted successfully' });
  } catch (error) {
    console.error('Delete cluster error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;

