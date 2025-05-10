using CarShare.DAL.Enums;
using System.ComponentModel.DataAnnotations;

namespace CarShare.DAL.Models
{
    public class RentalProposal
    {
        [Key]
        public Guid ProposalId { get; set; } = Guid.NewGuid();

        [Required]
        public Guid CarId { get; set; }

        [Required]
        public Guid RenterId { get; set; }

        public DateTime ProposalDate { get; set; } = DateTime.UtcNow;

        [Required]
        public DateTime StartDate { get; set; }

        [Required]
        public DateTime EndDate { get; set; }

        [Required]
        public decimal TotalPrice { get; set; }

        [Required]
        public ProposalStatus Status { get; set; } = ProposalStatus.Pending;

        [Required, MaxLength(255)]
        public string LicenseVerificationUrl { get; set; }

        [MaxLength(255)]
        public string? AdditionalDocumentsUrl { get; set; }

        [MaxLength(500)]
        public string? Message { get; set; }

        // Navigation properties
        public Car Car { get; set; }
        public User Renter { get; set; }
        public Rental Rental { get; set; }
    }
}