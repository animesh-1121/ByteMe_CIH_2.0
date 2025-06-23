// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

// Learning Token Contract
contract LearnToken is ERC20, Ownable {
    constructor() ERC20("LearnToken", "LEARN") {
        _mint(msg.sender, 1000000 * 10**decimals()); // Initial supply
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}

// Main Learning Platform Contract
contract LearnPlatform is ReentrancyGuard, Ownable {
    using Counters for Counters.Counter;
    
    LearnToken public learnToken;
    Counters.Counter private _skillIds;
    Counters.Counter private _sessionIds;
    
    // Structs
    struct Skill {
        uint256 id;
        string title;
        string description;
        string category;
        uint256 duration; // in minutes
        uint256 price; // in LEARN tokens
        address instructor;
        bool isActive;
        uint256 totalStudents;
        uint256 averageRating;
        uint256 totalRatings;
        string contentHash; // IPFS hash for skill content
        uint256 createdAt;
    }
    
    struct User {
        address userAddress;
        string username;
        uint256 totalSkillsTaught;
        uint256 totalSkillsLearned;
        uint256 reputationScore;
        uint256 tokensEarned;
        uint256 tokensSpent;
        bool isInstructor;
        uint256[] skillsOwned;
        uint256[] skillsCreated;
    }
    
    struct LearningSession {
        uint256 id;
        uint256 skillId;
        address student;
        address instructor;
        uint256 startTime;
        uint256 endTime;
        bool completed;
        uint256 rating;
        bool hasRated;
        uint256 tokensStaked;
    }
    
    struct Assessment {
        uint256 sessionId;
        uint256 score;
        bool passed;
        string feedback;
        uint256 timestamp;
    }
    
    // Mappings
    mapping(uint256 => Skill) public skills;
    mapping(address => User) public users;
    mapping(uint256 => LearningSession) public sessions;
    mapping(uint256 => Assessment) public assessments;
    mapping(address => mapping(uint256 => bool)) public hasLearned;
    mapping(address => uint256[]) public userSessions;
    
    // Events
    event SkillCreated(uint256 indexed skillId, address indexed instructor, string title);
    event SessionStarted(uint256 indexed sessionId, uint256 indexed skillId, address indexed student);
    event SessionCompleted(uint256 indexed sessionId, uint256 rating, uint256 tokensEarned);
    event AssessmentSubmitted(uint256 indexed sessionId, uint256 score, bool passed);
    event ReputationUpdated(address indexed user, uint256 newScore);
    event TokensEarned(address indexed user, uint256 amount);
    
    // Constants
    uint256 public constant REPUTATION_MULTIPLIER = 10;
    uint256 public constant COMPLETION_BONUS = 5 * 10**18; // 5 LEARN tokens
    uint256 public constant ASSESSMENT_THRESHOLD = 70; // 70% to pass
    
    constructor(address _learnToken) {
        learnToken = LearnToken(_learnToken);
    }
    
    // User Management
    function registerUser(string memory _username, bool _isInstructor) public {
        require(bytes(users[msg.sender].username).length == 0, "User already registered");
        
        users[msg.sender] = User({
            userAddress: msg.sender,
            username: _username,
            totalSkillsTaught: 0,
            totalSkillsLearned: 0,
            reputationScore: 100, // Starting reputation
            tokensEarned: 0,
            tokensSpent: 0,
            isInstructor: _isInstructor,
            skillsOwned: new uint256[](0),
            skillsCreated: new uint256[](0)
        });
        
        // Give welcome bonus
        learnToken.mint(msg.sender, 50 * 10**18); // 50 LEARN tokens
    }
    
    // Skill Management
    function createSkill(
        string memory _title,
        string memory _description,
        string memory _category,
        uint256 _duration,
        uint256 _price,
        string memory _contentHash
    ) public {
        require(users[msg.sender].isInstructor, "Only instructors can create skills");
        require(_duration >= 5 && _duration <= 10, "Duration must be 5-10 minutes");
        
        _skillIds.increment();
        uint256 skillId = _skillIds.current();
        
        skills[skillId] = Skill({
            id: skillId,
            title: _title,
            description: _description,
            category: _category,
            duration: _duration,
            price: _price,
            instructor: msg.sender,
            isActive: true,
            totalStudents: 0,
            averageRating: 0,
            totalRatings: 0,
            contentHash: _contentHash,
            createdAt: block.timestamp
        });
        
        users[msg.sender].skillsCreated.push(skillId);
        users[msg.sender].totalSkillsTaught++;
        
        emit SkillCreated(skillId, msg.sender, _title);
    }
    
    // Learning Session Management
    function startLearningSession(uint256 _skillId) public nonReentrant {
        require(skills[_skillId].isActive, "Skill not active");
        require(!hasLearned[msg.sender][_skillId], "Already learned this skill");
        require(skills[_skillId].instructor != msg.sender, "Cannot learn your own skill");
        
        uint256 price = skills[_skillId].price;
        require(learnToken.balanceOf(msg.sender) >= price, "Insufficient tokens");
        
        // Transfer tokens to contract (will be distributed after completion)
        learnToken.transferFrom(msg.sender, address(this), price);
        
        _sessionIds.increment();
        uint256 sessionId = _sessionIds.current();
        
        sessions[sessionId] = LearningSession({
            id: sessionId,
            skillId: _skillId,
            student: msg.sender,
            instructor: skills[_skillId].instructor,
            startTime: block.timestamp,
            endTime: 0,
            completed: false,
            rating: 0,
            hasRated: false,
            tokensStaked: price
        });
        
        userSessions[msg.sender].push(sessionId);
        users[msg.sender].tokensSpent += price;
        
        emit SessionStarted(sessionId, _skillId, msg.sender);
    }
    
    // Complete Learning Session with Assessment
    function completeSession(
        uint256 _sessionId,
        uint256 _assessmentScore,
        uint256 _rating,
        string memory _feedback
    ) public {
        require(sessions[_sessionId].student == msg.sender, "Not your session");
        require(!sessions[_sessionId].completed, "Session already completed");
        require(_rating >= 1 && _rating <= 5, "Rating must be 1-5");
        require(_assessmentScore <= 100, "Score cannot exceed 100");
        
        LearningSession storage session = sessions[_sessionId];
        session.completed = true;
        session.endTime = block.timestamp;
        session.rating = _rating;
        session.hasRated = true;
        
        // Create assessment record
        assessments[_sessionId] = Assessment({
            sessionId: _sessionId,
            score: _assessmentScore,
            passed: _assessmentScore >= ASSESSMENT_THRESHOLD,
            feedback: _feedback,
            timestamp: block.timestamp
        });
        
        uint256 skillId = session.skillId;
        address instructor = session.instructor;
        
        // Update skill statistics
        skills[skillId].totalStudents++;
        skills[skillId].totalRatings++;
        skills[skillId].averageRating = 
            (skills[skillId].averageRating * (skills[skillId].totalRatings - 1) + _rating) / 
            skills[skillId].totalRatings;
        
        // Mark as learned
        hasLearned[msg.sender][skillId] = true;
        users[msg.sender].skillsOwned.push(skillId);
        users[msg.sender].totalSkillsLearned++;
        
        // Distribute tokens based on assessment
        uint256 tokensToInstructor = session.tokensStaked;
        uint256 bonusTokens = 0;
        
        if (assessments[_sessionId].passed) {
            bonusTokens = COMPLETION_BONUS;
            learnToken.mint(msg.sender, bonusTokens);
            users[msg.sender].tokensEarned += bonusTokens;
        }
        
        // Transfer payment to instructor
        learnToken.transfer(instructor, tokensToInstructor);
        users[instructor].tokensEarned += tokensToInstructor;
        
        // Update reputation scores
        _updateReputation(msg.sender, _assessmentScore, true);
        _updateReputation(instructor, _rating * 20, false); // Convert 1-5 rating to 20-100 scale
        
        emit SessionCompleted(_sessionId, _rating, tokensToInstructor + bonusTokens);
        emit AssessmentSubmitted(_sessionId, _assessmentScore, assessments[_sessionId].passed);
    }
    
    // Internal function to update reputation
    function _updateReputation(address _user, uint256 _score, bool _isStudent) internal {
        uint256 currentReputation = users[_user].reputationScore;
        uint256 newReputation;
        
        if (_isStudent) {
            // Student reputation based on assessment performance
            newReputation = (currentReputation * 9 + _score) / 10;
        } else {
            // Instructor reputation based on student ratings
            newReputation = (currentReputation * 9 + _score) / 10;
        }
        
        users[_user].reputationScore = newReputation;
        emit ReputationUpdated(_user, newReputation);
    }
    
    // Gamification - Achievement System
    function checkAchievements(address _user) public view returns (string[] memory) {
        User memory user = users[_user];
        string[] memory achievements = new string[](10);
        uint256 count = 0;
        
        if (user.totalSkillsLearned >= 5) {
            achievements[count] = "Quick Learner";
            count++;
        }
        if (user.totalSkillsTaught >= 3) {
            achievements[count] = "Knowledge Sharer";
            count++;
        }
        if (user.reputationScore >= 800) {
            achievements[count] = "Reputation Master";
            count++;
        }
        if (user.tokensEarned >= 100 * 10**18) {
            achievements[count] = "Token Collector";
            count++;
        }
        
        // Resize array to actual count
        string[] memory result = new string[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = achievements[i];
        }
        
        return result;
    }
    
    // View Functions
    function getSkill(uint256 _skillId) public view returns (Skill memory) {
        return skills[_skillId];
    }
    
    function getUser(address _userAddress) public view returns (User memory) {
        return users[_userAddress];
    }
    
    function getUserSessions(address _user) public view returns (uint256[] memory) {
        return userSessions[_user];
    }
    
    function getSkillsByCategory(string memory _category) public view returns (uint256[] memory) {
        uint256[] memory categorySkills = new uint256[](_skillIds.current());
        uint256 count = 0;
        
        for (uint256 i = 1; i <= _skillIds.current(); i++) {
            if (keccak256(bytes(skills[i].category)) == keccak256(bytes(_category)) && skills[i].isActive) {
                categorySkills[count] = i;
                count++;
            }
        }
        
        // Resize array
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = categorySkills[i];
        }
        
        return result;
    }
    
    function getTotalSkills() public view returns (uint256) {
        return _skillIds.current();
    }
    
    function getTotalSessions() public view returns (uint256) {
        return _sessionIds.current();
    }
    
    // Admin Functions
    function deactivateSkill(uint256 _skillId) public {
        require(skills[_skillId].instructor == msg.sender || msg.sender == owner(), "Not authorized");
        skills[_skillId].isActive = false;
    }
    
    function emergencyWithdraw() public onlyOwner {
        uint256 balance = learnToken.balanceOf(address(this));
        learnToken.transfer(owner(), balance);
    }
}