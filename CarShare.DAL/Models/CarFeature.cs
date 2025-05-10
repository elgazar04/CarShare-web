using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace CarShare.DAL.Models
{
    public class CarFeature
    {
        [Key]
        public Guid FeatureId { get; set; } = Guid.NewGuid();

        [Required, MaxLength(50)]
        public string Name { get; set; }

        [MaxLength(255)]
        public string? IconUrl { get; set; }

        // Navigation property
        public ICollection<CarFeatureMapping> CarFeatureMappings { get; set; } = new List<CarFeatureMapping>();
    }
}