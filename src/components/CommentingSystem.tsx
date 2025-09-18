/**
 * Commenting System React Components
 *
 * Provides a complete commenting interface with threaded discussions,
 * real-time updates, @mentions, reactions, and notifications.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import {
  MessageCircle,
  Reply,
  Heart,
  ThumbsUp,
  Smile,
  Eye,
  MoreHorizontal,
  Send,
  AtSign,
  Paperclip,
  CheckCircle,
  Edit,
  Trash,
  Flag,
  Pin,
  Clock,
  User,
  Bell,
  BellOff,
  X,
  Search,
  Filter,
} from 'lucide-react';

import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

import {
  Comment,
  CommentContext,
  CommentReaction,
  Notification,
  commentingSystem,
  commentHelpers,
} from '../utils/commentingSystem';

// Hook for managing comments
function useComments(context: CommentContext) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadComments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const commentsData = await commentingSystem.getCommentsForResource(
        context.resourceType,
        context.resourceId,
        {
          filePath: context.filePath,
          lineNumber: context.lineNumber,
          includeResolved: true,
        }
      );
      setComments(commentsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  }, [context]);

  const addComment = useCallback(async (content: string, parentId?: string) => {
    try {
      const newComment = await commentingSystem.createComment({
        authorId: 'current-user-id', // Would come from auth context
        content,
        context,
        parentId,
      });
      setComments(prev => [...prev, newComment]);
      return newComment;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add comment');
      throw err;
    }
  }, [context]);

  const updateComment = useCallback(async (commentId: string, content: string) => {
    try {
      const updatedComment = await commentingSystem.updateComment(
        commentId,
        'current-user-id',
        { content }
      );
      setComments(prev => prev.map(c => c.id === commentId ? updatedComment : c));
      return updatedComment;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update comment');
      throw err;
    }
  }, []);

  const addReaction = useCallback(async (commentId: string, reaction: CommentReaction['type']) => {
    try {
      const updatedComment = await commentingSystem.addReaction(
        commentId,
        'current-user-id',
        reaction
      );
      setComments(prev => prev.map(c => c.id === commentId ? updatedComment : c));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add reaction');
    }
  }, []);

  const resolveComment = useCallback(async (commentId: string, resolved: boolean = true) => {
    try {
      const updatedComment = await commentingSystem.resolveComment(
        commentId,
        'current-user-id',
        resolved
      );
      setComments(prev => prev.map(c => c.id === commentId ? updatedComment : c));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resolve comment');
    }
  }, []);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  return {
    comments,
    loading,
    error,
    addComment,
    updateComment,
    addReaction,
    resolveComment,
    reload: loadComments,
  };
}

// Hook for notifications
function useNotifications(userId: string) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const result = await commentingSystem.getNotifications(userId);
      setNotifications(result.notifications);
      setUnreadCount(result.unreadCount);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await commentingSystem.markNotificationAsRead(notificationId, userId);
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, status: 'read' as const } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  }, [userId]);

  const markAllAsRead = useCallback(async () => {
    try {
      await commentingSystem.markAllNotificationsAsRead(userId);
      setNotifications(prev => prev.map(n => ({ ...n, status: 'read' as const })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  }, [userId]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    reload: loadNotifications,
  };
}

// Main commenting interface
interface CommentThreadProps {
  context: CommentContext;
  className?: string;
  collapsible?: boolean;
  showHeader?: boolean;
}

export function CommentThread({
  context,
  className,
  collapsible = false,
  showHeader = true,
}: CommentThreadProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [showNewCommentForm, setShowNewCommentForm] = useState(false);
  const {
    comments,
    loading,
    error,
    addComment,
    updateComment,
    addReaction,
    resolveComment,
  } = useComments(context);

  const rootComments = comments.filter(c => !c.parentId);

  const handleAddComment = async (content: string) => {
    try {
      await addComment(content);
      setShowNewCommentForm(false);
    } catch (err) {
      // Error handling is done in the hook
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <MessageCircle className="w-4 h-4 animate-pulse" />
            <span className="text-sm text-muted-foreground">Loading comments...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`border-red-200 ${className}`}>
        <CardContent className="p-4">
          <div className="text-sm text-red-600">
            Error loading comments: {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      {showHeader && (
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center space-x-2">
              <MessageCircle className="w-5 h-5" />
              <span>Comments ({comments.length})</span>
            </CardTitle>
            <div className="flex items-center space-x-2">
              {collapsible && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCollapsed(!collapsed)}
                >
                  {collapsed ? 'Show' : 'Hide'}
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowNewCommentForm(true)}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Add Comment
              </Button>
            </div>
          </div>
        </CardHeader>
      )}

      {!collapsed && (
        <CardContent className="space-y-4">
          {/* New comment form */}
          {showNewCommentForm && (
            <NewCommentForm
              onSubmit={handleAddComment}
              onCancel={() => setShowNewCommentForm(false)}
              placeholder="Add a comment..."
            />
          )}

          {/* Comments list */}
          <div className="space-y-4">
            {rootComments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No comments yet. Be the first to comment!</p>
              </div>
            ) : (
              rootComments.map(comment => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  replies={comments.filter(c => c.parentId === comment.id)}
                  onReply={(content) => addComment(content, comment.id)}
                  onEdit={updateComment}
                  onReaction={addReaction}
                  onResolve={resolveComment}
                />
              ))
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

// Individual comment component
interface CommentItemProps {
  comment: Comment;
  replies: Comment[];
  onReply: (content: string) => Promise<void>;
  onEdit: (commentId: string, content: string) => Promise<void>;
  onReaction: (commentId: string, reaction: CommentReaction['type']) => Promise<void>;
  onResolve: (commentId: string, resolved: boolean) => Promise<void>;
}

function CommentItem({
  comment,
  replies,
  onReply,
  onEdit,
  onReaction,
  onResolve,
}: CommentItemProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [showReplies, setShowReplies] = useState(true);

  const currentUserId = 'current-user-id'; // Would come from auth context
  const isAuthor = comment.authorId === currentUserId;

  const handleReply = async (content: string) => {
    try {
      await onReply(content);
      setShowReplyForm(false);
    } catch (err) {
      // Error handling
    }
  };

  const handleEdit = async () => {
    try {
      await onEdit(comment.id, editContent);
      setIsEditing(false);
    } catch (err) {
      // Error handling
    }
  };

  const getReactionCount = (type: CommentReaction['type']) => {
    return comment.reactions.filter(r => r.type === type).length;
  };

  const hasUserReacted = (type: CommentReaction['type']) => {
    return comment.reactions.some(r => r.type === type && r.userId === currentUserId);
  };

  return (
    <div className={`space-y-3 ${comment.isResolved ? 'opacity-60' : ''}`}>
      <div className="flex space-x-3">
        <Avatar className="w-8 h-8">
          <AvatarImage src={comment.authorAvatar} />
          <AvatarFallback>
            {comment.authorName.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-2">
          {/* Comment header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="font-medium text-sm">{comment.authorName}</span>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(comment.createdAt, { addSuffix: true })}
              </span>
              {comment.editedAt && (
                <Badge variant="outline" className="text-xs">
                  edited
                </Badge>
              )}
              {comment.isResolved && (
                <Badge variant="default" className="text-xs">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  resolved
                </Badge>
              )}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isAuthor && (
                  <>
                    <DropdownMenuItem onClick={() => setIsEditing(true)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onResolve(comment.id, !comment.isResolved)}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {comment.isResolved ? 'Unresolve' : 'Resolve'}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem>
                  <Flag className="w-4 h-4 mr-2" />
                  Report
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Comment content */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
            {isEditing ? (
              <div className="space-y-2">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="min-h-[60px]"
                />
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsEditing(false);
                      setEditContent(comment.content);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleEdit}>
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-sm whitespace-pre-wrap">{comment.content}</div>
            )}
          </div>

          {/* Reactions and actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              {(['like', 'love', 'laugh'] as const).map(reactionType => {
                const count = getReactionCount(reactionType);
                const userReacted = hasUserReacted(reactionType);

                return (
                  <Button
                    key={reactionType}
                    variant={userReacted ? "default" : "ghost"}
                    size="sm"
                    className="h-7 px-2"
                    onClick={() => onReaction(comment.id, reactionType)}
                  >
                    <span className="mr-1">
                      {reactionType === 'like' && '👍'}
                      {reactionType === 'love' && '❤️'}
                      {reactionType === 'laugh' && '😂'}
                    </span>
                    {count > 0 && <span className="text-xs">{count}</span>}
                  </Button>
                );
              })}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowReplyForm(true)}
            >
              <Reply className="w-4 h-4 mr-1" />
              Reply
            </Button>
          </div>

          {/* Reply form */}
          {showReplyForm && (
            <NewCommentForm
              onSubmit={handleReply}
              onCancel={() => setShowReplyForm(false)}
              placeholder="Write a reply..."
            />
          )}

          {/* Replies */}
          {replies.length > 0 && (
            <div className="space-y-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReplies(!showReplies)}
                className="text-xs"
              >
                {showReplies ? 'Hide' : 'Show'} {replies.length} replies
              </Button>

              {showReplies && (
                <div className="pl-4 border-l-2 border-gray-200 dark:border-gray-700 space-y-3">
                  {replies.map(reply => (
                    <CommentItem
                      key={reply.id}
                      comment={reply}
                      replies={[]} // No nested replies for now
                      onReply={onReply}
                      onEdit={onEdit}
                      onReaction={onReaction}
                      onResolve={onResolve}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// New comment form
interface NewCommentFormProps {
  onSubmit: (content: string) => Promise<void>;
  onCancel: () => void;
  placeholder?: string;
  autoFocus?: boolean;
}

function NewCommentForm({
  onSubmit,
  onCancel,
  placeholder = "Write a comment...",
  autoFocus = true,
}: NewCommentFormProps) {
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || submitting) return;

    setSubmitting(true);
    try {
      await onSubmit(content.trim());
      setContent('');
    } catch (err) {
      // Error handling
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit(e);
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="min-h-[80px] resize-none"
        disabled={submitting}
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button type="button" variant="ghost" size="sm">
            <AtSign className="w-4 h-4" />
          </Button>
          <Button type="button" variant="ghost" size="sm">
            <Paperclip className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={!content.trim() || submitting}
          >
            {submitting ? (
              <>
                <Clock className="w-4 h-4 mr-2 animate-spin" />
                Posting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Comment
              </>
            )}
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Press Cmd+Enter to submit • ESC to cancel
      </p>
    </form>
  );
}

// Notification panel
interface NotificationPanelProps {
  userId: string;
  className?: string;
}

export function NotificationPanel({ userId, className }: NotificationPanelProps) {
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
  } = useNotifications(userId);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const filteredNotifications = filter === 'unread'
    ? notifications.filter(n => n.status === 'unread')
    : notifications;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Bell className="w-5 h-5" />
            <span>Notifications</span>
            {unreadCount > 0 && (
              <Badge variant="default">{unreadCount}</Badge>
            )}
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
            >
              Mark all read
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Filter tabs */}
        <Tabs value={filter} onValueChange={(value) => setFilter(value as any)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">
              Unread {unreadCount > 0 && `(${unreadCount})`}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Notifications list */}
        <ScrollArea className="h-96">
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-4">
                <Clock className="w-6 h-6 animate-spin mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Loading notifications...</p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No {filter === 'unread' ? 'unread' : ''} notifications</p>
              </div>
            ) : (
              filteredNotifications.map(notification => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={markAsRead}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

// Individual notification item
interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
}

function NotificationItem({ notification, onMarkAsRead }: NotificationItemProps) {
  const isUnread = notification.status === 'unread';

  const handleClick = () => {
    if (isUnread) {
      onMarkAsRead(notification.id);
    }
    // Navigate to action URL if available
    if (notification.actionUrl) {
      // In a real app, use router navigation
      console.log('Navigate to:', notification.actionUrl);
    }
  };

  return (
    <div
      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
        isUnread
          ? 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800'
          : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
      } hover:bg-gray-100 dark:hover:bg-gray-700`}
      onClick={handleClick}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-1">
          {getNotificationIcon(notification.type)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className={`text-sm font-medium ${isUnread ? 'text-blue-900 dark:text-blue-100' : ''}`}>
              {notification.title}
            </p>
            {isUnread && (
              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {notification.message}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
          </p>
        </div>
      </div>
    </div>
  );
}

// Helper function for notification icons
function getNotificationIcon(type: string) {
  switch (type) {
    case 'comment_mention':
      return <AtSign className="w-4 h-4 text-blue-500" />;
    case 'comment_reply':
      return <Reply className="w-4 h-4 text-green-500" />;
    case 'comment_reaction':
      return <Heart className="w-4 h-4 text-red-500" />;
    case 'comment_resolved':
      return <CheckCircle className="w-4 h-4 text-purple-500" />;
    case 'task_assigned':
      return <User className="w-4 h-4 text-orange-500" />;
    default:
      return <Bell className="w-4 h-4 text-gray-500" />;
  }
}

export default CommentThread;