using CarShare.DAL.Enums;
using System.ComponentModel.DataAnnotations;

namespace CarShare.DAL.Models
{
    public class Rental
    {
        [Key]
        public Guid RentalId { get; set; } = Guid.NewGuid();

        [Required]
        public Guid ProposalId { get; set; }

        public DateTime? ActualStartDate { get; set; }
        public DateTime? ActualEndDate { get; set; }

        [Required]
        public RentalState Status { get; set; }

        public string? OwnerNotes { get; set; }
        public string? RenterNotes { get; set; }

        // Navigation properties
        public RentalProposal Proposal { get; set; }
        public Review Review { get; set; }
    }
}