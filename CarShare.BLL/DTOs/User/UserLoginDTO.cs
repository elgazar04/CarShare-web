using System.ComponentModel.DataAnnotations;

namespace CarShare.BLL.DTOs.User
{
    public class UserLoginDTO
    {
        [Required]
        public string Email { get; set; }

        [Required]
        public string Password { get; set; }
    }
}