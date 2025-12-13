/**
 * Clustering utilities for automatically categorizing ideas
 */

const supabase = require('./supabase');
const aimlClient = require('./aiml-client');

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) {
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dotProduct / denominator;
}

/**
 * Find the best matching cluster for an idea using embedding similarity
 * Returns cluster_id if found, null otherwise
 */
async function findBestCluster(userId, embedding, similarityThreshold = 0.3) {
  try {
    console.log(`[Clustering] Finding best cluster for user ${userId}`);
    
    // Get all existing clusters for this user
    const { data: clusters, error: clustersError } = await supabase
      .from('clusters')
      .select('id')
      .eq('user_id', userId);

    if (clustersError) {
      console.error(`[Clustering] Error fetching clusters:`, clustersError);
      return null;
    }

    if (!clusters || clusters.length === 0) {
      console.log(`[Clustering] No existing clusters found for user`);
      return null;
    }

    console.log(`[Clustering] Found ${clusters.length} existing clusters`);

    // Get all ideas with embeddings that belong to clusters
    const { data: ideas, error: ideasError } = await supabase
      .from('ideas')
      .select('id, embedding, cluster_id')
      .eq('user_id', userId)
      .not('cluster_id', 'is', null)
      .not('embedding', 'is', null);

    if (ideasError) {
      console.error(`[Clustering] Error fetching ideas:`, ideasError);
      return null;
    }

    if (!ideas || ideas.length === 0) {
      console.log(`[Clustering] No ideas with clusters found`);
      return null;
    }

    console.log(`[Clustering] Found ${ideas.length} ideas with clusters`);

    // Group ideas by cluster
    const clusterIdeas = {};
    ideas.forEach(idea => {
      if (!clusterIdeas[idea.cluster_id]) {
        clusterIdeas[idea.cluster_id] = [];
      }
      clusterIdeas[idea.cluster_id].push(idea);
    });

    // Find the cluster with the highest average similarity
    let bestClusterId = null;
    let bestSimilarity = 0;

    for (const [clusterId, clusterIdeasList] of Object.entries(clusterIdeas)) {
      // Calculate average similarity to all ideas in this cluster
      let totalSimilarity = 0;
      let count = 0;

      for (const idea of clusterIdeasList) {
        if (idea.embedding) {
          // Handle both array and string formats (Supabase may return as string)
          let ideaEmbedding = idea.embedding;
          if (typeof ideaEmbedding === 'string') {
            try {
              ideaEmbedding = JSON.parse(ideaEmbedding);
            } catch (e) {
              continue; // Skip invalid embeddings
            }
          }
          const similarity = cosineSimilarity(embedding, ideaEmbedding);
          totalSimilarity += similarity;
          count++;
        }
      }

      if (count > 0) {
        const avgSimilarity = totalSimilarity / count;
        console.log(`[Clustering] Cluster ${clusterId}: avg similarity = ${avgSimilarity.toFixed(3)} (${count} ideas)`);
        if (avgSimilarity > bestSimilarity && avgSimilarity >= similarityThreshold) {
          bestSimilarity = avgSimilarity;
          bestClusterId = clusterId;
        }
      }
    }

    if (bestClusterId) {
      console.log(`[Clustering] Best cluster found: ${bestClusterId} with similarity ${bestSimilarity.toFixed(3)}`);
    } else {
      console.log(`[Clustering] No cluster meets similarity threshold (${similarityThreshold})`);
    }

    return bestClusterId;
  } catch (error) {
    console.error('Error finding best cluster:', error);
    return null;
  }
}

/**
 * Generate a cluster label using AI based on idea transcript
 */
async function generateClusterLabel(transcript) {
  try {
    const response = await aimlClient.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that creates short, descriptive category labels for ideas. Return only the label, nothing else. Examples: "Business Ideas", "App Features", "Learning Notes", "To-do Items", "Product Ideas". Keep it under 3 words.',
        },
        {
          role: 'user',
          content: `Create a short category label for this idea: "${transcript.substring(0, 200)}"`,
        },
      ],
      max_tokens: 20,
      temperature: 0.7,
    });

    const label = response.choices[0]?.message?.content?.trim();
    return label || 'Uncategorized';
  } catch (error) {
    console.error('Error generating cluster label:', error);
    return 'Uncategorized';
  }
}

/**
 * Create a new cluster with AI-generated label
 */
async function createClusterWithLabel(userId, transcript) {
  try {
    console.log(`[Clustering] Generating label for transcript: "${transcript.substring(0, 50)}..."`);
    const label = await generateClusterLabel(transcript);
    console.log(`[Clustering] Generated label: "${label}"`);
    
    // Check if cluster with this label already exists
    const { data: existing, error: checkError } = await supabase
      .from('clusters')
      .select('id')
      .eq('user_id', userId)
      .eq('label', label)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = not found, which is OK
      console.error(`[Clustering] Error checking existing cluster:`, checkError);
    }

    if (existing) {
      console.log(`[Clustering] Cluster with label "${label}" already exists: ${existing.id}`);
      return existing.id;
    }

    // Create new cluster
    const clusterId = require('crypto').randomUUID();
    const now = new Date().toISOString();

    console.log(`[Clustering] Creating new cluster with ID ${clusterId} and label "${label}"`);
    const { data: cluster, error } = await supabase
      .from('clusters')
      .insert({
        id: clusterId,
        user_id: userId,
        label: label,
        created_at: now,
        updated_at: now,
      })
      .select('id')
      .single();

    if (error) {
      console.error(`[Clustering] Error creating cluster:`, error);
      return null;
    }

    console.log(`[Clustering] Successfully created cluster ${cluster.id}`);
    return cluster.id;
  } catch (error) {
    console.error('[Clustering] Error creating cluster with label:', error);
    return null;
  }
}

/**
 * Assign an idea to a cluster (or create a new one if needed)
 * Returns the cluster_id
 */
async function assignToCluster(userId, ideaId, embedding, transcript) {
  console.log(`[Clustering] ========================================`);
  console.log(`[Clustering] 🎯 assignToCluster CALLED`);
  console.log(`[Clustering] Starting assignment for idea ${ideaId}`);
  console.log(`[Clustering] User ID: ${userId}`);
  console.log(`[Clustering] Embedding dimensions: ${embedding ? embedding.length : 'NULL'}`);
  console.log(`[Clustering] Transcript: "${transcript ? transcript.substring(0, 100) : 'NULL'}..."`);
  
  try {
    if (!embedding) {
      console.error(`[Clustering] ❌ Embedding is NULL!`);
      return null;
    }
    
    if (embedding.length !== 1536) {
      console.error(`[Clustering] ❌ Invalid embedding! Length: ${embedding.length}, expected 1536`);
      return null;
    }
    
    console.log(`[Clustering] ✅ Embedding validation passed: ${embedding.length} dimensions`);
    
    // First, try to find an existing cluster
    const existingClusterId = await findBestCluster(userId, embedding);
    
    if (existingClusterId) {
      console.log(`[Clustering] Found existing cluster ${existingClusterId}`);
      // Update idea with existing cluster
      const { error } = await supabase
        .from('ideas')
        .update({ cluster_id: existingClusterId })
        .eq('id', ideaId);

      if (!error) {
        console.log(`[Clustering] Successfully assigned idea ${ideaId} to cluster ${existingClusterId}`);
        return existingClusterId;
      } else {
        console.error(`[Clustering] Error updating idea with cluster:`, error);
      }
    } else {
      console.log(`[Clustering] No suitable cluster found, creating new one`);
    }

    // No suitable cluster found, create a new one
    const newClusterId = await createClusterWithLabel(userId, transcript);
    
    if (newClusterId) {
      console.log(`[Clustering] Created new cluster ${newClusterId}`);
      // Update idea with new cluster
      const { error } = await supabase
        .from('ideas')
        .update({ cluster_id: newClusterId })
        .eq('id', ideaId);

      if (!error) {
        console.log(`[Clustering] ✅ Successfully assigned idea ${ideaId} to new cluster ${newClusterId}`);
        console.log(`[Clustering] ========================================`);
        return newClusterId;
      } else {
        console.error(`[Clustering] ❌ Error updating idea with new cluster:`, error);
        console.error(`[Clustering] Error details:`, JSON.stringify(error, null, 2));
      }
    } else {
      console.error(`[Clustering] Failed to create new cluster`);
    }

    console.log(`[Clustering] ⚠️  No cluster assignment completed for idea ${ideaId}`);
    console.log(`[Clustering] ========================================`);
    return null;
  } catch (error) {
    console.error('[Clustering] ❌ Exception in assignToCluster:', error);
    console.error('[Clustering] Error stack:', error.stack);
    console.error('[Clustering] ========================================');
    return null;
  }
}

module.exports = {
  cosineSimilarity,
  findBestCluster,
  generateClusterLabel,
  createClusterWithLabel,
  assignToCluster,
};

