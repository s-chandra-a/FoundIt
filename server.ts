import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Computes bitwise Hamming distance and similarity percentage between two hexadecimal hashes.
 */
function compareHexHashes(hashA: string, hashB: string) {
  const cleanA = hashA.trim().toLowerCase().replace(/[^0-9a-f]/g, '');
  const cleanB = hashB.trim().toLowerCase().replace(/[^0-9a-f]/g, '');
  const hexLength = Math.min(cleanA.length, cleanB.length, 16);

  if (hexLength === 0) {
    return { hammingDistance: 64, matchingBits: 0, totalBits: 64, matchPercentage: 0 };
  }

  let differingBits = 0;
  const totalBits = hexLength * 4;

  for (let i = 0; i < hexLength; i++) {
    const nibbleA = parseInt(cleanA[i], 16);
    const nibbleB = parseInt(cleanB[i], 16);
    let xor = nibbleA ^ nibbleB;
    while (xor > 0) {
      differingBits += xor & 1;
      xor >>= 1;
    }
  }

  const matchingBits = totalBits - differingBits;
  const matchPercentage = Number(((matchingBits / totalBits) * 100).toFixed(1));

  return {
    hammingDistance: differingBits,
    matchingBits,
    totalBits,
    matchPercentage,
  };
}

// In-memory state mirror for seamless cross-session persistence
let serverItemsCache: Record<string, unknown>[] = [];
let serverClaimsCache: Record<string, unknown>[] = [];

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '5mb' }));

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'FoundIt Campus Directory Server',
      hashAlgorithm: '64-bit Perceptual Difference Hash (dHash)',
    });
  });

  // State synchronization endpoints for cross-role persistence
  app.get('/api/state', (_req, res) => {
    res.json({
      items: serverItemsCache,
      claims: serverClaimsCache,
    });
  });

  app.post('/api/state', (req, res) => {
    const { items, claims } = req.body as {
      items?: Record<string, unknown>[];
      claims?: Record<string, unknown>[];
    };
    if (Array.isArray(items)) serverItemsCache = items;
    if (Array.isArray(claims)) serverClaimsCache = claims;
    res.json({ status: 'synced', itemsCount: serverItemsCache.length, claimsCount: serverClaimsCache.length });
  });

  // Perceptual Image Hash comparison endpoint
  app.post('/api/hash-compare', (req, res) => {
    try {
      const { queryHash, candidates } = req.body as {
        queryHash?: string;
        candidates?: Array<{ id: string; imageHash: string }>;
      };

      if (!queryHash || typeof queryHash !== 'string') {
        res.status(400).json({ error: 'Valid hexadecimal queryHash is required.' });
        return;
      }

      if (!Array.isArray(candidates)) {
        res.status(400).json({ error: 'candidates array is required.' });
        return;
      }

      const results = candidates
        .map((candidate) => {
          const metrics = compareHexHashes(queryHash, candidate.imageHash || '');
          return {
            id: candidate.id,
            imageHash: candidate.imageHash,
            ...metrics,
          };
        })
        .sort((a, b) => b.matchPercentage - a.matchPercentage);

      res.json({
        queryHash,
        comparedCount: results.length,
        results,
      });
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to compare image hashes',
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FoundIt server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
