using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using CarShare.API.Hubs;
using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;

namespace CarShare.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ChatController : BaseController
    {
        private readonly IHubContext<ChatHub> _hubContext;

        public ChatController(IHubContext<ChatHub> hubContext)
        {
            _hubContext = hubContext;
        }

        [HttpGet("status")]
        public IActionResult GetChatStatus()
        {
            var userId = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value ?? 
                         User.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier")?.Value;
            
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            
            return Ok(new { 
                Status = "Active", 
                UserId = userId,
                Role = userRole,
                ConnectionInfo = "Use SignalR hub at /hubs/chat with your JWT token for real-time communication"
            });
        }

        // This endpoint helps with testing - it sends a notification to a specific user
        [HttpPost("test-notification")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> SendTestNotification([FromBody] TestNotificationRequest request)
        {
            if (string.IsNullOrEmpty(request.UserId) || string.IsNullOrEmpty(request.Message))
            {
                return BadRequest("User ID and message are required");
            }

            await _hubContext.Clients.User(request.UserId).SendAsync("NewMessageNotification", new
            {
                SenderId = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value,
                MessagePreview = request.Message.Length > 50 ? request.Message.Substring(0, 47) + "..." : request.Message,
                Type = "Test",
                Timestamp = DateTime.UtcNow.ToString("o")
            });

            return Ok(new { Message = "Test notification sent" });
        }
    }

    public class TestNotificationRequest
    {
        public string UserId { get; set; }
        public string Message { get; set; }
    }
} 