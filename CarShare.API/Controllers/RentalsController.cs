using CarShare.BLL.DTOs.Rental;
using CarShare.BLL.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace CarShare.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class RentalsController : BaseController
    {
        private readonly IRentalService _rentalService;

        public RentalsController(IRentalService rentalService)
        {
            _rentalService = rentalService;
        }

        [Authorize(Roles = "Renter")]
        [HttpPost("proposals")]
        public async Task<IActionResult> CreateProposal([FromBody] RentalProposalDTO proposalDTO)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim))
                return Unauthorized("Invalid token: missing user ID.");

            var renterId = Guid.Parse(userIdClaim);

            var result = await _rentalService.CreateProposalAsync(proposalDTO, renterId);
            return CreatedAtAction(nameof(GetProposal), new { id = result.ProposalId }, result);
        }


        [Authorize(Roles = "CarOwner")]
        [HttpPatch("proposals/{id}/approve")]
        public async Task<IActionResult> ApproveProposal(Guid id)
        {
            // Get ownerId from JWT in real implementation
            var ownerId = Guid.Parse(User.FindFirst("sub")?.Value);
            await _rentalService.ApproveProposalAsync(id, ownerId);
            return NoContent();
        }

        [HttpGet("proposals/{id}")]
        public async Task<IActionResult> GetProposal(Guid id)
        {
            var proposal = await _rentalService.GetProposalByIdAsync(id);
            if (proposal == null)
                return NotFound();

            return Ok(proposal);
        }
    }
}