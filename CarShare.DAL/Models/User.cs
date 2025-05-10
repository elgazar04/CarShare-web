using CarShare.DAL.Enums;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CarShare.DAL.Models
{
    public class User
    {
        [Key]
        public Guid UserId { get; set; } = Guid.NewGuid();

        [Required, MaxLength(50)]
        public string Username { get; set; }

        [Required, MaxLength(100), EmailAddress]
        public string Email { get; set; }

        [Required]
        [Column(TypeName = "varbinary(MAX)")]
        public byte[] PasswordHash { get; set; }


        [Required]
        [Column(TypeName = "varbinary(128)")]
        public byte[] PasswordSalt { get; set; }

        [Required, MaxLength(50)]
        public string FirstName { get; set; }

        [Required, MaxLength(50)]
        public string LastName { get; set; }

        [MaxLength(20)]
        public string? PhoneNumber { get; set; }

        [Required]
        public UserRole Role { get; set; }

        public bool IsVerified { get; set; } = false;

        [MaxLength(255)]
        public string? ProfilePictureUrl { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? LastLogin { get; set; }
        public bool IsActive { get; set; } = true;

        // Navigation properties
        public ICollection<Car> OwnedCars { get; set; } = new List<Car>();
        public ICollection<RentalProposal> RentalProposals { get; set; } = new List<RentalProposal>();
        public ICollection<Review> Reviews { get; set; } = new List<Review>();
        public ICollection<Notification> Notifications { get; set; } = new List<Notification>();
    }
}