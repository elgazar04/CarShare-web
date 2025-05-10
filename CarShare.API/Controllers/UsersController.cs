using CarShare.BLL.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.IdentityModel.Tokens.Jwt;

namespace CarShare.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class UsersController : BaseController
    {
        private readonly IUserService _userService;

        public UsersController(IUserService userService)
        {
            _userService = userService;
        }

        [HttpGet("profile")]
        public async Task<IActionResult> GetProfile()
        {
            // Try to get user ID from different possible claim types
            var claim = User.FindFirst(JwtRegisteredClaimNames.Sub) ?? 
                        User.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier");
                        
            if (claim == null || string.IsNullOrEmpty(claim.Value))
            {
                return BadRequest("User ID not found in token claims. Please check your authentication.");
            }

            if (!Guid.TryParse(claim.Value, out Guid userId))
            {
                return BadRequest("Invalid user ID format in token.");
            }

            var result = await _userService.GetProfileAsync(userId);
            return HandleResult(result);
        }

        [HttpGet("{id}")]
        [AllowAnonymous] // Allow this endpoint to be accessed without authentication
        public async Task<IActionResult> GetUserById(Guid id)
        {
            var result = await _userService.GetProfileAsync(id);
            return HandleResult(result);
        }
    }
}