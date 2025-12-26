import { Router, Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User';

const router = Router();

// Get all users
router.get('/', async (req: Request, res: Response) => {
  try {
    const userRepository = AppDataSource.getRepository(User);
    const users = await userRepository.find();
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch users' });
  }
});

// Get user by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOneBy({ id: req.params.id });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch user' });
  }
});

// Create new user
router.post('/', async (req: Request, res: Response) => {
  try {
    const userRepository = AppDataSource.getRepository(User);
    const user = userRepository.create(req.body);
    const result = await userRepository.save(user);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create user' });
  }
});

// Update user
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOneBy({ id: req.params.id });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    userRepository.merge(user, req.body);
    const result = await userRepository.save(user);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update user' });
  }
});

// Delete user
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userRepository = AppDataSource.getRepository(User);
    const result = await userRepository.delete(req.params.id);

    if (result.affected === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete user' });
  }
});

export default router;
