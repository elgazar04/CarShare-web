using AutoMapper;
using CarShare.BLL.DTOs.Rental;
using CarShare.BLL.Interfaces;
using CarShare.DAL.Enums;
using CarShare.DAL.Interfaces;
using CarShare.DAL.Models;
using Microsoft.EntityFrameworkCore;

namespace CarShare.BLL.Services
{
    public class RentalService : IRentalService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public RentalService(IUnitOfWork unitOfWork, IMapper mapper)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }

        public async Task<RentalResponseDTO> CreateProposalAsync(RentalProposalDTO proposalDTO, Guid renterId)
        {
            var car = await _unitOfWork.Cars.GetByIdAsync(proposalDTO.CarId);
            if (car == null) throw new Exception("Car not found");
            if (!car.IsApproved) throw new Exception("Car not approved for rental");

            var proposal = _mapper.Map<RentalProposal>(proposalDTO);
            proposal.RenterId = renterId;
            proposal.Status = ProposalStatus.Pending;

            await _unitOfWork.RentalProposals.AddAsync(proposal);
            await _unitOfWork.CommitAsync();

            // ✅ Reload proposal to include Renter
            var fullProposal = await _unitOfWork.Context.RentalProposals
                .Include(p => p.Renter)
                .FirstOrDefaultAsync(p => p.ProposalId == proposal.ProposalId);


            return _mapper.Map<RentalResponseDTO>(proposal);
        }

        public async Task ApproveProposalAsync(Guid proposalId, Guid ownerId)
        {
            var proposal = await _unitOfWork.RentalProposals.GetByIdAsync(proposalId);
            var car = await _unitOfWork.Cars.GetByIdAsync(proposal.CarId);

            if (car.OwnerId != ownerId)
                throw new Exception("Only car owner can approve proposals");

            proposal.Status = ProposalStatus.Accepted;
            car.RentalStatus = RentalStatus.Rented;

            await _unitOfWork.CommitAsync();
        }
        //public async Task<RentalResponseDTO?> GetProposalByIdAsync(Guid proposalId)
        //{
        //    var proposal = await _unitOfWork.RentalProposals.GetByIdAsync(proposalId);
        //    if (proposal == null)
        //        throw new Exception("Proposal not found");

        //    return _mapper.Map<RentalResponseDTO>(proposal);
        //}
        public async Task<RentalResponseDTO?> GetProposalByIdAsync(Guid proposalId)
        {
            var proposal = await _unitOfWork.RentalProposals
                .GetByIdWithIncludesAsync(p => p.ProposalId == proposalId,
                                          p => p.Car,
                                          p => p.Renter);

            if (proposal == null)
                throw new Exception("Proposal not found");

            return _mapper.Map<RentalResponseDTO>(proposal);
        }

    }
}