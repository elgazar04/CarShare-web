namespace CarShare.BLL.DTOs.Chat
{
    public class ChatMessageDTO
    {
        public string SenderId { get; set; }
        public string SenderName { get; set; }
        public string Message { get; set; }
        public string CarId { get; set; }
        public string Timestamp { get; set; } = DateTime.UtcNow.ToString("o");
        public string MessageType { get; set; } // "CarInquiry", "Support", "AdminReply"
    }

    public class ChatNotificationDTO
    {
        public string SenderId { get; set; }
        public string MessagePreview { get; set; }
        public string CarId { get; set; }
        public string Type { get; set; }
        public string Timestamp { get; set; } = DateTime.UtcNow.ToString("o");
    }
} 