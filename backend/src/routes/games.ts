import { Router } from 'express';

import prisma from '../config/database';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const category = typeof req.query.category === 'string' ? req.query.category.toUpperCase() : undefined;

    const games = await prisma.game.findMany({
      where: {
        isActive: true,
        ...(category ? { category } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ items: games, total: games.length });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Unable to load game catalog' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const game = await prisma.game.findUnique({ where: { id: req.params.id } });

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    return res.json(game);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Unable to load game' });
  }
});

export default router;
