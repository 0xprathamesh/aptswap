// SPDX-License-Identifier: MIT

pragma solidity 0.8.23;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IOrderMixin} from "@1inch/limit-order-protocol/contracts/interfaces/IOrderMixin.sol";
import {TakerTraits} from "@1inch/limit-order-protocol/contracts/libraries/TakerTraitsLib.sol";
import {RevertReasonForwarder} from "@1inch/solidity-utils/contracts/libraries/RevertReasonForwarder.sol";
import {AddressLib} from "@1inch/solidity-utils/contracts/libraries/AddressLib.sol";

/**
 * @title Cross-Swaps Resolver contract for cross-chain atomic swaps
 * @dev Extends 1inch functionality to unsupported chains
 * @custom:security-contact security@cross-swaps.com
 */
contract CrossSwapsResolver is Ownable {
    error InvalidLength();
    error LengthMismatch();
    error InvalidChain();
    error InvalidToken();
    error InsufficientBalance();

    IOrderMixin private immutable _LOP;

    // Chain configuration
    mapping(uint256 => bool) public supportedChains;
    mapping(uint256 => mapping(address => bool)) public supportedTokens;

    // Events
    event ChainSupported(uint256 indexed chainId, bool supported);
    event TokenSupported(
        uint256 indexed chainId,
        address indexed token,
        bool supported
    );
    event SwapExecuted(
        bytes32 indexed orderHash,
        address indexed maker,
        address indexed taker,
        uint256 srcChainId,
        uint256 dstChainId,
        address srcToken,
        address dstToken,
        uint256 srcAmount,
        uint256 dstAmount
    );

    constructor(IOrderMixin lop, address initialOwner) Ownable(initialOwner) {
        _LOP = lop;
    }

    receive() external payable {} // solhint-disable-line no-empty-blocks

    /**
     * @notice Execute order with cross-chain support
     */
    function executeOrder(
        IOrderMixin.Order calldata order,
        bytes32 r,
        bytes32 vs,
        uint256 amount,
        TakerTraits takerTraits,
        bytes calldata args
    ) external payable onlyOwner {
        // Execute the order
        _LOP.fillOrderArgs(order, r, vs, amount, takerTraits, args);

        emit SwapExecuted(
            bytes32(0), // Default order hash
            AddressLib.get(order.maker),
            msg.sender,
            1, // Default chain ID
            1, // Default chain ID
            address(0), // Default token
            address(0), // Default token
            0, // Default amount
            0 // Default amount
        );
    }

    /**
     * @notice Execute arbitrary calls (for complex swaps)
     */
    function arbitraryCalls(
        address[] calldata targets,
        bytes[] calldata arguments
    ) external onlyOwner {
        uint256 length = targets.length;
        if (targets.length != arguments.length) revert LengthMismatch();

        for (uint256 i = 0; i < length; ++i) {
            (bool success, ) = targets[i].call(arguments[i]);
            if (!success) RevertReasonForwarder.reRevert();
        }
    }

    /**
     * @notice Set chain support
     */
    function setChainSupport(
        uint256 chainId,
        bool supported
    ) external onlyOwner {
        supportedChains[chainId] = supported;
        emit ChainSupported(chainId, supported);
    }

    /**
     * @notice Set token support for a chain
     */
    function setTokenSupport(
        uint256 chainId,
        address token,
        bool supported
    ) external onlyOwner {
        supportedTokens[chainId][token] = supported;
        emit TokenSupported(chainId, token, supported);
    }

    /**
     * @notice Batch set token support
     */
    function batchSetTokenSupport(
        uint256 chainId,
        address[] calldata tokens,
        bool[] calldata supported
    ) external onlyOwner {
        if (tokens.length != supported.length) revert LengthMismatch();

        for (uint256 i = 0; i < tokens.length; i++) {
            supportedTokens[chainId][tokens[i]] = supported[i];
            emit TokenSupported(chainId, tokens[i], supported[i]);
        }
    }

    /**
     * @notice Get limit order protocol address
     */
    function getLimitOrderProtocol() external view returns (address) {
        return address(_LOP);
    }

    /**
     * @notice Check if chain is supported
     */
    function isChainSupported(uint256 chainId) external view returns (bool) {
        return supportedChains[chainId];
    }

    /**
     * @notice Check if token is supported on chain
     */
    function isTokenSupported(
        uint256 chainId,
        address token
    ) external view returns (bool) {
        return supportedTokens[chainId][token];
    }
}
