import httpStatusCodes from "http-status-codes";
import { conversationService } from "../services/conversation.service.js";
import catchAsync from "../utils/catchAsync.js";
import pick from "../utils/pick.js";

/**
 * Controller to list conversations for the authenticated user.
 * @type {import('express').RequestHandler}
 */
const listMyConversations = catchAsync(async (req, res) => {
  const queryOptions = pick(req.query, ["page", "limit", "status", "sort_by"]);
  const result = await conversationService.listUserConversations(
    req.user.id,
    queryOptions,
  );
  res.status(httpStatusCodes.OK).send(result);
});

/**
 * Controller to get details of a specific conversation.
 * @type {import('express').RequestHandler}
 */
const getConversationDetails = catchAsync(async (req, res) => {
  const conversation = await conversationService.getConversationDetails(
    req.user.id,
    req.params.conversationId,
  );
  res.status(httpStatusCodes.OK).send(conversation);
});

/**
 * Controller to send a message in a conversation.
 * @type {import('express').RequestHandler}
 */
const sendMessage = catchAsync(async (req, res) => {
  const message = await conversationService.sendMessageInConversation(
    req.user.id,
    req.params.conversationId,
    req.body,
  );
  res.status(httpStatusCodes.CREATED).send(message);
});

/**
 * Controller for a buyer to initiate a new conversation.
 * Mounted under POST /conversations
 * @type {import('express').RequestHandler}
 */
const initiateConversation = catchAsync(async (req, res) => {
  const conversation =
    await conversationService.createOrGetConversationForBuyer(
      req.user.id,
      req.body,
    );
  // Determine status code based on whether it was created or existing one was found
  // For simplicity, always return 200 or 201 (if new message always created)
  res.status(httpStatusCodes.OK).send(conversation); // Or CREATED if always new message
});

export const conversationController = {
  listMyConversations,
  getConversationDetails,
  sendMessage,
  initiateConversation,
};
