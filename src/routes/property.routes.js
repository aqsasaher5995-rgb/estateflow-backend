import express from 'express';

const router = express.Router();

// Get all properties (simple version)
router.get('/', async (req, res) => {
  try {
    res.json({
      success: true,
      data: { properties: [] }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;