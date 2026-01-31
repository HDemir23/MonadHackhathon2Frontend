import { parseAbi } from 'viem';

export const CONTRACT_ADDRESS = "0x431786033Ea6c0B083378A9091DdDab452A92Ddc" as const;

const humanReadableAbi = [
  // Write
  "function createPool(bytes32 _commitHash) external payable returns (uint256)",
  "function buyTicket(uint256 poolId) external payable",
  "function buyTickets(uint256 poolId, uint256 quantity) external payable",
  "function revealWinners(uint256 poolId, bytes32 _secret) external",
  "function claimPrize(uint256 poolId, uint256 ticketId) external",
  "function claimPrizes(uint256 poolId, uint256[] calldata ticketIds) external",
  "function creatorWithdraw(uint256 poolId) external",
  "function refundTicket(uint256 poolId, uint256 ticketId) external",
  "function refundCreator(uint256 poolId) external",
  "function expiredPoolRefund(uint256 poolId, uint256 ticketId) external",
  "function expiredPoolCreatorRefund(uint256 poolId) external",

  // Read
  "function getPoolDetails(uint256 poolId) external view returns (address, uint256, uint256, uint256, bool, bytes32, uint256, bool)",
  "function getTicketOwner(uint256 poolId, uint256 ticketId) external view returns (address)",
  "function getWinnerTier(uint256 poolId, uint256 ticketId) external view returns (uint256)",
  "function calculatePrizePreview(uint256 poolId, uint256 ticketId) external view returns (uint256)",
  "function calculatePrize(uint256 totalDeposit, uint256 tier) external pure returns (uint256)",
  "function isPoolFull(uint256 poolId) external view returns (bool)",
  "function isClaimed(uint256 poolId, uint256 ticketId) external view returns (bool)",
  "function getTicketsBoughtBy(uint256 poolId, address buyer) external view returns (uint256)",
  "function getPoolCreatedAt(uint256 poolId) external view returns (uint256)",
  "function isCreatorRefunded(uint256 poolId) external view returns (bool)",
  "function getCreatorDeposit(uint256 poolId) external view returns (uint256)",
  "function poolIdCounter() external view returns (uint256)",
  "function accumulatedProtocolFees() external view returns (uint256)",

  // Events
  "event PoolCreated(uint256 indexed poolId, address indexed creator, uint256 ticketPrice)",
  "event TicketPurchased(uint256 indexed poolId, address indexed buyer, uint256 ticketId)",
  "event PoolRevealed(uint256 indexed poolId, uint256 revealBlock)",
  "event PrizeClaimed(uint256 indexed poolId, address indexed winner, uint256 amount)",
  "event TicketRefunded(uint256 indexed poolId, address indexed buyer, uint256 ticketId)",
  "event CreatorRefunded(uint256 indexed poolId, address indexed creator, uint256 amount)",
] as const;

export const CONTRACT_ABI = parseAbi(humanReadableAbi);
