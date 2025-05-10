using CarShare.DAL.Enums;
using System.ComponentModel.DataAnnotations;

namespace CarShare.BLL.DTOs.User
{
    public class UserCreateDTO
    {
        [Required, MaxLength(50)]
        public string Username { get; set; }

        [Required, EmailAddress]
        public string Email { get; set; }

        [Required, MinLength(8)]
        public string Password { get; set; }

        [Required]
        public string FirstName { get; set; }

        [Required]
        public string LastName { get; set; }

        public string? PhoneNumber { get; set; }

        [Required]
        public UserRole Role { get; set; }
    }
}