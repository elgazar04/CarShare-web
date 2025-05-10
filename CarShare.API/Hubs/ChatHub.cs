using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using System.Collections.Concurrent;

namespace CarShare.API.Hubs
{
    [Authorize]
    public class ChatHub : Hub
    {
        // In-memory storage for connections
        private static readonly ConcurrentDictionary<string, string> UserConnections = new();
        private static readonly ConcurrentDictionary<string, List<string>> GroupConnections = new();

        // In-memory message storage to maintain recent messages
        private static readonly ConcurrentDictionary<string, List<MessageInfo>> RecentMessages = new();
        private const int MaxRecentMessages = 50; // Maximum number of recent messages to store per group
        
        // Track active conversations for users to make it easy to see who you're chatting with
        private static readonly ConcurrentDictionary<string, HashSet<ConversationInfo>> UserConversations = new();

        // Message info class for in-memory storage
        private class MessageInfo
        {
            public string SenderId { get; set; }
            public string Message { get; set; }
            public string CarId { get; set; }
            public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        }
        
        // Conversation info class to track active conversations
        private class ConversationInfo
        {
            public string UserId { get; set; }
            public string CarId { get; set; }
            public DateTime LastMessageTime { get; set; } = DateTime.UtcNow;
            
            // Override equals and hashcode to avoid duplicates in HashSet
            public override bool Equals(object obj)
            {
                if (obj is ConversationInfo other)
                {
                    return UserId == other.UserId && CarId == other.CarId;
                }
                return false;
            }
            
            public override int GetHashCode()
            {
                return (UserId + CarId).GetHashCode();
            }
        }

        // Get user ID from claims
        private string GetUserId()
        {
            var claim = Context.User.FindFirst(JwtRegisteredClaimNames.Sub) ?? 
                        Context.User.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier");
            
            return claim?.Value;
        }

        // Get user role from claims
        private string GetUserRole()
        {
            var claim = Context.User.FindFirst(ClaimTypes.Role);
            return claim?.Value;
        }

        public override async Task OnConnectedAsync()
        {
            var userId = GetUserId();
            
            if (!string.IsNullOrEmpty(userId))
            {
                // Map the connection ID to the user ID
                UserConnections[userId] = Context.ConnectionId;
                
                // Add admin users to the admin group for support messages
                if (GetUserRole() == "Admin")
                {
                    await Groups.AddToGroupAsync(Context.ConnectionId, "Admins");
                    
                    if (!GroupConnections.ContainsKey("Admins"))
                    {
                        GroupConnections["Admins"] = new List<string>();
                    }
                    
                    GroupConnections["Admins"].Add(Context.ConnectionId);
                }
                
                // Initialize user conversations collection if needed
                if (!UserConversations.ContainsKey(userId))
                {
                    UserConversations[userId] = new HashSet<ConversationInfo>();
                }
            }
            
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception exception)
        {
            var userId = GetUserId();
            
            if (!string.IsNullOrEmpty(userId))
            {
                UserConnections.TryRemove(userId, out _);
                
                // Remove from admin group if applicable
                if (GetUserRole() == "Admin")
                {
                    await Groups.RemoveFromGroupAsync(Context.ConnectionId, "Admins");
                    
                    if (GroupConnections.ContainsKey("Admins"))
                    {
                        GroupConnections["Admins"].Remove(Context.ConnectionId);
                    }
                }
            }
            
            await base.OnDisconnectedAsync(exception);
        }

        // Send message from renter to car owner regarding a specific car
        public async Task SendCarInquiryMessage(string receiverId, string carId, string message)
        {
            var senderId = GetUserId();
            
            if (string.IsNullOrEmpty(senderId))
            {
                throw new HubException("User not authenticated");
            }
            
            // Create a car-specific group for this conversation if it doesn't exist
            var groupName = $"car-{carId}-chat";
            
            // Add sender to the group if not already in it
            if (!GroupConnections.ContainsKey(groupName) || !GroupConnections[groupName].Contains(Context.ConnectionId))
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
                
                if (!GroupConnections.ContainsKey(groupName))
                {
                    GroupConnections[groupName] = new List<string>();
                }
                
                GroupConnections[groupName].Add(Context.ConnectionId);
            }
            
            // Store the message in memory
            if (!RecentMessages.ContainsKey(groupName))
            {
                RecentMessages[groupName] = new List<MessageInfo>();
            }
            
            var messageInfo = new MessageInfo
            {
                SenderId = senderId,
                Message = message,
                CarId = carId
            };
            
            RecentMessages[groupName].Add(messageInfo);
            
            // Trim if exceeds max size
            if (RecentMessages[groupName].Count > MaxRecentMessages)
            {
                RecentMessages[groupName] = RecentMessages[groupName]
                    .OrderByDescending(m => m.Timestamp)
                    .Take(MaxRecentMessages)
                    .ToList();
            }
            
            // Track conversation for both sender and receiver
            TrackConversation(senderId, receiverId, carId);
            
            // Always send the message directly back to the sender first to ensure they see it
            await Clients.Caller.SendAsync("ReceiveMessage", senderId, message, carId);
            
            // If receiver is connected, add them to the group and send the message
            if (UserConnections.TryGetValue(receiverId, out var connectionId))
            {
                if (!GroupConnections.ContainsKey(groupName) || !GroupConnections[groupName].Contains(connectionId))
                {
                    await Groups.AddToGroupAsync(connectionId, groupName);
                    
                    if (!GroupConnections.ContainsKey(groupName))
                    {
                        GroupConnections[groupName] = new List<string>();
                    }
                    
                    GroupConnections[groupName].Add(connectionId);
                }
                
                // Send message to the group (excluding the caller since they already got it)
                await Clients.GroupExcept(groupName, new[] { Context.ConnectionId }).SendAsync("ReceiveMessage", senderId, message, carId);
                
                // Send notification to the receiver
                await Clients.Client(connectionId).SendAsync("NewMessageNotification", new
                {
                    SenderId = senderId,
                    MessagePreview = message.Length > 50 ? message.Substring(0, 47) + "..." : message,
                    CarId = carId,
                    Type = "CarInquiry"
                });
            }
            else
            {
                // Send a message only to the sender that the receiver is offline
                await Clients.Caller.SendAsync("ReceiveSystemMessage", "The recipient is currently offline but will receive your message when they connect.");
                
                // We still send the message to the group so it's delivered when the receiver comes online
                // (excluding the caller since they already got it)
                await Clients.GroupExcept(groupName, new[] { Context.ConnectionId }).SendAsync("ReceiveMessage", senderId, message, carId);
            }
        }
        
        // Helper method to track conversations for both users
        private void TrackConversation(string senderId, string receiverId, string carId)
        {
            if (UserConversations.TryGetValue(senderId, out var senderConversations))
            {
                var senderConvo = new ConversationInfo { UserId = receiverId, CarId = carId };
                senderConversations.RemoveWhere(c => c.Equals(senderConvo)); // Remove old one if exists
                senderConversations.Add(senderConvo); // Add updated one
            }
            
            if (UserConversations.TryGetValue(receiverId, out var receiverConversations))
            {
                var receiverConvo = new ConversationInfo { UserId = senderId, CarId = carId };
                receiverConversations.RemoveWhere(c => c.Equals(receiverConvo)); // Remove old one if exists
                receiverConversations.Add(receiverConvo); // Add updated one
            }
        }

        // Get recent messages for a car
        public async Task<List<object>> GetRecentCarMessages(string carId)
        {
            var userId = GetUserId();
            
            if (string.IsNullOrEmpty(userId))
            {
                throw new HubException("User not authenticated");
            }
            
            var groupName = $"car-{carId}-chat";
            
            if (RecentMessages.TryGetValue(groupName, out var messages))
            {
                return messages
                    .OrderBy(m => m.Timestamp)
                    .Select(m => new 
                    {
                        SenderId = m.SenderId,
                        Message = m.Message,
                        CarId = m.CarId,
                        IsOwnMessage = m.SenderId == userId,
                        Timestamp = m.Timestamp.ToString("o")
                    })
                    .Cast<object>()
                    .ToList();
            }
            
            return new List<object>();
        }
        
        // Get active conversations for the current user
        public async Task<List<object>> GetUserConversations()
        {
            var userId = GetUserId();
            
            if (string.IsNullOrEmpty(userId))
            {
                throw new HubException("User not authenticated");
            }
            
            if (UserConversations.TryGetValue(userId, out var conversations))
            {
                return conversations
                    .OrderByDescending(c => c.LastMessageTime)
                    .Select(c => new
                    {
                        UserId = c.UserId,
                        CarId = c.CarId,
                        LastMessageTime = c.LastMessageTime.ToString("o")
                    })
                    .Cast<object>()
                    .ToList();
            }
            
            return new List<object>();
        }
        
        // Simple method to get conversation details - who you're talking to about which car
        public async Task<object> GetConversationDetails(string otherUserId, string carId)
        {
            var userId = GetUserId();
            
            if (string.IsNullOrEmpty(userId))
            {
                throw new HubException("User not authenticated");
            }
            
            var groupName = $"car-{carId}-chat";
            
            // Get the last few messages
            var recentMessages = new List<object>();
            if (RecentMessages.TryGetValue(groupName, out var messages))
            {
                recentMessages = messages
                    .OrderByDescending(m => m.Timestamp)
                    .Take(10)
                    .OrderBy(m => m.Timestamp)
                    .Select(m => new
                    {
                        SenderId = m.SenderId,
                        Message = m.Message,
                        IsOwnMessage = m.SenderId == userId,
                        Timestamp = m.Timestamp.ToString("o")
                    })
                    .Cast<object>()
                    .ToList();
            }
            
            // Check if other user is online
            bool isUserOnline = UserConnections.ContainsKey(otherUserId);
            
            return new
            {
                CarId = carId,
                OtherUserId = otherUserId,
                IsUserOnline = isUserOnline,
                RecentMessages = recentMessages,
                GroupName = groupName
            };
        }
        
        // Quick reply to a conversation without having to specify all details
        public async Task ReplyToConversation(string otherUserId, string carId, string message)
        {
            // This method simplifies replying - it's basically SendCarInquiryMessage with a clearer name
            await SendCarInquiryMessage(otherUserId, carId, message);
        }

        // Send support message to admins
        public async Task SendSupportMessage(string message)
        {
            var senderId = GetUserId();
            
            if (string.IsNullOrEmpty(senderId))
            {
                throw new HubException("User not authenticated");
            }
            
            // Always send the message back to the sender first
            await Clients.Caller.SendAsync("ReceiveSupportMessage", senderId, message);
            
            // Send to all connected admins
            await Clients.Group("Admins").SendAsync("ReceiveSupportMessage", senderId, message);
            
            // Send notifications to all admins
            if (GroupConnections.TryGetValue("Admins", out var adminConnections))
            {
                foreach (var adminConnection in adminConnections)
                {
                    await Clients.Client(adminConnection).SendAsync("NewMessageNotification", new
                    {
                        SenderId = senderId,
                        MessagePreview = message.Length > 50 ? message.Substring(0, 47) + "..." : message,
                        Type = "Support"
                    });
                }
            }
            
            // Confirm to sender that message was sent
            await Clients.Caller.SendAsync("ReceiveSystemMessage", "Your support message has been sent to our admin team.");
        }

        // Admin can reply to a specific user
        public async Task SendAdminReply(string userId, string message)
        {
            var senderId = GetUserId();
            var senderRole = GetUserRole();
            
            if (string.IsNullOrEmpty(senderId) || senderRole != "Admin")
            {
                throw new HubException("Only admins can send admin replies");
            }
            
            // Always send the message back to the admin sender first
            await Clients.Caller.SendAsync("ReceiveAdminMessage", senderId, message, userId);
            
            if (UserConnections.TryGetValue(userId, out var connectionId))
            {
                // Send the admin reply
                await Clients.Client(connectionId).SendAsync("ReceiveAdminMessage", senderId, message);
                
                // Send notification
                await Clients.Client(connectionId).SendAsync("NewMessageNotification", new
                {
                    SenderId = senderId,
                    MessagePreview = message.Length > 50 ? message.Substring(0, 47) + "..." : message,
                    Type = "AdminReply"
                });
                
                // Send confirmation to admin
                await Clients.Caller.SendAsync("ReceiveSystemMessage", $"Your reply has been sent to user {userId}.");
            }
            else
            {
                // User is offline
                await Clients.Caller.SendAsync("ReceiveSystemMessage", "The user is currently offline. They will receive your message when they connect.");
            }
        }
    }
} 