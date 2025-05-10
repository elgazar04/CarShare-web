using System.ComponentModel.DataAnnotations;

namespace CarShare.DAL.Models
{
    public class CarFeatureMapping
    {
        [Key]
        public Guid MappingId { get; set; } = Guid.NewGuid();

        [Required]
        public Guid CarId { get; set; }

        [Required]
        public Guid FeatureId { get; set; }

        // Navigation properties
        public Car Car { get; set; }
        public CarFeature Feature { get; set; }
    }
}