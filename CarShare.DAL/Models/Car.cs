using CarShare.DAL.Enums;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema; // ✅ لازم عشان [ForeignKey]

namespace CarShare.DAL.Models
{
    public class Car
    {
        [Key]
        public Guid CarId { get; set; } = Guid.NewGuid();

        [Required]
        public Guid OwnerId { get; set; }

        [Required, MaxLength(100)]
        public string Title { get; set; }

        public string? Description { get; set; }

        [Required]
        public CarType CarType { get; set; }

        [Required, MaxLength(50)]
        public string Brand { get; set; }

        [Required, MaxLength(50)]
        public string Model { get; set; }

        [Required]
        public int Year { get; set; }

        [Required]
        public TransmissionType Transmission { get; set; }

        [Required]
        public int Seats { get; set; }

        [Required]
        public FuelType FuelType { get; set; }

        [Required, MaxLength(20)]
        public string LicensePlate { get; set; }

        [Required, MaxLength(100)]
        public string Location { get; set; }

        public decimal? Latitude { get; set; }
        public decimal? Longitude { get; set; }

        [Required]
        public RentalStatus RentalStatus { get; set; } = RentalStatus.Available;

        [Required]
        public decimal PricePerDay { get; set; }

        public bool IsApproved { get; set; } = false;

        [Range(0, 5)]
        public decimal AverageRating { get; set; } = 0.00m;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        [ForeignKey("OwnerId")]
        public User Owner { get; set; }

        public ICollection<CarImage> CarImages { get; set; } = new List<CarImage>();
        public ICollection<RentalProposal> RentalProposals { get; set; } = new List<RentalProposal>();
        public ICollection<Review> Reviews { get; set; } = new List<Review>();
        public ICollection<CarFeatureMapping> CarFeatureMappings { get; set; } = new List<CarFeatureMapping>();
    }
}
