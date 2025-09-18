/**
 * In-App Commenting and Notification System
 *
 * Provides real-time collaborative commenting, threaded discussions,
 * @mentions, notifications, and rich text editing capabilities.
 *
 * Features:
 * - Real-time comments with WebSocket integration
 * - Threaded discussions and replies
 * - @mentions with user notifications
 * - Rich text editing with markdown support
 * - Comment reactions and voting
 * - File/line-specific commenting
 * - Comment moderation and reporting
 * - Integration with audit trail
 * - Notification preferences management
 * - Comment search and filtering
 */

import { randomUUID } from 'crypto';
import { auditTrail } from './auditTrail';

// Core comment interfaces
export interface Comment {
  id: string;
  parentId?: string; // For threaded replies
  threadId: string; // Root thread identifier
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  contentType: 'text' | 'markdown' | 'rich_text';
  attachments: CommentAttachment[];
  mentions: UserMention[];
  reactions: CommentReaction[];

  // Context information
  context: CommentContext;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  editedAt?: Date;

  // Status and moderation
  status: 'active' | 'edited' | 'deleted' | 'hidden' | 'reported';
  isResolved: boolean;
  resolvedBy?: string;
  resolvedAt?: Date;

  // Metadata
  metadata: {
    ipAddress: string;
    userAgent: string;
    editHistory?: CommentEdit[];
    reportCount?: number;
    flags?: string[];
  };
}

export interface CommentContext {
  // Resource association
  resourceType: 'project' | 'file' | 'task' | 'builder' | 'general';
  resourceId: string;
  resourceName?: string;

  // Location-specific (for code comments)
  filePath?: string;
  lineNumber?: number;
  lineRange?: {
    start: number;
    end: number;
  };
  columnNumber?: number;

  // Visual positioning
  position?: {
    x: number;
    y: number;
  };

  // Selection context
  selectedText?: string;
  selectionRange?: {
    start: number;
    end: number;
  };
}

export interface CommentAttachment {
  id: string;
  type: 'image' | 'file' | 'video' | 'audio' | 'link';
  name: string;
  url: string;
  size: number;
  mimeType: string;
  thumbnailUrl?: string;
  metadata?: Record<string, any>;
}

export interface UserMention {
  userId: string;
  username: string;
  displayName: string;
  startIndex: number;
  endIndex: number;
}

export interface CommentReaction {
  id: string;
  userId: string;
  type: 'like' | 'love' | 'laugh' | 'wow' | 'sad' | 'angry' | 'eyes' | 'rocket' | 'party';
  emoji: string;
  createdAt: Date;
}

export interface CommentEdit {
  id: string;
  editedBy: string;
  editedAt: Date;
  previousContent: string;
  reason?: string;
}

// Notification interfaces
export interface Notification {
  id: string;
  recipientId: string;
  senderId?: string;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;

  // Related entities
  commentId?: string;
  resourceType?: string;
  resourceId?: string;

  // Status
  status: 'unread' | 'read' | 'archived' | 'dismissed';
  priority: 'low' | 'medium' | 'high' | 'urgent';

  // Timestamps
  createdAt: Date;
  readAt?: Date;
  expiresAt?: Date;

  // Delivery channels
  channels: {
    inApp: boolean;
    email: boolean;
    push: boolean;
    sms: boolean;
  };

  // Metadata
  metadata: {
    category: string;
    tags: string[];
    groupKey?: string; // For grouping similar notifications
    relatedNotifications?: string[];
  };
}

export type NotificationType =
  | 'comment_mention'
  | 'comment_reply'
  | 'comment_reaction'
  | 'comment_resolved'
  | 'comment_assigned'
  | 'thread_updated'
  | 'system_announcement'
  | 'collaboration_invite'
  | 'task_assigned'
  | 'task_completed'
  | 'project_shared'
  | 'security_alert'
  | 'maintenance_notice';

export interface NotificationPreferences {
  userId: string;
  preferences: {
    [key in NotificationType]: {
      enabled: boolean;
      channels: {
        inApp: boolean;
        email: boolean;
        push: boolean;
        sms: boolean;
      };
      frequency: 'immediate' | 'batched' | 'daily' | 'weekly';
      quietHours?: {
        enabled: boolean;
        start: string; // HH:mm format
        end: string;
        timezone: string;
      };
    };
  };
  globalSettings: {
    enabled: boolean;
    doNotDisturb: boolean;
    groupSimilar: boolean;
    maxDailyNotifications: number;
  };
}

// Comment thread management
export interface CommentThread {
  id: string;
  title?: string;
  context: CommentContext;
  participants: ThreadParticipant[];
  comments: Comment[];

  // Status
  status: 'active' | 'resolved' | 'archived' | 'locked';
  isLocked: boolean;
  lockReason?: string;
  lockedBy?: string;
  lockedAt?: Date;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  lastActivityAt: Date;

  // Moderation
  moderationFlags: string[];
  moderatedBy?: string;
  moderationNotes?: string;
}

export interface ThreadParticipant {
  userId: string;
  role: 'author' | 'participant' | 'observer' | 'moderator';
  joinedAt: Date;
  lastActiveAt: Date;
  notificationLevel: 'all' | 'mentions_only' | 'none';
}

// Commenting system configuration
export interface CommentingConfig {
  enabled: boolean;
  features: {
    threading: boolean;
    reactions: boolean;
    mentions: boolean;
    attachments: boolean;
    richText: boolean;
    moderation: boolean;
    anonymousComments: boolean;
    guestComments: boolean;
  };
  limits: {
    maxCommentLength: number;
    maxAttachmentSize: number;
    maxAttachmentsPerComment: number;
    maxThreadDepth: number;
    rateLimitPerMinute: number;
  };
  moderation: {
    autoModerationEnabled: boolean;
    requireApproval: boolean;
    bannedWords: string[];
    spamDetection: boolean;
  };
  notifications: {
    realTimeEnabled: boolean;
    batchingEnabled: boolean;
    retentionDays: number;
  };
}

// Default configuration
const DEFAULT_COMMENTING_CONFIG: CommentingConfig = {
  enabled: true,
  features: {
    threading: true,
    reactions: true,
    mentions: true,
    attachments: true,
    richText: true,
    moderation: true,
    anonymousComments: false,
    guestComments: false,
  },
  limits: {
    maxCommentLength: 5000,
    maxAttachmentSize: 10 * 1024 * 1024, // 10MB
    maxAttachmentsPerComment: 5,
    maxThreadDepth: 10,
    rateLimitPerMinute: 30,
  },
  moderation: {
    autoModerationEnabled: true,
    requireApproval: false,
    bannedWords: ['spam', 'abuse'], // Would be more comprehensive in production
    spamDetection: true,
  },
  notifications: {
    realTimeEnabled: true,
    batchingEnabled: true,
    retentionDays: 90,
  },
};

// Main commenting system class
export class CommentingSystem {
  private config: CommentingConfig;
  private comments: Map<string, Comment> = new Map();
  private threads: Map<string, CommentThread> = new Map();
  private notifications: Map<string, Notification[]> = new Map();
  private userPreferences: Map<string, NotificationPreferences> = new Map();
  private webSocketConnections: Map<string, WebSocket> = new Map();

  constructor(config: Partial<CommentingConfig> = {}) {
    this.config = { ...DEFAULT_COMMENTING_CONFIG, ...config };
  }

  // Comment creation and management
  async createComment(params: {
    authorId: string;
    content: string;
    contentType?: 'text' | 'markdown' | 'rich_text';
    context: CommentContext;
    parentId?: string;
    attachments?: Omit<CommentAttachment, 'id'>[];
    mentions?: Omit<UserMention, 'userId' | 'username' | 'displayName'>[];
  }): Promise<Comment> {
    // Rate limiting check
    if (!await this.checkRateLimit(params.authorId)) {
      throw new Error('Rate limit exceeded');
    }

    // Content moderation
    if (this.config.moderation.autoModerationEnabled) {
      await this.moderateContent(params.content);
    }

    // Create comment
    const comment: Comment = {
      id: randomUUID(),
      parentId: params.parentId,
      threadId: params.parentId ?
        this.comments.get(params.parentId)?.threadId || randomUUID() :
        randomUUID(),
      authorId: params.authorId,
      authorName: await this.getUserDisplayName(params.authorId),
      authorAvatar: await this.getUserAvatar(params.authorId),
      content: params.content,
      contentType: params.contentType || 'text',
      attachments: params.attachments?.map(att => ({
        ...att,
        id: randomUUID(),
      })) || [],
      mentions: await this.processMentions(params.mentions || [], params.content),
      reactions: [],
      context: params.context,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'active',
      isResolved: false,
      metadata: {
        ipAddress: '127.0.0.1', // Would get from request
        userAgent: 'Unknown', // Would get from request
        editHistory: [],
      },
    };

    // Store comment
    this.comments.set(comment.id, comment);

    // Update or create thread
    await this.updateThread(comment);

    // Process mentions and notifications
    if (comment.mentions.length > 0) {
      await this.processMentionNotifications(comment);
    }

    // Send real-time updates
    if (this.config.notifications.realTimeEnabled) {
      await this.broadcastCommentUpdate('created', comment);
    }

    // Audit logging
    await auditTrail.logEvent({
      userId: params.authorId,
      sessionId: 'commenting-session',
      action: 'COMMENT_ADDED',
      resourceType: 'comment',
      resourceId: comment.id,
      resourceName: `Comment on ${comment.context.resourceType}`,
      metadata: {
        ipAddress: '127.0.0.1',
        userAgent: 'Unknown',
        business_context: {
          workspace_id: comment.context.resourceId,
        },
      },
    });

    return comment;
  }

  async updateComment(
    commentId: string,
    authorId: string,
    updates: {
      content?: string;
      attachments?: CommentAttachment[];
      reason?: string;
    }
  ): Promise<Comment> {
    const comment = this.comments.get(commentId);
    if (!comment) {
      throw new Error('Comment not found');
    }

    if (comment.authorId !== authorId) {
      throw new Error('Unauthorized to edit this comment');
    }

    // Store edit history
    const edit: CommentEdit = {
      id: randomUUID(),
      editedBy: authorId,
      editedAt: new Date(),
      previousContent: comment.content,
      reason: updates.reason,
    };

    // Update comment
    const updatedComment: Comment = {
      ...comment,
      content: updates.content || comment.content,
      attachments: updates.attachments || comment.attachments,
      updatedAt: new Date(),
      editedAt: new Date(),
      status: 'edited',
      metadata: {
        ...comment.metadata,
        editHistory: [...(comment.metadata.editHistory || []), edit],
      },
    };

    this.comments.set(commentId, updatedComment);

    // Broadcast update
    if (this.config.notifications.realTimeEnabled) {
      await this.broadcastCommentUpdate('updated', updatedComment);
    }

    // Audit logging
    await auditTrail.logEvent({
      userId: authorId,
      sessionId: 'commenting-session',
      action: 'COMMENT_UPDATED',
      resourceType: 'comment',
      resourceId: commentId,
      oldValues: { content: comment.content },
      newValues: { content: updatedComment.content },
      metadata: {
        ipAddress: '127.0.0.1',
        userAgent: 'Unknown',
      },
    });

    return updatedComment;
  }

  async deleteComment(commentId: string, authorId: string): Promise<void> {
    const comment = this.comments.get(commentId);
    if (!comment) {
      throw new Error('Comment not found');
    }

    if (comment.authorId !== authorId) {
      throw new Error('Unauthorized to delete this comment');
    }

    // Soft delete
    const deletedComment: Comment = {
      ...comment,
      status: 'deleted',
      content: '[Comment deleted]',
      updatedAt: new Date(),
    };

    this.comments.set(commentId, deletedComment);

    // Broadcast update
    if (this.config.notifications.realTimeEnabled) {
      await this.broadcastCommentUpdate('deleted', deletedComment);
    }

    // Audit logging
    await auditTrail.logEvent({
      userId: authorId,
      sessionId: 'commenting-session',
      action: 'COMMENT_DELETED',
      resourceType: 'comment',
      resourceId: commentId,
      metadata: {
        ipAddress: '127.0.0.1',
        userAgent: 'Unknown',
      },
    });
  }

  async addReaction(
    commentId: string,
    userId: string,
    reactionType: CommentReaction['type']
  ): Promise<Comment> {
    const comment = this.comments.get(commentId);
    if (!comment) {
      throw new Error('Comment not found');
    }

    // Remove existing reaction from this user
    const existingReactionIndex = comment.reactions.findIndex(r => r.userId === userId);
    if (existingReactionIndex !== -1) {
      comment.reactions.splice(existingReactionIndex, 1);
    }

    // Add new reaction
    const reaction: CommentReaction = {
      id: randomUUID(),
      userId,
      type: reactionType,
      emoji: this.getEmojiForReaction(reactionType),
      createdAt: new Date(),
    };

    comment.reactions.push(reaction);
    comment.updatedAt = new Date();

    this.comments.set(commentId, comment);

    // Notify comment author if not reacting to own comment
    if (comment.authorId !== userId) {
      await this.createNotification({
        recipientId: comment.authorId,
        senderId: userId,
        type: 'comment_reaction',
        title: 'New reaction on your comment',
        message: `Someone reacted ${reaction.emoji} to your comment`,
        commentId: commentId,
        priority: 'low',
      });
    }

    // Broadcast update
    if (this.config.notifications.realTimeEnabled) {
      await this.broadcastCommentUpdate('reaction_added', comment);
    }

    return comment;
  }

  async resolveComment(
    commentId: string,
    userId: string,
    resolved: boolean = true
  ): Promise<Comment> {
    const comment = this.comments.get(commentId);
    if (!comment) {
      throw new Error('Comment not found');
    }

    const updatedComment: Comment = {
      ...comment,
      isResolved: resolved,
      resolvedBy: resolved ? userId : undefined,
      resolvedAt: resolved ? new Date() : undefined,
      updatedAt: new Date(),
    };

    this.comments.set(commentId, updatedComment);

    // Notify thread participants
    const thread = this.threads.get(comment.threadId);
    if (thread) {
      for (const participant of thread.participants) {
        if (participant.userId !== userId && participant.notificationLevel !== 'none') {
          await this.createNotification({
            recipientId: participant.userId,
            senderId: userId,
            type: 'comment_resolved',
            title: resolved ? 'Comment thread resolved' : 'Comment thread reopened',
            message: `A comment thread you're following has been ${resolved ? 'resolved' : 'reopened'}`,
            commentId: commentId,
            priority: 'medium',
          });
        }
      }
    }

    // Audit logging
    await auditTrail.logEvent({
      userId: userId,
      sessionId: 'commenting-session',
      action: 'COMMENT_RESOLVED',
      resourceType: 'comment',
      resourceId: commentId,
      newValues: { resolved: resolved },
      metadata: {
        ipAddress: '127.0.0.1',
        userAgent: 'Unknown',
      },
    });

    return updatedComment;
  }

  // Notification management
  async createNotification(params: {
    recipientId: string;
    senderId?: string;
    type: NotificationType;
    title: string;
    message: string;
    actionUrl?: string;
    commentId?: string;
    resourceType?: string;
    resourceId?: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    expiresAt?: Date;
    channels?: Partial<Notification['channels']>;
    metadata?: Partial<Notification['metadata']>;
  }): Promise<Notification> {
    // Check user preferences
    const userPrefs = this.userPreferences.get(params.recipientId);
    if (userPrefs && !userPrefs.preferences[params.type]?.enabled) {
      return null; // User has disabled this notification type
    }

    const notification: Notification = {
      id: randomUUID(),
      recipientId: params.recipientId,
      senderId: params.senderId,
      type: params.type,
      title: params.title,
      message: params.message,
      actionUrl: params.actionUrl,
      commentId: params.commentId,
      resourceType: params.resourceType,
      resourceId: params.resourceId,
      status: 'unread',
      priority: params.priority || 'medium',
      createdAt: new Date(),
      expiresAt: params.expiresAt,
      channels: {
        inApp: true,
        email: false,
        push: false,
        sms: false,
        ...params.channels,
      },
      metadata: {
        category: 'comment',
        tags: [],
        ...params.metadata,
      },
    };

    // Store notification
    const userNotifications = this.notifications.get(params.recipientId) || [];
    userNotifications.push(notification);
    this.notifications.set(params.recipientId, userNotifications);

    // Send real-time notification
    if (this.config.notifications.realTimeEnabled) {
      await this.sendRealtimeNotification(notification);
    }

    return notification;
  }

  async getNotifications(
    userId: string,
    filters: {
      status?: 'unread' | 'read' | 'archived';
      type?: NotificationType;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{
    notifications: Notification[];
    unreadCount: number;
    total: number;
  }> {
    const userNotifications = this.notifications.get(userId) || [];

    let filtered = userNotifications;

    if (filters.status) {
      filtered = filtered.filter(n => n.status === filters.status);
    }

    if (filters.type) {
      filtered = filtered.filter(n => n.type === filters.type);
    }

    // Sort by creation date (newest first)
    filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const total = filtered.length;
    const unreadCount = userNotifications.filter(n => n.status === 'unread').length;

    // Apply pagination
    const limit = filters.limit || 50;
    const offset = filters.offset || 0;
    const paginated = filtered.slice(offset, offset + limit);

    return {
      notifications: paginated,
      unreadCount,
      total,
    };
  }

  async markNotificationAsRead(notificationId: string, userId: string): Promise<void> {
    const userNotifications = this.notifications.get(userId) || [];
    const notification = userNotifications.find(n => n.id === notificationId);

    if (notification && notification.status === 'unread') {
      notification.status = 'read';
      notification.readAt = new Date();

      // Update storage
      this.notifications.set(userId, userNotifications);
    }
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    const userNotifications = this.notifications.get(userId) || [];

    userNotifications.forEach(notification => {
      if (notification.status === 'unread') {
        notification.status = 'read';
        notification.readAt = new Date();
      }
    });

    this.notifications.set(userId, userNotifications);
  }

  // Query and search
  async searchComments(params: {
    query: string;
    resourceType?: string;
    resourceId?: string;
    authorId?: string;
    dateRange?: {
      start: Date;
      end: Date;
    };
    includeResolved?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<{
    comments: Comment[];
    total: number;
    highlights: Record<string, string[]>;
  }> {
    let allComments = Array.from(this.comments.values());

    // Filter by resource
    if (params.resourceType || params.resourceId) {
      allComments = allComments.filter(comment => {
        if (params.resourceType && comment.context.resourceType !== params.resourceType) {
          return false;
        }
        if (params.resourceId && comment.context.resourceId !== params.resourceId) {
          return false;
        }
        return true;
      });
    }

    // Filter by author
    if (params.authorId) {
      allComments = allComments.filter(comment => comment.authorId === params.authorId);
    }

    // Filter by resolution status
    if (params.includeResolved === false) {
      allComments = allComments.filter(comment => !comment.isResolved);
    }

    // Filter by date range
    if (params.dateRange) {
      allComments = allComments.filter(comment =>
        comment.createdAt >= params.dateRange.start &&
        comment.createdAt <= params.dateRange.end
      );
    }

    // Full-text search
    const searchResults = allComments.filter(comment =>
      comment.content.toLowerCase().includes(params.query.toLowerCase()) ||
      comment.authorName.toLowerCase().includes(params.query.toLowerCase())
    );

    // Sort by relevance/date
    searchResults.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Pagination
    const total = searchResults.length;
    const limit = params.limit || 50;
    const offset = params.offset || 0;
    const paginated = searchResults.slice(offset, offset + limit);

    // Generate highlights (simplified)
    const highlights: Record<string, string[]> = {};
    paginated.forEach(comment => {
      const highlighted = this.highlightSearchTerms(comment.content, params.query);
      if (highlighted.length > 0) {
        highlights[comment.id] = highlighted;
      }
    });

    return {
      comments: paginated,
      total,
      highlights,
    };
  }

  // Thread management
  async getThread(threadId: string): Promise<CommentThread | null> {
    return this.threads.get(threadId) || null;
  }

  async getCommentsForResource(
    resourceType: string,
    resourceId: string,
    options: {
      includeResolved?: boolean;
      filePath?: string;
      lineNumber?: number;
    } = {}
  ): Promise<Comment[]> {
    const allComments = Array.from(this.comments.values());

    return allComments.filter(comment => {
      // Resource match
      if (comment.context.resourceType !== resourceType ||
          comment.context.resourceId !== resourceId) {
        return false;
      }

      // File-specific filtering
      if (options.filePath && comment.context.filePath !== options.filePath) {
        return false;
      }

      // Line-specific filtering
      if (options.lineNumber !== undefined && comment.context.lineNumber !== options.lineNumber) {
        return false;
      }

      // Resolution status
      if (options.includeResolved === false && comment.isResolved) {
        return false;
      }

      // Exclude deleted comments
      if (comment.status === 'deleted') {
        return false;
      }

      return true;
    }).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  // Private helper methods
  private async updateThread(comment: Comment): Promise<void> {
    let thread = this.threads.get(comment.threadId);

    if (!thread) {
      // Create new thread
      thread = {
        id: comment.threadId,
        context: comment.context,
        participants: [{
          userId: comment.authorId,
          role: 'author',
          joinedAt: comment.createdAt,
          lastActiveAt: comment.createdAt,
          notificationLevel: 'all',
        }],
        comments: [comment],
        status: 'active',
        isLocked: false,
        createdAt: comment.createdAt,
        updatedAt: comment.createdAt,
        lastActivityAt: comment.createdAt,
        moderationFlags: [],
      };
    } else {
      // Update existing thread
      thread.comments.push(comment);
      thread.updatedAt = comment.createdAt;
      thread.lastActivityAt = comment.createdAt;

      // Add participant if not already in thread
      const existingParticipant = thread.participants.find(p => p.userId === comment.authorId);
      if (!existingParticipant) {
        thread.participants.push({
          userId: comment.authorId,
          role: 'participant',
          joinedAt: comment.createdAt,
          lastActiveAt: comment.createdAt,
          notificationLevel: 'all',
        });
      } else {
        existingParticipant.lastActiveAt = comment.createdAt;
      }
    }

    this.threads.set(comment.threadId, thread);
  }

  private async processMentions(
    mentions: Omit<UserMention, 'userId' | 'username' | 'displayName'>[],
    content: string
  ): Promise<UserMention[]> {
    // In a real implementation, this would resolve usernames to user IDs
    // For now, return simplified mentions
    return mentions.map(mention => ({
      ...mention,
      userId: 'user-123',
      username: 'mentioned-user',
      displayName: 'Mentioned User',
    }));
  }

  private async processMentionNotifications(comment: Comment): Promise<void> {
    for (const mention of comment.mentions) {
      await this.createNotification({
        recipientId: mention.userId,
        senderId: comment.authorId,
        type: 'comment_mention',
        title: 'You were mentioned in a comment',
        message: `${comment.authorName} mentioned you in a comment`,
        commentId: comment.id,
        resourceType: comment.context.resourceType,
        resourceId: comment.context.resourceId,
        priority: 'medium',
      });
    }
  }

  private async checkRateLimit(userId: string): Promise<boolean> {
    // Simplified rate limiting - in production, use Redis or similar
    return true;
  }

  private async moderateContent(content: string): Promise<void> {
    if (this.config.moderation.bannedWords.some(word =>
        content.toLowerCase().includes(word.toLowerCase()))) {
      throw new Error('Content contains prohibited words');
    }
  }

  private async getUserDisplayName(userId: string): Promise<string> {
    // In a real implementation, fetch from user service
    return `User ${userId.slice(-4)}`;
  }

  private async getUserAvatar(userId: string): Promise<string | undefined> {
    // In a real implementation, fetch from user service
    return undefined;
  }

  private getEmojiForReaction(type: CommentReaction['type']): string {
    const emojiMap = {
      like: '👍',
      love: '❤️',
      laugh: '😂',
      wow: '😮',
      sad: '😢',
      angry: '😠',
      eyes: '👀',
      rocket: '🚀',
      party: '🎉',
    };
    return emojiMap[type] || '👍';
  }

  private async broadcastCommentUpdate(
    action: 'created' | 'updated' | 'deleted' | 'reaction_added',
    comment: Comment
  ): Promise<void> {
    // In a real implementation, broadcast via WebSocket
    console.log(`Broadcasting comment ${action}:`, comment.id);
  }

  private async sendRealtimeNotification(notification: Notification): Promise<void> {
    // In a real implementation, send via WebSocket, push notifications, etc.
    console.log(`Sending real-time notification:`, notification.id);
  }

  private highlightSearchTerms(content: string, query: string): string[] {
    // Simplified highlighting - in production, use more sophisticated algorithm
    const terms = query.toLowerCase().split(' ');
    const highlighted: string[] = [];

    terms.forEach(term => {
      const index = content.toLowerCase().indexOf(term);
      if (index !== -1) {
        const start = Math.max(0, index - 20);
        const end = Math.min(content.length, index + term.length + 20);
        highlighted.push(content.substring(start, end));
      }
    });

    return highlighted;
  }
}

// Create singleton instance
export const commentingSystem = new CommentingSystem();

// Helper functions for React integration
export const commentHelpers = {
  createComment: (params: Parameters<typeof commentingSystem.createComment>[0]) =>
    commentingSystem.createComment(params),

  addReaction: (commentId: string, userId: string, reaction: CommentReaction['type']) =>
    commentingSystem.addReaction(commentId, userId, reaction),

  resolveComment: (commentId: string, userId: string, resolved?: boolean) =>
    commentingSystem.resolveComment(commentId, userId, resolved),

  getCommentsForFile: (projectId: string, filePath: string, lineNumber?: number) =>
    commentingSystem.getCommentsForResource('file', projectId, { filePath, lineNumber }),
};

export default commentingSystem;