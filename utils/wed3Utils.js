// web3Utils.js - Web3 connection and contract interaction utilities

const { ethers } = require('ethers');

// Contract ABIs (you'll need to compile your contracts to get full ABIs)
const LEARN_TOKEN_ABI = [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "function totalSupply() view returns (uint256)",
    "function balanceOf(address) view returns (uint256)",
    "function transfer(address to, uint256 amount) returns (bool)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function mint(address to, uint256 amount)",
    "event Transfer(address indexed from, address indexed to, uint256 value)",
    "event Approval(address indexed owner, address indexed spender, uint256 value)"
];

const LEARN_PLATFORM_ABI = [
    // User functions
    "function registerUser(string username, bool isInstructor)",
    "function getUser(address userAddress) view returns (tuple(address userAddress, string username, uint256 totalSkillsTaught, uint256 totalSkillsLearned, uint256 reputationScore, uint256 tokensEarned, uint256 tokensSpent, bool isInstructor, uint256[] skillsOwned, uint256[] skillsCreated))",
    
    // Skill functions
    "function createSkill(string title, string description, string category, uint256 duration, uint256 price, string contentHash)",
    "function getSkill(uint256 skillId) view returns (tuple(uint256 id, string title, string description, string category, uint256 duration, uint256 price, address instructor, bool isActive, uint256 totalStudents, uint256 averageRating, uint256 totalRatings, string contentHash, uint256 createdAt))",
    "function getSkillsByCategory(string category) view returns (uint256[])",
    "function getTotalSkills() view returns (uint256)",
    
    // Session functions
    "function startLearningSession(uint256 skillId)",
    "function completeSession(uint256 sessionId, uint256 assessmentScore, uint256 rating, string feedback)",
    "function getUserSessions(address user) view returns (uint256[])",
    
    // Gamification
    "function checkAchievements(address user) view returns (string[])",
    
    // Events
    "event SkillCreated(uint256 indexed skillId, address indexed instructor, string title)",
    "event SessionStarted(uint256 indexed sessionId, uint256 indexed skillId, address indexed student)",
    "event SessionCompleted(uint256 indexed sessionId, uint256 rating, uint256 tokensEarned)",
    "event AssessmentSubmitted(uint256 indexed sessionId, uint256 score, bool passed)"
];

class Web3Service {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.learnToken = null;
        this.learnPlatform = null;
        this.currentAccount = null;
        
        // Contract addresses (deploy and update these)
        this.LEARN_TOKEN_ADDRESS = process.env.LEARN_TOKEN_ADDRESS || '';
        this.LEARN_PLATFORM_ADDRESS = process.env.LEARN_PLATFORM_ADDRESS || '';
        
        // Network configuration
        this.NETWORK_CONFIG = {
            chainId: '0x89', // Polygon Mainnet
            chainName: 'Polygon',
            nativeCurrency: {
                name: 'MATIC',
                symbol: 'MATIC',
                decimals: 18
            },
            rpcUrls: ['https://polygon-rpc.com/'],
            blockExplorerUrls: ['https://polygonscan.com/']
        };
    }

    // Initialize Web3 connection
    async init() {
        if (typeof window !== 'undefined' && window.ethereum) {
            this.provider = new ethers.providers.Web3Provider(window.ethereum);
            await this.setupEventListeners();
            return true;
        }
        throw new Error('MetaMask not detected');
    }

    // Connect wallet
    async connectWallet() {
        try {
            if (!this.provider) {
                await this.init();
            }

            // Request account access
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });

            this.currentAccount = accounts[0];
            this.signer = this.provider.getSigner();

            // Initialize contracts
            this.learnToken = new ethers.Contract(
                this.LEARN_TOKEN_ADDRESS,
                LEARN_TOKEN_ABI,
                this.signer
            );

            this.learnPlatform = new ethers.Contract(
                this.LEARN_PLATFORM_ADDRESS,
                LEARN_PLATFORM_ABI,
                this.signer
            );

            // Switch to correct network if needed
            await this.switchToCorrectNetwork();

            return {
                account: this.currentAccount,
                network: await this.provider.getNetwork()
            };
        } catch (error) {
            console.error('Error connecting wallet:', error);
            throw error;
        }
    }

    // Switch to correct network (Polygon)
    async switchToCorrectNetwork() {
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: this.NETWORK_CONFIG.chainId }]
            });
        } catch (switchError) {
            // Network doesn't exist, add it
            if (switchError.code === 4902) {
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [this.NETWORK_CONFIG]
                });
            } else {
                throw switchError;
            }
        }
    }

    // Setup event listeners
    async setupEventListeners() {
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', (accounts) => {
                if (accounts.length === 0) {
                    this.disconnect();
                } else {
                    this.currentAccount = accounts[0];
                    window.location.reload(); // Reload to refresh UI
                }
            });

            window.ethereum.on('chainChanged', () => {
                window.location.reload();
            });
        }
    }

    // Disconnect wallet
    disconnect() {
        this.currentAccount = null;
        this.signer = null;
        this.learnToken = null;
        this.learnPlatform = null;
    }

    // User Management Functions
    async registerUser(username, isInstructor) {
        try {
            const tx = await this.learnPlatform.registerUser(username, isInstructor);
            return await tx.wait();
        } catch (error) {
            console.error('Error registering user:', error);
            throw error;
        }
    }

    async getUser(address = null) {
        try {
            const userAddress = address || this.currentAccount;
            return await this.learnPlatform.getUser(userAddress);
        } catch (error) {
            console.error('Error getting user:', error);
            throw error;
        }
    }

    // Token Functions
    async getTokenBalance(address = null) {
        try {
            const userAddress = address || this.currentAccount;
            const balance = await this.learnToken.balanceOf(userAddress);
            return ethers.utils.formatEther(balance);
        } catch (error) {
            console.error('Error getting token balance:', error);
            throw error;
        }
    }

    async approveTokens(amount) {
        try {
            const amountInWei = ethers.utils.parseEther(amount.toString());
            const tx = await this.learnToken.approve(this.LEARN_PLATFORM_ADDRESS, amountInWei);
            return await tx.wait();
        } catch (error) {
            console.error('Error approving tokens:', error);
            throw error;
        }
    }

    // Skill Functions
    async createSkill(skillData) {
        try {
            const { title, description, category, duration, price, contentHash } = skillData;
            const priceInWei = ethers.utils.parseEther(price.toString());
            
            const tx = await this.learnPlatform.createSkill(
                title,
                description,
                category,
                duration,
                priceInWei,
                contentHash
            );
            return await tx.wait();
        } catch (error) {
            console.error('Error creating skill:', error);
            throw error;
        }
    }

    async getSkill(skillId) {
        try {
            return await this.learnPlatform.getSkill(skillId);
        } catch (error) {
            console.error('Error getting skill:', error);
            throw error;
        }
    }

    async getSkillsByCategory(category) {
        try {
            return await this.learnPlatform.getSkillsByCategory(category);
        } catch (error) {
            console.error('Error getting skills by category:', error);
            throw error;
        }
    }

    async getAllSkills() {
        try {
            const totalSkills = await this.learnPlatform.getTotalSkills();
            const skills = [];
            
            for (let i = 1; i <= totalSkills.toNumber(); i++) {
                try {
                    const skill = await this.getSkill(i);
                    if (skill.isActive) {
                        skills.push({
                            ...skill,
                            id: skill.id.toNumber(),
                            duration: skill.duration.toNumber(),
                            price: ethers.utils.formatEther(skill.price),
                            totalStudents: skill.totalStudents.toNumber(),
                            averageRating: skill.averageRating.toNumber(),
                            totalRatings: skill.totalRatings.toNumber(),
                            createdAt: new Date(skill.createdAt.toNumber() * 1000)
                        });
                    }
                } catch (err) {
                    console.warn(Could not fetch skill ${i}:, err);
                }
            }
            
            return skills;
        } catch (error) {
            console.error('Error getting all skills:', error);
            throw error;
        }
    }

    // Learning Session Functions
    async startLearningSession(skillId) {
        try {
            // First get skill details to check price
            const skill = await this.getSkill(skillId);
            
            // Approve tokens for the session
            await this.approveTokens(ethers.utils.formatEther(skill.price));
            
            // Start the session
            const tx = await this.learnPlatform.startLearningSession(skillId);
            return await tx.wait();
        } catch (error) {
            console.error('Error starting learning session:', error);
            throw error;
        }
    }

    async completeSession(sessionId, assessmentScore, rating, feedback) {
        try {
            const tx = await this.learnPlatform.completeSession(
                sessionId,
                assessmentScore,
                rating,
                feedback
            );
            return await tx.wait();
        } catch (error) {
            console.error('Error completing session:', error);
            throw error;
        }
    }

    async getUserSessions(address = null) {
        try {
            const userAddress = address || this.currentAccount;
            return await this.learnPlatform.getUserSessions(userAddress);
        } catch (error) {
            console.error('Error getting user sessions:', error);
            throw error;
        }
    }

    // Gamification Functions
    async getAchievements(address = null) {
        try {
            const userAddress = address || this.currentAccount;
            return await this.learnPlatform.checkAchievements(userAddress);
        } catch (error) {
            console.error('Error getting achievements:', error);
            throw error;
        }
    }

    // Utility Functions
    formatTokenAmount(amount) {
        return ethers.utils.formatEther(amount);
    }

    parseTokenAmount(amount) {
        return ethers.utils.parseEther(amount.toString());
    }

    isConnected() {
        return this.currentAccount !== null && this.signer !== null;
    }

    getCurrentAccount() {
        return this.currentAccount;
    }

    // Event listening helpers
    onSkillCreated(callback) {
        if (this.learnPlatform) {
            this.learnPlatform.on('SkillCreated', callback);
        }
    }

    onSessionStarted(callback) {
        if (this.learnPlatform) {
            this.learnPlatform.on('SessionStarted', callback);
        }
    }

    onSessionCompleted(callback) {
        if (this.learnPlatform) {
            this.learnPlatform.on('SessionCompleted', callback);
        }
    }

    removeAllListeners() {
        if (this.learnPlatform) {
            this.learnPlatform.removeAllListeners();
        }
        if (this.learnToken) {
            this.learnToken.removeAllListeners();
        }
    }
}

// Export singleton instance
const web3Service = new Web3Service();

module.exports = { web3Service, Web3Service };