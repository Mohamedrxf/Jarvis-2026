const db = require('../config/db');

const conversationController = {
    // GET /api/conversations - Get all conversations for the authenticated user
    getConversations: (req, res) => {
        const userId = req.user.id;

        const sql = `
      SELECT id, user_id, title, created_at, updated_at
      FROM conversations
      WHERE user_id = ?
      ORDER BY updated_at DESC
    `;

        db.all(sql, [userId], (err, rows) => {
            if (err) {
                console.error('[ConversationController] Error fetching conversations:', err.message);
                return res.status(500).json({
                    success: false,
                    error: 'Failed to fetch conversations.'
                });
            }

            return res.json({
                success: true,
                conversations: rows
            });
        });
    },

    // POST /api/conversations - Create a new conversation
    createConversation: (req, res) => {
        const userId = req.user.id;
        const { title } = req.body;

        if (!title || typeof title !== 'string' || title.trim() === '') {
            return res.status(400).json({
                success: false,
                error: 'Title is required and must be a non-empty string.'
            });
        }

        const sql = `
      INSERT INTO conversations (user_id, title)
      VALUES (?, ?)
    `;

        db.run(sql, [userId, title.trim()], function (err) {
            if (err) {
                console.error('[ConversationController] Error creating conversation:', err.message);
                return res.status(500).json({
                    success: false,
                    error: 'Failed to create conversation.'
                });
            }

            const newConversation = {
                id: this.lastID,
                user_id: userId,
                title: title.trim(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            return res.status(201).json({
                success: true,
                conversation: newConversation
            });
        });
    },

    // DELETE /api/conversations/:id - Delete a conversation
    deleteConversation: (req, res) => {
        const userId = req.user.id;
        const conversationId = req.params.id;

        const sql = `
      DELETE FROM conversations
      WHERE id = ? AND user_id = ?
    `;

        db.run(sql, [conversationId, userId], function (err) {
            if (err) {
                console.error('[ConversationController] Error deleting conversation:', err.message);
                return res.status(500).json({
                    success: false,
                    error: 'Failed to delete conversation.'
                });
            }

            if (this.changes === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Conversation not found or you do not have permission to delete it.'
                });
            }

            return res.json({
                success: true,
                message: 'Conversation deleted successfully.'
            });
        });
    },

    // GET /api/conversations/:id/messages - Get all messages for a conversation
    getMessages: (req, res) => {
        const userId = req.user.id;
        const conversationId = req.params.id;

        const sql = `
      SELECT m.id, m.conversation_id, m.role, m.content, m.created_at
      FROM messages m
      INNER JOIN conversations c ON m.conversation_id = c.id
      WHERE m.conversation_id = ? AND c.user_id = ?
      ORDER BY m.created_at ASC
    `;

        db.all(sql, [conversationId, userId], (err, rows) => {
            if (err) {
                console.error('[ConversationController] Error fetching messages:', err.message);
                return res.status(500).json({
                    success: false,
                    error: 'Failed to fetch messages.'
                });
            }

            return res.json({
                success: true,
                messages: rows
            });
        });
    },

    // PUT /api/conversations/:id - Rename a conversation
    renameConversation: (req, res) => {
        const userId = req.user.id;
        const conversationId = req.params.id;
        const { title } = req.body;

        if (!title || typeof title !== 'string' || title.trim() === '') {
            return res.status(400).json({
                success: false,
                error: 'Title is required and must be a non-empty string.'
            });
        }

        const sql = `
      UPDATE conversations
      SET title = ?, updated_at = ?
      WHERE id = ? AND user_id = ?
    `;

        db.run(sql, [title.trim(), new Date().toISOString(), conversationId, userId], function (err) {
            if (err) {
                console.error('[ConversationController] Error renaming conversation:', err.message);
                return res.status(500).json({
                    success: false,
                    error: 'Failed to rename conversation.'
                });
            }

            if (this.changes === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Conversation not found or you do not have permission to rename it.'
                });
            }

            return res.json({
                success: true,
                message: 'Conversation renamed successfully.',
                conversation: {
                    id: parseInt(conversationId),
                    title: title.trim(),
                    updated_at: new Date().toISOString()
                }
            });
        });
    },

    // POST /api/conversations/:id/messages - Add a message to a conversation
    addMessage: (req, res) => {
        const userId = req.user.id;
        const conversationId = req.params.id;
        const { role, content } = req.body;

        if (!role || !content) {
            return res.status(400).json({
                success: false,
                error: 'Role and content are required.'
            });
        }

        if (!['user', 'assistant', 'system'].includes(role)) {
            return res.status(400).json({
                success: false,
                error: 'Role must be one of: user, assistant, system.'
            });
        }

        if (typeof content !== 'string' || content.trim() === '') {
            return res.status(400).json({
                success: false,
                error: 'Content must be a non-empty string.'
            });
        }

        // First, verify the conversation belongs to the user
        const checkSql = `
      SELECT id FROM conversations
      WHERE id = ? AND user_id = ?
    `;

        db.get(checkSql, [conversationId, userId], (err, row) => {
            if (err) {
                console.error('[ConversationController] Error verifying conversation:', err.message);
                return res.status(500).json({
                    success: false,
                    error: 'Failed to verify conversation.'
                });
            }

            if (!row) {
                return res.status(404).json({
                    success: false,
                    error: 'Conversation not found or you do not have permission to add messages.'
                });
            }

            const insertSql = `
        INSERT INTO messages (conversation_id, role, content)
        VALUES (?, ?, ?)
      `;

            db.run(insertSql, [conversationId, role, content.trim()], function (err) {
                if (err) {
                    console.error('[ConversationController] Error adding message:', err.message);
                    return res.status(500).json({
                        success: false,
                        error: 'Failed to add message.'
                    });
                }

                const newMessage = {
                    id: this.lastID,
                    conversation_id: parseInt(conversationId),
                    role,
                    content: content.trim(),
                    created_at: new Date().toISOString()
                };

                // Update the conversation's updated_at timestamp
                const updateConversationSql = `
          UPDATE conversations
          SET updated_at = ?
          WHERE id = ?
        `;

                db.run(updateConversationSql, [new Date().toISOString(), conversationId], (updateErr) => {
                    if (updateErr) {
                        console.error('[ConversationController] Error updating conversation timestamp:', updateErr.message);
                    }
                });

                return res.status(201).json({
                    success: true,
                    message: newMessage
                });
            });
        });
    }
};

module.exports = conversationController;