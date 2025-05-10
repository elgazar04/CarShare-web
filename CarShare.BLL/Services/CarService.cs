using AutoMapper;
using CarShare.BLL.DTOs.Car;
using CarShare.BLL.Interfaces;
using CarShare.DAL.Enums;
using CarShare.DAL.Interfaces;
using CarShare.DAL.Models;
using Microsoft.EntityFrameworkCore;

namespace CarShare.BLL.Services
{
    public class CarService : ICarService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;
        private readonly IUserService _userService;

        public CarService(IUnitOfWork unitOfWork, IMapper mapper, IUserService userService)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
            _userService = userService;
        }

        public async Task<CarResponseDTO> CreateAsync(CarCreateDTO carDTO, Guid ownerId)
        {
            await _userService.VerifyCarOwnerAsync(ownerId);

            var car = _mapper.Map<Car>(carDTO);
            car.OwnerId = ownerId;
            car.IsApproved = false; // Still requires admin approval
            car.RentalStatus = RentalStatus.Available; // Ensure it's set to available by default

            await _unitOfWork.Cars.AddAsync(car);
            await _unitOfWork.CommitAsync();

            return _mapper.Map<CarResponseDTO>(car);
        }

        public async Task<IEnumerable<CarResponseDTO>> GetAllAvailableAsync()
        {
            var cars = await _unitOfWork.Context.Cars
                .Include(c => c.Owner)
                .Where(c => c.IsApproved && c.RentalStatus == RentalStatus.Available)
                .ToListAsync();

            return _mapper.Map<IEnumerable<CarResponseDTO>>(cars);
        }

        public async Task<CarResponseDTO> GetByIdAsync(Guid carId)
        {
            var car = await _unitOfWork.Context.Cars
                .Include(c => c.Owner)
                .FirstOrDefaultAsync(c => c.CarId == carId);
            return _mapper.Map<CarResponseDTO>(car);
        }

        public async Task ApproveCarAsync(Guid carId)
        {
            var car = await _unitOfWork.Cars.GetByIdAsync(carId);
            car.IsApproved = true;
            await _unitOfWork.CommitAsync();
        }
    }
}
