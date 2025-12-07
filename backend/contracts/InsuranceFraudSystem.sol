// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title InsuranceFraudSystem
 * @dev Smart contract for managing insurance claims with fraud detection
 */
contract InsuranceFraudSystem is Ownable {
    using Counters for Counters.Counter;

    // Enums
    enum FraudLevel {
        LOW,
        MEDIUM,
        HIGH
    }

    enum ClaimStatus {
        PENDING,
        APPROVED,
        REJECTED
    }

    enum ProviderStatus {
        PENDING,
        APPROVED,
        REJECTED
    }

    // Structs
    struct Patient {
        address patientAddress;
        string nationalIdHash;
        bool exists;
        uint256 registeredAt;
    }

    struct InsuranceProvider {
        address providerAddress;
        string name;
        ProviderStatus status;
        uint256 registeredAt;
    }

    struct Claim {
        uint256 id;
        address patient;
        address provider;
        uint256 amount;
        string claimType;
        string ipfsHashPayload;
        string ipfsHashFraudReport;
        uint8 fraudScore;
        FraudLevel fraudLevel;
        bool flagged;
        ClaimStatus status;
        uint256 createdAt;
        uint256 updatedAt;
    }

    // State variables
    mapping(address => Patient) public patients;
    mapping(address => InsuranceProvider) public providers;
    mapping(uint256 => Claim) public claims;
    mapping(address => uint256[]) public patientClaims;
    mapping(address => uint256[]) public providerClaims;

    Counters.Counter private claimIdCounter;

    address public fraudOracle;

    // Events
    event PatientRegistered(address indexed patient, string nationalIdHash);
    event ProviderRegistered(address indexed provider, string name);
    event ProviderApproved(address indexed provider);
    event ProviderRejected(address indexed provider);
    event ClaimCreated(
        uint256 indexed claimId,
        address indexed patient,
        address indexed provider,
        uint256 amount
    );
    event ClaimFraudEvaluated(
        uint256 indexed claimId,
        uint8 fraudScore,
        FraudLevel fraudLevel,
        bool flagged
    );
    event ClaimStatusChanged(uint256 indexed claimId, ClaimStatus status);
    event FraudOracleUpdated(address indexed newOracle);

    // Modifiers
    modifier onlyApprovedProvider(address provider) {
        require(
            providers[provider].status == ProviderStatus.APPROVED,
            "Provider not approved"
        );
        _;
    }

    modifier onlyFraudOracle() {
        require(
            msg.sender == owner() || msg.sender == fraudOracle,
            "Only fraud oracle or owner can call this"
        );
        _;
    }

    // Constructor
    constructor() {
        fraudOracle = msg.sender;
    }

    // Owner functions
    function setFraudOracle(address _fraudOracle) external onlyOwner {
        require(_fraudOracle != address(0), "Invalid oracle address");
        fraudOracle = _fraudOracle;
        emit FraudOracleUpdated(_fraudOracle);
    }

    function registerPatient(
        address _patientAddress,
        string memory _nationalIdHash
    ) external onlyOwner {
        require(_patientAddress != address(0), "Invalid patient address");
        require(bytes(_nationalIdHash).length > 0, "Invalid national ID hash");
        require(!patients[_patientAddress].exists, "Patient already registered");

        patients[_patientAddress] = Patient({
            patientAddress: _patientAddress,
            nationalIdHash: _nationalIdHash,
            exists: true,
            registeredAt: block.timestamp
        });

        emit PatientRegistered(_patientAddress, _nationalIdHash);
    }

    function registerProvider(
        address _providerAddress,
        string memory _name
    ) external onlyOwner {
        require(_providerAddress != address(0), "Invalid provider address");
        require(bytes(_name).length > 0, "Invalid provider name");

        providers[_providerAddress] = InsuranceProvider({
            providerAddress: _providerAddress,
            name: _name,
            status: ProviderStatus.PENDING,
            registeredAt: block.timestamp
        });

        emit ProviderRegistered(_providerAddress, _name);
    }

    function approveProvider(address _providerAddress) external onlyOwner {
        require(
            providers[_providerAddress].providerAddress != address(0),
            "Provider not found"
        );
        providers[_providerAddress].status = ProviderStatus.APPROVED;
        emit ProviderApproved(_providerAddress);
    }

    function rejectProvider(address _providerAddress) external onlyOwner {
        require(
            providers[_providerAddress].providerAddress != address(0),
            "Provider not found"
        );
        providers[_providerAddress].status = ProviderStatus.REJECTED;
        emit ProviderRejected(_providerAddress);
    }

    // Claim functions
    function createClaim(
        address _patientAddress,
        address _providerAddress,
        uint256 _amount,
        string memory _claimType,
        string memory _ipfsHashPayload
    ) external onlyApprovedProvider(_providerAddress) returns (uint256) {
        require(patients[_patientAddress].exists, "Patient not registered");
        require(_amount > 0, "Amount must be greater than 0");
        require(bytes(_claimType).length > 0, "Invalid claim type");
        require(bytes(_ipfsHashPayload).length > 0, "Invalid IPFS hash");

        uint256 claimId = claimIdCounter.current();
        claimIdCounter.increment();

        claims[claimId] = Claim({
            id: claimId,
            patient: _patientAddress,
            provider: _providerAddress,
            amount: _amount,
            claimType: _claimType,
            ipfsHashPayload: _ipfsHashPayload,
            ipfsHashFraudReport: "",
            fraudScore: 0,
            fraudLevel: FraudLevel.LOW,
            flagged: false,
            status: ClaimStatus.PENDING,
            createdAt: block.timestamp,
            updatedAt: block.timestamp
        });

        patientClaims[_patientAddress].push(claimId);
        providerClaims[_providerAddress].push(claimId);

        emit ClaimCreated(claimId, _patientAddress, _providerAddress, _amount);

        return claimId;
    }

    function setFraudResultForClaim(
        uint256 _claimId,
        uint8 _fraudScore,
        FraudLevel _fraudLevel,
        bool _flagged,
        string memory _ipfsHashFraudReport
    ) external onlyFraudOracle {
        require(claims[_claimId].id == _claimId, "Claim not found");
        require(_fraudScore <= 100, "Fraud score must be 0-100");

        claims[_claimId].fraudScore = _fraudScore;
        claims[_claimId].fraudLevel = _fraudLevel;
        claims[_claimId].flagged = _flagged;
        claims[_claimId].ipfsHashFraudReport = _ipfsHashFraudReport;
        claims[_claimId].updatedAt = block.timestamp;

        emit ClaimFraudEvaluated(_claimId, _fraudScore, _fraudLevel, _flagged);
    }

    function approveClaim(uint256 _claimId) external onlyOwner {
        require(claims[_claimId].id == _claimId, "Claim not found");
        require(
            claims[_claimId].status == ClaimStatus.PENDING,
            "Claim is not pending"
        );

        claims[_claimId].status = ClaimStatus.APPROVED;
        claims[_claimId].updatedAt = block.timestamp;

        emit ClaimStatusChanged(_claimId, ClaimStatus.APPROVED);
    }

    function rejectClaim(uint256 _claimId) external onlyOwner {
        require(claims[_claimId].id == _claimId, "Claim not found");
        require(
            claims[_claimId].status == ClaimStatus.PENDING,
            "Claim is not pending"
        );

        claims[_claimId].status = ClaimStatus.REJECTED;
        claims[_claimId].updatedAt = block.timestamp;

        emit ClaimStatusChanged(_claimId, ClaimStatus.REJECTED);
    }

    // View functions
    function getPatientClaimsCount(address _patientAddress)
        external
        view
        returns (uint256)
    {
        return patientClaims[_patientAddress].length;
    }

    function getProviderClaimsCount(address _providerAddress)
        external
        view
        returns (uint256)
    {
        return providerClaims[_providerAddress].length;
    }

    function getPatientClaim(address _patientAddress, uint256 _index)
        external
        view
        returns (uint256)
    {
        require(_index < patientClaims[_patientAddress].length, "Index out of bounds");
        return patientClaims[_patientAddress][_index];
    }

    function getProviderClaim(address _providerAddress, uint256 _index)
        external
        view
        returns (uint256)
    {
        require(_index < providerClaims[_providerAddress].length, "Index out of bounds");
        return providerClaims[_providerAddress][_index];
    }

    function getClaimDetails(uint256 _claimId)
        external
        view
        returns (Claim memory)
    {
        require(claims[_claimId].id == _claimId, "Claim not found");
        return claims[_claimId];
    }

    function isPatientRegistered(address _patientAddress)
        external
        view
        returns (bool)
    {
        return patients[_patientAddress].exists;
    }

    function isProviderApproved(address _providerAddress)
        external
        view
        returns (bool)
    {
        return providers[_providerAddress].status == ProviderStatus.APPROVED;
    }

    function getTotalClaimsCount() external view returns (uint256) {
        return claimIdCounter.current();
    }
}
