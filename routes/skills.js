// routes/skills.js
const express = require('express');
const router = express.Router();
const { web3Service } = require('../utils/web3Utils');

// Get all skills
router.get('/', async (req, res) => {
  try {
    const { category, instructor, search } = req.query;
    let skills;

    if (category) {
      const skillIds = await web3Service.getSkillsByCategory(category);
      skills = await Promise.all(
        skillIds.map(id => web3Service.getSkill(id.toNumber()))
      );
    } else {
      skills = await web3Service.getAllSkills();
    }

    // Filter by instructor if specified
    if (instructor) {
      skills = skills.filter(skill => 
        skill.instructor.toLowerCase() === instructor.toLowerCase()
      );
    }

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      skills = skills.filter(skill =>
        skill.title.toLowerCase().includes(searchLower) ||
        skill.description.toLowerCase().includes(searchLower) ||
        skill.category.toLowerCase().includes(searchLower)
      );
    }

    res.json({ success: true, skills });
  } catch (error) {
    console.error('Error fetching skills:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get skill by ID
router.get('/:id', async (req, res) => {
  try {
    const skillId = parseInt(req.params.id);
    const skill = await web3Service.getSkill(skillId);
    
    // Format the skill data
    const formattedSkill = {
      ...skill,
      id: skill.id.toNumber(),
      duration: skill.duration.toNumber(),
      price: web3Service.formatTokenAmount(skill.price),
      totalStudents: skill.totalStudents.toNumber(),
      averageRating: skill.averageRating.toNumber() / 100, // Convert back from basis points
      totalRatings: skill.totalRatings.toNumber(),
      createdAt: new Date(skill.createdAt.toNumber() * 1000)
    };

    res.json({ success: true, skill: formattedSkill });
  } catch (error) {
    console.error('Error fetching skill:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get skills by category
router.get('/category/:category', async (req, res) => {
  try {
    const category = req.params.category;
    const skillIds = await web3Service.getSkillsByCategory(category);
    
    const skills = await Promise.all(
      skillIds.map(async (id) => {
        const skill = await web3Service.getSkill(id.toNumber());
        return {
          ...skill,
          id: skill.id.toNumber(),
          duration: skill.duration.toNumber(),
          price: web3Service.formatTokenAmount(skill.price),
          totalStudents: skill.totalStudents.toNumber(),
          averageRating: skill.averageRating.toNumber() / 100,
          totalRatings: skill.totalRatings.toNumber(),
          createdAt: new Date(skill.createdAt.toNumber() * 1000)
        };
      })
    );

    res.json({ success: true, skills });
  } catch (error) {
    console.error('Error fetching skills by category:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;

// routes/users.js
const express = require('express');
const router = express.Router();
const { web3Service } = require('../utils/web3Utils');

// Get user profile
router.get('/:address', async (req, res) => {
  try {
    const userAddress = req.params.address;
    const user = await web3Service.getUser(userAddress);
    const achievements = await web3Service.getAchievements(userAddress);
    const tokenBalance = await web3Service.getTokenBalance(userAddress);

    const formattedUser = {
      ...user,
      totalSkillsTaught: user.totalSkillsTaught.toNumber(),
      totalSkillsLearned: user.totalSkillsLearned.toNumber(),
      reputationScore: user.reputationScore.toNumber(),
      tokensEarned: web3Service.formatTokenAmount(user.tokensEarned),
      tokensSpent: web3Service.formatTokenAmount(user.tokensSpent),
      skillsOwned: user.skillsOwned.map(id => id.toNumber()),
      skillsCreated: user.skillsCreated.map(id => id.toNumber()),
      tokenBalance: tokenBalance,
      achievements: achievements
    };

    res.json({ success: true, user: formattedUser });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get user's created skills
router.get('/:address/skills/created', async (req, res) => {
  try {
    const userAddress = req.params.address;
    const user = await web3Service.getUser(userAddress);
    
    const skills = await Promise.all(
      user.skillsCreated.map(async (skillId) => {
        const skill = await web3Service.getSkill(skillId.toNumber());
        return {
          ...skill,
          id: skill.id.toNumber(),
          duration: skill.duration.toNumber(),
          price: web3Service.formatTokenAmount(skill.price),
          totalStudents: skill.totalStudents.toNumber(),
          averageRating: skill.averageRating.toNumber() / 100,
          totalRatings: skill.totalRatings.toNumber(),
          createdAt: new Date(skill.createdAt.toNumber() * 1000)
        };
      })
    );

    res.json({ success: true, skills });
  } catch (error) {
    console.error('Error fetching user created skills:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get user's learned skills
router.get('/:address/skills/learned', async (req, res) => {
  try {
    const userAddress = req.params.address;
    const user = await web3Service.getUser(userAddress);
    
    const skills = await Promise.all(
      user.skillsOwned.map(async (skillId) => {
        const skill = await web3Service.getSkill(skillId.toNumber());
        return {
          ...skill,
          id: skill.id.toNumber(),
          duration: skill.duration.toNumber(),
          price: web3Service.formatTokenAmount(skill.price),
          totalStudents: skill.totalStudents.toNumber(),
          averageRating: skill.averageRating.toNumber() / 100,
          totalRatings: skill.totalRatings.toNumber(),
          createdAt: new Date(skill.createdAt.toNumber() * 1000)
        };
      })
    );

    res.json({ success: true, skills });
  } catch (error) {
    console.error('Error fetching user learned skills:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get leaderboard
router.get('/leaderboard/:type', async (req, res) => {
  try {
    const type = req.params.type; // 'reputation', 'earnings', 'skills_taught'
    // This would require indexing user data - simplified version
    
    // For now, return mock leaderboard
    // In production, you'd want to maintain this data off-chain or use The Graph
    const mockLeaderboard = [
      {
        address: '0x1234...',
        username: 'CryptoTeacher',
        score: 950,
        totalSkills: 15,
        earnings: '500.5'
      }
    ];

    res.json({ success: true, leaderboard: mockLeaderboard });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;

// routes/sessions.js
const express = require('express');
const router = express.Router();
const { web3Service } = require('../utils/web3Utils');

// Get user sessions
router.get('/user/:address', async (req, res) => {
  try {
    const userAddress = req.params.address;
    const sessionIds = await web3Service.getUserSessions(userAddress);
    
    // Note: This would require additional contract methods to get session details
    // For now, return the session IDs
    res.json({ 
      success: true, 
      sessionIds: sessionIds.map(id => id.toNumber()) 
    });
  } catch (error) {
    console.error('Error fetching user sessions:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get session analytics (mock implementation)
router.get('/analytics/:address', async (req, res) => {
  try {
    const userAddress = req.params.address;
    
    // Mock analytics data
    const analytics = {
      totalSessions: 25,
      completedSessions: 22,
      averageScore: 85.4,
      totalTimeSpent: 180, // minutes
      favoriteCategories: ['Programming', 'Design', 'Marketing'],
      monthlyProgress: [
        { month: 'Jan', sessions: 3, score: 82 },
        { month: 'Feb', sessions: 5, score: 87 },
        { month: 'Mar', sessions: 4, score: 89 }
      ]
    };

    res.json({ success: true, analytics });
  } catch (error) {
    console.error('Error fetching session analytics:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;

// routes/ipfs.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const { create } = require('ipfs-http-client');

// Configure IPFS client
const ipfs = create({
  host: process.env.IPFS_HOST || 'localhost',
  port: process.env.IPFS_PORT || 5001,
  protocol: process.env.IPFS_PROTOCOL || 'http'
});

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow video, image, and document files
    const allowedTypes = /jpeg|jpg|png|gif|mp4|mov|avi|pdf|doc|docx/;
    const extname = allowedTypes.test(file.originalname.toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// Upload file to IPFS
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file provided' });
    }

    const { buffer, originalname, mimetype } = req.file;
    
    // Add file to IPFS
    const result = await ipfs.add({
      path: originalname,
      content: buffer
    });

    const ipfsHash = result.cid.toString();
    
    // Store metadata
    const metadata = {
      filename: originalname,
      mimetype: mimetype,
      size: buffer.length,
      ipfsHash: ipfsHash,
      uploadedAt: new Date().toISOString()
    };

    res.json({
      success: true,
      ipfsHash: ipfsHash,
      metadata: metadata,
      gatewayUrl: ${process.env.IPFS_GATEWAY || 'https://ipfs.io/ipfs/'}${ipfsHash}
    });
  } catch (error) {
    console.error('Error uploading to IPFS:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Upload JSON metadata to IPFS
router.post('/upload-json', async (req, res) => {
  try {
    const jsonData = req.body;
    
    const result = await ipfs.add(JSON.stringify(jsonData, null, 2));
    const ipfsHash = result.cid.toString();

    res.json({
      success: true,
      ipfsHash: ipfsHash,
      gatewayUrl: ${process.env.IPFS_GATEWAY || 'https://ipfs.io/ipfs/'}${ipfsHash}
    });
  } catch (error) {
    console.error('Error uploading JSON to IPFS:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get file from IPFS
router.get('/:hash', async (req, res) => {
  try {
    const hash = req.params.hash;
    
    const chunks = [];
    for await (const chunk of ipfs.cat(hash)) {
      chunks.push(chunk);
    }
    
    const data = Buffer.concat(chunks);
    
    // Try to determine content type
    const contentType = req.query.type || 'application/octet-stream';
    res.set('Content-Type', contentType);
    res.send(data);
  } catch (error) {
    console.error('Error fetching from IPFS:', error);
    res.status(404).json({ success: false, error: 'File not found' });
  }
});

module.exports = router;