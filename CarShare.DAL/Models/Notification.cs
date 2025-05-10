using System.ComponentModel.DataAnnotations;

namespace CarShare.DAL.Models
{
    public class Notification
    {
        [Key]
        public Guid NotificationId { get; set; } = Guid.NewGuid();

        [Required]
        public Guid UserId { get; set; }

        [Required, MaxLength(100)]
        public string Title { get; set; }

        [Required, MaxLength(500)]
        public string Message { get; set; }

        [Required, MaxLength(50)]
        public string NotificationType { get; set; }

        public bool IsRead { get; set; } = false;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public Guid? RelatedEntityId { get; set; }
        public string? RelatedEntityType { get; set; }

        // Navigation property
        public User User { get; set; }
    }
}