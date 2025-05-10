using System.ComponentModel.DataAnnotations;

namespace CarShare.DAL.Models
{
    public class Review
    {
        [Key]
        public Guid ReviewId { get; set; } = Guid.NewGuid();

        [Required]
        public Guid CarId { get; set; }

        [Required]
        public Guid RenterId { get; set; }

        [Required]
        public Guid RentalId { get; set; }

        [Required, Range(1, 5)]
        public int Rating { get; set; }

        [MaxLength(1000)]
        public string? Comment { get; set; }

        public DateTime ReviewDate { get; set; } = DateTime.UtcNow;

        [MaxLength(1000)]
        public string? OwnerReply { get; set; }

        public DateTime? ReplyDate { get; set; }

        // Navigation properties
        public Car Car { get; set; }
        public User Renter { get; set; }
        public Rental Rental { get; set; }
    }
}