using CarShare.BLL.DTOs.Car;
using CarShare.DAL.Models;

namespace CarShare.BLL.Interfaces
{
    public interface ICarService
    {
        Task<CarResponseDTO> CreateAsync(CarCreateDTO carDTO, Guid ownerId);
        Task<IEnumerable<CarResponseDTO>> GetAllAvailableAsync();
        Task<CarResponseDTO> GetByIdAsync(Guid carId);
        Task ApproveCarAsync(Guid carId);
       // Task<IEnumerable<Car>> GetAllAvailableWithOwnerAsync();

    }
}