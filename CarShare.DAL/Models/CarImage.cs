using System.ComponentModel.DataAnnotations;

namespace CarShare.DAL.Models
{
    public class CarImage
    {
        [Key]
        public Guid ImageId { get; set; } = Guid.NewGuid();

        [Required]
        public Guid CarId { get; set; }

        [Required, MaxLength(255)]
        public string ImageUrl { get; set; }

        public bool IsMain { get; set; } = false;

        public DateTime UploadDate { get; set; } = DateTime.UtcNow;

        // Navigation property
        public Car Car { get; set; }
    }
}