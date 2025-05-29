import Conversation from "../models/Conversation.model.js";
import ChatMessage from "../models/ChatMessage.model.js";
import User from "../models/User.model.js";
import Product from "../models/Product.model.js";
import Order from "../models/Order.model.js";
import OrderItem from "../models/OrderItem.model.js";
import ApiError from "../errors/ApiError.js";
import httpStatusCodes from "http-status-codes";
import logger from "../utils/logger.js";

/**
 * Lists conversations for the authenticated user.
 * @param {string} authUserId - ID of the authenticated user.
 * @param {typeof import('../dtos/conversation.dto.js').listConversationsQuerySchema._input.query} queryOptions - Options for filtering, sorting, and pagination.
 * @returns {Promise<{results: Array<Object>, page: number, limit: number, totalPages: number, totalResults: number}>} Paginated conversations.
 */
const listUserConversations = async (authUserId, queryOptions) => {
  const { page, limit, status, sort_by } = queryOptions;

  const filter = {
    $or: [{ buyerId: authUserId }, { sellerId: authUserId }],
  };

  // Apply status filter based on whether the user is buyer or seller in the conversation
  if (status) {
    filter.$or = filter.$or.map((condition) => ({
      ...condition,
      ...(condition.buyerId === authUserId ? { statusByBuyer: status } : {}),
      ...(condition.sellerId === authUserId ? { statusBySeller: status } : {}),
    }));
  }

  const sortOptions = {};
  if (sort_by === "last_message_at") {
    sortOptions.lastMessageAt = -1;
  } else if (sort_by === "unread_count") {
    // This sort is tricky as unread count is specific to user's role in convo
    // For simplicity, we can sort by lastMessageAt if unread_count is chosen or implement more complex aggregation.
    // Let's default to lastMessageAt for now if 'unread_count' is chosen.
    // A better approach would be to project the correct unread count for the authUser and sort on that.
    sortOptions.lastMessageAt = -1; // Placeholder, refine if exact unread sort is critical
  } else {
    sortOptions.lastMessageAt = -1; // Default
  }

  const skip = (page - 1) * limit;

  const conversations = await Conversation.find(filter)
    .populate("buyerId", "firstName lastName profilePictureUrl") // Populate for 'otherParticipant'
    .populate("sellerId", "firstName lastName profilePictureUrl") // Populate for 'otherParticipant'
    // .populate('productId', 'name slug imageUrl') // Optional: context for list item
    .sort(sortOptions)
    .skip(skip)
    .limit(limit)
    .lean();

  const totalResults = await Conversation.countDocuments(filter);
  const totalPages = Math.ceil(totalResults / limit);

  const formattedResults = conversations.map((convo) => {
    const isAuthUserBuyer = convo.buyerId._id.toString() === authUserId;
    const otherParticipant = isAuthUserBuyer ? convo.sellerId : convo.buyerId;
    return {
      id: convo._id,
      otherParticipant: {
        userId: otherParticipant._id,
        name: `${otherParticipant.firstName} ${otherParticipant.lastName}`, // Could be storeName for seller
        profilePictureUrl: otherParticipant.profilePictureUrl,
      },
      lastMessageSnippet: convo.lastMessageSnippet,
      lastMessageAt: convo.lastMessageAt,
      unreadCount: isAuthUserBuyer
        ? convo.buyerUnreadCount
        : convo.sellerUnreadCount,
      status: isAuthUserBuyer ? convo.statusByBuyer : convo.statusBySeller,
      createdAt: convo.createdAt,
      updatedAt: convo.updatedAt,
    };
  });

  return {
    results: formattedResults,
    page,
    limit,
    totalPages,
    totalResults,
  };
};

/**
 * Gets details of a specific conversation if the user is a participant.
 * @param {string} authUserId - ID of the authenticated user.
 * @param {string} conversationId - ID of the conversation.
 * @returns {Promise<Object>} The conversation details.
 */
const getConversationDetails = async (authUserId, conversationId) => {
  const conversation = await Conversation.findOne({
    _id: conversationId,
    $or: [{ buyerId: authUserId }, { sellerId: authUserId }],
  })
    .populate("buyerId", "firstName lastName profilePictureUrl")
    .populate("sellerId", "firstName lastName profilePictureUrl")
    .populate("productId", "name slug imageUrl basePrice currency") // Populate product context
    // .populate('orderId', '...') // Populate order context if needed
    .lean();

  if (!conversation) {
    throw new ApiError(
      httpStatusCodes.NOT_FOUND,
      "Conversation not found or you are not a participant.",
    );
  }

  // Format for response, similar to list item but could be more detailed
  const isAuthUserBuyer = conversation.buyerId._id.toString() === authUserId;
  const otherParticipant = isAuthUserBuyer
    ? conversation.sellerId
    : conversation.buyerId;

  const formattedConvo = {
    id: conversation._id,
    otherParticipant: {
      userId: otherParticipant._id,
      name: `${otherParticipant.firstName} ${otherParticipant.lastName}`,
      profilePictureUrl: otherParticipant.profilePictureUrl,
    },
    lastMessageSnippet: conversation.lastMessageSnippet,
    lastMessageAt: conversation.lastMessageAt,
    unreadCount: isAuthUserBuyer
      ? conversation.buyerUnreadCount
      : conversation.sellerUnreadCount,
    status: isAuthUserBuyer
      ? conversation.statusByBuyer
      : conversation.statusBySeller,
    productContext: conversation.productId || null,
    orderContext: conversation.orderId || null, // Populate and format if needed
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
  };

  // Optionally, fetch recent messages (or paginate them via a separate endpoint)
  // For now, not including messages in this detail view for simplicity.
  // formattedConvo.messages = await ChatMessage.find({ conversationId }).sort({ sentAt: -1 }).limit(20).lean();

  // Mark messages as read for this user if they are viewing the conversation
  if (isAuthUserBuyer) {
    await ChatMessage.updateMany(
      { conversationId, receiverId: authUserId, readAt: null },
      { $set: { readAt: new Date() } },
    );
    if (conversation.buyerUnreadCount > 0) {
      await Conversation.updateOne(
        { _id: conversationId },
        { $set: { buyerUnreadCount: 0 } },
      );
      formattedConvo.unreadCount = 0; // Reflect change in response
    }
  } else {
    // Auth user is seller
    await ChatMessage.updateMany(
      { conversationId, receiverId: authUserId, readAt: null },
      { $set: { readAt: new Date() } },
    );
    if (conversation.sellerUnreadCount > 0) {
      await Conversation.updateOne(
        { _id: conversationId },
        { $set: { sellerUnreadCount: 0 } },
      );
      formattedConvo.unreadCount = 0; // Reflect change in response
    }
  }

  return formattedConvo;
};

/**
 * Sends a message in a conversation.
 * @param {string} authUserId - ID of the sender.
 * @param {string} conversationId - ID of the conversation.
 * @param {typeof import('../dtos/conversation.dto.js').sendMessageSchema._input.body} messageData - Message content.
 * @returns {Promise<InstanceType<typeof ChatMessage>>} The created chat message.
 */
const sendMessageInConversation = async (
  authUserId,
  conversationId,
  messageData,
) => {
  const conversation = await Conversation.findOne({
    _id: conversationId,
    $or: [{ buyerId: authUserId }, { sellerId: authUserId }],
  });

  if (!conversation) {
    throw new ApiError(
      httpStatusCodes.NOT_FOUND,
      "Conversation not found or you are not a participant.",
    );
  }

  const isAuthUserBuyer = conversation.buyerId.toString() === authUserId;
  const receiverId = isAuthUserBuyer
    ? conversation.sellerId.toString()
    : conversation.buyerId.toString();

  const chatMessage = await ChatMessage.create({
    conversationId,
    senderId: authUserId,
    receiverId,
    messageText: messageData.messageText,
    messageType: messageData.messageType || "text",
    sentAt: new Date(),
  });

  // Update conversation with last message details and unread counts
  conversation.lastMessageSnippet = messageData.messageText.substring(0, 100); // Snippet
  conversation.lastMessageAt = chatMessage.sentAt;
  if (isAuthUserBuyer) {
    conversation.sellerUnreadCount = (conversation.sellerUnreadCount || 0) + 1;
  } else {
    conversation.buyerUnreadCount = (conversation.buyerUnreadCount || 0) + 1;
  }
  await conversation.save();

  // TODO: Trigger WebSocket event here for real-time delivery

  return chatMessage.toObject(); // Return plain object
};

/**
 * Initiates a new conversation or gets an existing one for a buyer.
 * @param {string} buyerId - ID of the buyer initiating.
 * @param {typeof import('../dtos/conversation.dto.js').initiateConversationSchema._input.body} data - Conversation initiation data.
 * @returns {Promise<Object>} The conversation object (created or existing).
 */
const createOrGetConversationForBuyer = async (buyerId, data) => {
  const { productId, orderId, sellerUserId, initialMessageText } = data;
  let targetSellerId;
  const contextProductId = productId; // Keep original productId for convo record
  const contextOrderId = orderId; // Keep original orderId for convo record

  if (productId) {
    const product = await Product.findById(productId).select("sellerId");
    if (!product)
      throw new ApiError(
        httpStatusCodes.NOT_FOUND,
        "Product context not found.",
      );
    targetSellerId = product.sellerId.toString();
  } else if (orderId) {
    // To find seller from order, we need to look at OrderItems
    const order = await Order.findById(orderId).select("userId"); // Buyer is order.userId
    if (!order || order.userId.toString() !== buyerId) {
      throw new ApiError(
        httpStatusCodes.NOT_FOUND,
        "Order context not found or does not belong to you.",
      );
    }
    // Assuming single-seller per order for simplicity here. Multi-seller orders need item-specific seller.
    // Find first item's seller (this is a simplification)
    const orderItem = await OrderItem.findOne({ orderId }).select("sellerId");
    if (!orderItem)
      throw new ApiError(
        httpStatusCodes.INTERNAL_SERVER_ERROR,
        "Could not determine seller from order items.",
      );
    targetSellerId = orderItem.sellerId.toString();
  } else if (sellerUserId) {
    const seller = await User.findById(sellerUserId).select("_id roles");
    if (!seller || !seller.roles.includes("seller")) {
      throw new ApiError(
        httpStatusCodes.NOT_FOUND,
        "Target seller not found or is not a seller.",
      );
    }
    targetSellerId = seller._id.toString();
  } else {
    // This case should be caught by DTO validation, but as a safeguard:
    throw new ApiError(
      httpStatusCodes.BAD_REQUEST,
      "A context (productId, orderId, or sellerUserId) is required.",
    );
  }

  if (buyerId === targetSellerId) {
    throw new ApiError(
      httpStatusCodes.BAD_REQUEST,
      "Cannot start a conversation with yourself.",
    );
  }

  // Find existing conversation based on context (if any)
  const existingConversationFilter = {
    buyerId,
    sellerId: targetSellerId,
  };
  if (contextProductId) existingConversationFilter.productId = contextProductId;
  else if (contextOrderId) existingConversationFilter.orderId = contextOrderId;
  // If only sellerUserId, we might have multiple general convos.
  // Policy: if no product/order, a general convo might exist or a new one is created.
  // For now, if specific context (product/order) not given, it will create a new one or find one without product/order ID.

  let conversation = await Conversation.findOne(existingConversationFilter);

  if (!conversation) {
    conversation = await Conversation.create({
      buyerId,
      sellerId: targetSellerId,
      productId: contextProductId || null,
      orderId: contextOrderId || null,
      // Initial status for buyer and seller
      statusByBuyer: "active",
      statusBySeller: "active",
    });
  }

  // Send the initial message
  const message = await sendMessageInConversation(
    buyerId,
    conversation._id.toString(),
    {
      messageText: initialMessageText,
      messageType: "text", // Default
    },
  );
  // sendMessageInConversation already updates convo lastMessageAt, snippet, and unread counts.

  // Populate for response (similar to getConversationDetails)
  const populatedConversation = await getConversationDetails(
    buyerId,
    conversation._id.toString(),
  );
  return populatedConversation; // This already includes the unread count logic for the buyer
};

export const conversationService = {
  listUserConversations,
  getConversationDetails,
  sendMessageInConversation,
  createOrGetConversationForBuyer,
};
