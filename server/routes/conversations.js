const express = require('express');
const router = express.Router();
const conversationController = require('../controllers/conversationController');
const authMiddleware = require('../middleware/authMiddleware');

// All conversation routes require authentication
router.use(authMiddleware);

// GET /api/conversations - Get all conversations for the authenticated user
router.get('/', conversationController.getConversations);

// POST /api/conversations - Create a new conversation
router.post('/', conversationController.createConversation);

// DELETE /api/conversations/:id - Delete a conversation
router.delete('/:id', conversationController.deleteConversation);

// PUT /api/conversations/:id - Rename a conversation
router.put('/:id', conversationController.renameConversation);

// GET /api/conversations/:id/messages - Get all messages for a conversation
router.get('/:id/messages', conversationController.getMessages);

// POST /api/conversations/:id/messages - Add a message to a conversation
router.post('/:id/messages', conversationController.addMessage);

module.exports = router;