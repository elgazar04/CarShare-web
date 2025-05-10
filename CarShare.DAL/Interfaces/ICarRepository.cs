using CarShare.DAL.Models;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace CarShare.DAL.Interfaces
{
    public interface ICarRepository : IRepository<Car>
    {
        Task<IEnumerable<Car>> GetAvailableCarsAsync(DateTime startDate, DateTime endDate);
        Task<IEnumerable<Car>> GetCarsByOwnerAsync(Guid ownerId);
        Task<IEnumerable<Car>> SearchCarsAsync(string searchTerm, decimal? maxPrice);
    }
}