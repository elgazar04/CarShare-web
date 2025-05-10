using CarShare.BLL.DTOs.User;
using System.Threading.Tasks;

namespace CarShare.BLL.Interfaces
{
    public interface IUserService
    {
        Task<UserResponseDTO> RegisterAsync(UserCreateDTO userDTO);
        Task<string> LoginAsync(UserLoginDTO loginDTO);
        Task<UserResponseDTO> GetProfileAsync(Guid userId);
        Task VerifyCarOwnerAsync(Guid ownerId);
    }
}