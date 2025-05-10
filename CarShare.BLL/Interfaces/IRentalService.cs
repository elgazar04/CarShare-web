using CarShare.BLL.DTOs.Rental;

namespace CarShare.BLL.Interfaces
{
    public interface IRentalService
    {
        Task<RentalResponseDTO> CreateProposalAsync(RentalProposalDTO proposalDTO, Guid renterId);
        Task ApproveProposalAsync(Guid proposalId, Guid ownerId);
        Task<RentalResponseDTO?> GetProposalByIdAsync(Guid proposalId);

    }
}