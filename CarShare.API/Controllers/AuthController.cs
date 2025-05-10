using CarShare.BLL.DTOs.User;
using CarShare.BLL.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace CarShare.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : BaseController
    {
        private readonly IUserService _userService;

        public AuthController(IUserService userService)
        {
            _userService = userService;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] UserCreateDTO userDTO)
        {
            var result = await _userService.RegisterAsync(userDTO);
            return HandleResult(result);
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] UserLoginDTO loginDTO)
        {
            try
            {
                var token = await _userService.LoginAsync(loginDTO);
                return Ok(new { Token = token });
            }
            catch (Exception ex)
            {
                // نرجع رسالة خطأ واضحة
                return Unauthorized(new { message = ex.Message });
            }
        }


    }
}